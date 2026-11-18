package com.adriymine.tts.service

import android.content.Context
import android.util.Log
import com.adriymine.tts.data.Library
import com.adriymine.tts.data.LibraryItem
import com.adriymine.tts.data.Settings
import com.adriymine.tts.data.prosodyFor
import com.adriymine.tts.tts.EdgeTtsClient
import com.adriymine.tts.tts.Mp3
import com.adriymine.tts.tts.Prosody
import com.adriymine.tts.tts.TextProcessor
import com.adriymine.tts.tts.VoiceCatalog
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.atomic.AtomicInteger

enum class JobStatus { IDLE, PREPARING, RUNNING, ERROR, DONE, CANCELLED }

data class JobState(
    val jobId: String = "",
    val title: String = "",
    val voiceName: String = "",
    val status: JobStatus = JobStatus.IDLE,
    val total: Int = 0,
    val completed: Int = 0,
    /** Jumlah potongan berurutan dari awal yang sudah siap diputar. */
    val readyPrefix: Int = 0,
    val readyFiles: List<File> = emptyList(),
    val message: String? = null,
    val result: LibraryItem? = null,
    val exportedTo: String? = null,
) {
    val progress: Float get() = if (total == 0) 0f else completed.toFloat() / total
    val active: Boolean get() = status == JobStatus.PREPARING || status == JobStatus.RUNNING
}

/**
 * Mesin konversi teks panjang: memecah teks, mensintesis paralel (dengan retry),
 * menyimpan tiap potongan ke disk (bisa dilanjutkan bila gagal), lalu menggabungkan
 * menjadi satu MP3 di Pustaka.
 */
class SynthesisEngine(
    private val context: Context,
    private val library: Library,
    private val client: EdgeTtsClient = EdgeTtsClient(),
) {
    private val handler = CoroutineExceptionHandler { _, e -> Log.e("Engine", "error", e) }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO + handler)
    private val _state = MutableStateFlow(JobState())
    val state: StateFlow<JobState> = _state.asStateFlow()
    private var job: Job? = null
    private val vox = com.adriymine.tts.tts.VoxClient()
    /** Alamat & token server VoxCPM2 (diisi App dari Pengaturan). */
    var voxConfig: () -> Pair<String, String> = { "" to "" }

    /** Satu bagian teks -> audio, lewat Microsoft (Gadis/Ardi) atau server VoxCPM2 pengguna. */
    private suspend fun synth(voice: com.adriymine.tts.tts.Voice, text: String, prosody: Prosody, attempts: Int): com.adriymine.tts.tts.SynthResult {
        if (voice.isVox) {
            val (url, token) = voxConfig()
            vox.hfToken = hfToken()
            return com.adriymine.tts.tts.SynthResult(vox.synthesize(url, token, text, voice.voxVoice, attempts), emptyList())
        }
        return client.synthesize(text, voice.serverId, prosody, attempts = attempts)
    }

    var hfToken: () -> String = { "" }

    suspend fun voxHealth() = voxConfig().let { (u, t) -> vox.hfToken = hfToken(); vox.health(u, t) }
    private val jobsRoot = File(context.cacheDir, "jobs").apply { mkdirs() }

    private data class Spec(
        val id: String, val title: String, val voiceId: String, val prosody: Prosody,
        val pauseMs: Int, val sentenceMs: Int, val words: Int, val preview: String, val chunks: List<TextProcessor.Chunk>,
        val concurrency: Int, val autoSave: Boolean,
    )

    private var current: Spec? = null

    // ---------- Kesehatan suara ----------
    private val health = java.util.concurrent.ConcurrentHashMap<String, Pair<Boolean, Long>>()

    /** Cek cepat apakah server sedang melayani suara ini (hasil di-cache 10 menit). */
    suspend fun isVoiceHealthy(voiceId: String, force: Boolean = false): Boolean {
        if (VoiceCatalog.find(voiceId).isVox) return voxHealth().ok
        val cached = health[voiceId]
        if (!force && cached != null && System.currentTimeMillis() - cached.second < 10 * 60_000) return cached.first
        val ok = try {
            kotlinx.coroutines.withTimeout(25_000) {
                client.synthesize("Halo, apa kabar?", VoiceCatalog.find(voiceId).serverId, Prosody(), attempts = 2).audio.isNotEmpty()
            }
        } catch (e: CancellationException) {
            if (e is kotlinx.coroutines.TimeoutCancellationException) false else throw e
        } catch (e: Exception) {
            // Tanpa internet: jangan tandai suara rusak.
            if (e.message?.contains("internet") == true || e.cause is java.net.UnknownHostException) return true
            false
        }
        health[voiceId] = ok to System.currentTimeMillis()
        return ok
    }

    fun knownHealth(): Map<String, Boolean> = health.mapValues { it.value.first }

    /** Suara pengganti paling mirip (gender sama, skor tertinggi) yang sedang sehat. */
    suspend fun fallbackFor(voice: com.adriymine.tts.tts.Voice): com.adriymine.tts.tts.Voice? {
        // Pengganti: suara dasar lain (Gadis <-> Ardi) dengan gaya serupa.
        val candidates = VoiceCatalog.curated
            .filter { it.serverId != voice.serverId }
            .sortedWith(compareBy({ it.styleName != voice.styleName }, { -it.score }))
        for (c in candidates) if (isVoiceHealthy(c.id)) return c
        return null
    }

    fun start(rawText: String, title: String, s: Settings) {
        if (_state.value.active) return
        val id = "a" + System.currentTimeMillis()
        _state.value = JobState(jobId = id, title = title, status = JobStatus.PREPARING,
            voiceName = VoiceCatalog.find(s.voiceId).name)
        job = scope.launch {
            try {
                // bersihkan pekerjaan lama
                jobsRoot.listFiles()?.forEach { it.deleteRecursively() }
                var voice = VoiceCatalog.find(s.voiceId)
                var notice: String? = null
                if (voice.isVox) {
                    val h = voxHealth()
                    if (!h.ok) {
                        val alt = VoiceCatalog.find(if (voice.gender == com.adriymine.tts.tts.Gender.MALE) "ardi-natural" else "gadis-natural")
                        notice = "Server VoxCPM2 tidak terhubung (${h.message}). Otomatis memakai ${alt.name} agar tetap jadi."
                        voice = alt
                        _state.update { it.copy(voiceName = alt.name, message = notice) }
                    }
                } else if (!isVoiceHealthy(voice.id, force = true)) {
                    val alt = fallbackFor(voice)
                    if (alt != null) {
                        notice = "Suara ${voice.name} sedang tidak tersedia di server Microsoft, otomatis memakai ${alt.name}."
                        voice = alt
                        _state.update { it.copy(voiceName = alt.name, message = notice) }
                    }
                }
                val prepared = TextProcessor.prepare(
                    rawText,
                    TextProcessor.Options(
                        numbersToWords = s.numbersToWords,
                        expandAbbreviations = s.expandAbbreviations,
                        // Huruf selalu dieja ala KBBI (a, be, ce, ... ki, ... zet) agar tidak dibaca gaya Inggris.
                        spellLettersIndo = true,
                        mergeShortSentences = voice.isMultilingual,
                    )
                )
                // Suara multibahasa dihasilkan server lebih lambat dari waktu putarnya (uji: 900 karakter
                // butuh ±128 dtk untuk 79 dtk audio). Potongan dibuat kecil & bertahap agar audio cepat
                // mulai (±10 dtk) dan pemutaran tidak tersendat; suara asli Indonesia jauh lebih cepat.
                val chunks = if (voice.isVox) TextProcessor.chunk(prepared, maxChars = 320, mergeLimit = 320, ramp = listOf(140, 220, 320))
                else if (voice.isMultilingual) TextProcessor.chunk(prepared, maxChars = 480, mergeLimit = 480, ramp = listOf(170, 240, 360))
                else TextProcessor.chunk(prepared, maxChars = 1500, mergeLimit = 900, ramp = listOf(260, 500, 900))
                if (chunks.isEmpty()) {
                    _state.update { it.copy(status = JobStatus.ERROR, message = "Teks kosong atau tidak berisi kata.") }
                    return@launch
                }
                val spec = Spec(
                    id = id, title = title, voiceId = voice.id,
                    prosody = s.prosodyFor(voice),
                    pauseMs = (450 * voice.pauseScale).toInt(), sentenceMs = (650 * voice.pauseScale).toInt(),
                    words = TextProcessor.countWords(rawText),
                    preview = rawText.trim().take(160), chunks = chunks,
                    // Uji beban: 8 proses paralel 1,75x lebih cepat dari 4, tanpa kegagalan.
                    concurrency = if (voice.isVox) 2 else 8,
                    autoSave = s.autoSaveToDownloads,
                )
                current = spec
                persist(spec)
                run(spec, notice)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Throwable) {
                Log.e("Engine", "start", e)
                _state.update { it.copy(status = JobStatus.ERROR, message = "Terjadi kesalahan: ${e.message}") }
            }
        }
    }

    /** Lanjutkan pekerjaan yang gagal (potongan yang sudah jadi tidak diulang). */
    fun resume() {
        if (_state.value.active) return
        val spec = current ?: loadPersisted() ?: return
        current = spec
        _state.update { it.copy(status = JobStatus.RUNNING, message = null) }
        job = scope.launch {
            try { run(spec) } catch (e: CancellationException) { throw e } catch (e: Throwable) {
                _state.update { it.copy(status = JobStatus.ERROR, message = "Terjadi kesalahan: ${e.message}") }
            }
        }
    }

    fun hasResumable(): Boolean = (current ?: loadPersisted()) != null &&
        _state.value.status != JobStatus.DONE

    fun cancel() {
        job?.cancel()
        _state.update { it.copy(status = JobStatus.CANCELLED, message = "Dibatalkan") }
    }

    fun dismiss() {
        if (!_state.value.active) _state.value = JobState()
    }

    private fun dirOf(spec: Spec) = File(jobsRoot, spec.id).apply { mkdirs() }
    private fun partFile(spec: Spec, i: Int) = File(dirOf(spec), "%05d.mp3".format(i))

    private suspend fun run(spec: Spec, notice: String? = null) {
        val total = spec.chunks.size
        val doneFlags = BooleanArray(total) { partFile(spec, it).let { f -> f.exists() && f.length() > 0 } }
        val completed = AtomicInteger(doneFlags.count { it })
        fun publish(msg: String? = null) {
            var prefix = 0
            while (prefix < total && doneFlags[prefix]) prefix++
            _state.update {
                it.copy(
                    jobId = spec.id, title = spec.title, status = JobStatus.RUNNING,
                    voiceName = VoiceCatalog.find(spec.voiceId).name,
                    total = total, completed = completed.get(), readyPrefix = prefix,
                    readyFiles = (0 until prefix).map { i -> partFile(spec, i) },
                    message = msg,
                )
            }
        }
        publish(notice)
        val sem = Semaphore(spec.concurrency.coerceIn(1, 8))
        val failures = ArrayList<String>()
        val styleVoice = VoiceCatalog.find(spec.voiceId)
        // Coba ulang otomatis bertahap (±12 menit total) sebelum menyerah: gangguan internet
        // sesaat tidak membuat proses gagal; bagian yang sudah jadi tidak diulang.
        for (round in 0 until 12) {
        failures.clear()
        if (round > 0) {
            val wait = minOf(10_000L * round, 90_000L)
            publish("Koneksi terganggu. Mencoba lagi otomatis dalam ${wait / 1000} detik… (${completed.get()}/$total bagian aman tersimpan)")
            kotlinx.coroutines.delay(wait)
            publish("Melanjutkan…")
        }
        kotlinx.coroutines.coroutineScope {
            (0 until total).filter { !doneFlags[it] }.map { i ->
                async {
                    sem.withPermit {
                        val chunk = spec.chunks[i]
                        try {
                            val res = synth(styleVoice, chunk.text, spec.prosody, attempts = 4)
                            val polished = runCatching {
                                Mp3.polish(
                                    res.audio, res.words, chunk.text,
                                    Mp3.PauseSpec(spec.sentenceMs, spec.pauseMs, 1.0 + spec.prosody.ratePercent / 100.0),
                                    if (chunk.endsParagraph) Mp3.Boundary.PARAGRAPH else Mp3.Boundary.SENTENCE,
                                    isLast = i == total - 1,
                                    gainSteps = VoiceCatalog.find(spec.voiceId).gainSteps,
                                )
                            }.getOrElse { res.audio }
                            val f = partFile(spec, i)
                            val tmp = File(f.parentFile, f.name + ".tmp")
                            tmp.outputStream().buffered().use { out -> out.write(polished) }
                            tmp.renameTo(f)
                            synchronized(doneFlags) { doneFlags[i] = true }
                            completed.incrementAndGet()
                            publish()
                        } catch (e: CancellationException) {
                            throw e
                        } catch (e: Throwable) {
                            synchronized(failures) { failures.add("bagian ${i + 1}: ${e.message}") }
                        }
                    }
                }
            }.awaitAll()
        }
        if (failures.isEmpty()) break
        }
        if (failures.isNotEmpty()) {
            val down = !isVoiceHealthy(spec.voiceId, force = true)
            _state.update {
                it.copy(
                    status = JobStatus.ERROR,
                    message = if (down) "Suara ${VoiceCatalog.find(spec.voiceId).name} sedang gangguan di server Microsoft. " +
                        "Tekan \"Lanjutkan\" beberapa saat lagi (bagian yang sudah jadi tidak diulang), atau pilih suara lain lalu buat ulang."
                    else "${failures.size} bagian gagal (${failures.first()}). " +
                        "Periksa koneksi internet lalu tekan \"Lanjutkan\" — bagian yang sudah jadi tidak diulang."
                )
            }
            return
        }
        // gabungkan
        val dest = library.audioFile(spec.id)
        Mp3.concat((0 until total).map { partFile(spec, it) }, dest)
        val voice = VoiceCatalog.find(spec.voiceId)
        var item = LibraryItem(
            id = spec.id, title = spec.title, voiceId = voice.id, voiceName = voice.name,
            createdAt = System.currentTimeMillis(), durationSec = Mp3.durationSec(dest.length()),
            words = spec.words, preview = spec.preview, file = dest,
        )
        var exported: String? = null
        if (spec.autoSave) {
            exported = runCatching { Exporter.saveToDownloads(context, dest, spec.title) }.getOrNull()
            if (exported != null) item = item.copy(exportedTo = exported)
        }
        library.save(item)
        File(jobsRoot, spec.id + ".json").delete()
        current = null
        _state.update {
            it.copy(status = JobStatus.DONE, completed = total, readyPrefix = total,
                readyFiles = (0 until total).map { i -> partFile(spec, i) },
                result = item, exportedTo = exported, message = null)
        }
    }

    private fun persist(spec: Spec) {
        runCatching {
            val arr = JSONArray()
            spec.chunks.forEach { arr.put(JSONObject().put("t", it.text).put("p", it.endsParagraph)) }
            val o = JSONObject().put("id", spec.id).put("title", spec.title).put("voice", spec.voiceId)
                .put("rate", spec.prosody.ratePercent).put("pitch", spec.prosody.pitchHz)
                .put("volume", spec.prosody.volumePercent).put("pause", spec.pauseMs).put("spause", spec.sentenceMs)
                .put("words", spec.words).put("preview", spec.preview).put("conc", spec.concurrency)
                .put("auto", spec.autoSave).put("chunks", arr)
            File(jobsRoot, spec.id + ".json").writeText(o.toString())
        }
    }

    private fun loadPersisted(): Spec? = runCatching {
        val f = jobsRoot.listFiles { x -> x.name.endsWith(".json") }?.maxByOrNull { it.lastModified() } ?: return null
        val o = JSONObject(f.readText())
        val arr = o.getJSONArray("chunks")
        Spec(
            id = o.getString("id"), title = o.getString("title"), voiceId = o.getString("voice"),
            prosody = Prosody(o.optInt("rate"), o.optInt("pitch"), o.optInt("volume")),
            pauseMs = o.optInt("pause", 450), sentenceMs = o.optInt("spause", 650), words = o.optInt("words"), preview = o.optString("preview"),
            chunks = (0 until arr.length()).map { i ->
                val c = arr.getJSONObject(i); TextProcessor.Chunk(c.getString("t"), c.optBoolean("p", true))
            },
            concurrency = o.optInt("conc", 3), autoSave = o.optBoolean("auto", true),
        )
    }.getOrNull()

    /**
     * Pratinjau: proses teks pendek persis seperti konversi penuh (normalisasi, jeda,
     * setelan optimal), hasil di-cache agar bisa diputar ulang instan.
     */
    suspend fun preview(voiceId: String, text: String, s: Settings): File {
        val dir = File(context.cacheDir, "preview").apply { mkdirs() }
        val voice = VoiceCatalog.find(voiceId)
        val prosody = s.prosodyFor(voice)
        val key = listOf(voiceId, text, prosody, s.sentencePauseMs, s.paragraphPauseMs, s.numbersToWords,
            s.expandAbbreviations, s.spellLettersMultilingual).hashCode()
        val f = File(dir, "${voiceId}_$key.mp3")
        if (f.exists() && f.length() > 0) return f
        val prepared = TextProcessor.prepare(text, TextProcessor.Options(
            numbersToWords = s.numbersToWords, expandAbbreviations = s.expandAbbreviations,
            spellLettersIndo = true,
            mergeShortSentences = voice.isMultilingual,
        ))
        val joined = TextProcessor.chunk(prepared, maxChars = 2500, mergeLimit = 2500, firstLimit = 2500)
            .joinToString("\n") { it.text }.ifBlank { prepared }
        val res = synth(voice, joined, prosody, attempts = 3)
        val bytes = runCatching {
            Mp3.polish(res.audio, res.words, joined,
                Mp3.PauseSpec((650 * voice.pauseScale).toInt(), (450 * voice.pauseScale).toInt(), 1.0 + prosody.ratePercent / 100.0),
                Mp3.Boundary.PARAGRAPH, isLast = true, gainSteps = voice.gainSteps)
        }.getOrElse { res.audio }
        val tmp = File(dir, f.name + ".tmp")
        tmp.writeBytes(bytes)
        tmp.renameTo(f)
        // batasi ukuran cache pratinjau
        dir.listFiles()?.sortedByDescending { it.lastModified() }?.drop(60)?.forEach { it.delete() }
        return f
    }

    suspend fun fetchAllVoices() = client.fetchVoices()
}
