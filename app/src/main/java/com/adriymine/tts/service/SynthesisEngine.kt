package com.adriymine.tts.service

import android.content.Context
import android.util.Log
import com.adriymine.tts.data.Library
import com.adriymine.tts.data.LibraryItem
import com.adriymine.tts.data.Settings
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
    private val jobsRoot = File(context.cacheDir, "jobs").apply { mkdirs() }

    private data class Spec(
        val id: String, val title: String, val voiceId: String, val prosody: Prosody,
        val pauseMs: Int, val words: Int, val preview: String, val chunks: List<TextProcessor.Chunk>,
        val concurrency: Int, val autoSave: Boolean,
    )

    private var current: Spec? = null

    fun start(rawText: String, title: String, s: Settings) {
        if (_state.value.active) return
        val id = "a" + System.currentTimeMillis()
        _state.value = JobState(jobId = id, title = title, status = JobStatus.PREPARING,
            voiceName = VoiceCatalog.find(s.voiceId).name)
        job = scope.launch {
            try {
                // bersihkan pekerjaan lama
                jobsRoot.listFiles()?.forEach { it.deleteRecursively() }
                val voice = VoiceCatalog.find(s.voiceId)
                val prepared = TextProcessor.prepare(
                    rawText,
                    TextProcessor.Options(
                        numbersToWords = s.numbersToWords,
                        expandAbbreviations = s.expandAbbreviations,
                        spellLettersIndo = s.spellLettersMultilingual && voice.isMultilingual,
                    )
                )
                val chunks = TextProcessor.chunk(prepared)
                if (chunks.isEmpty()) {
                    _state.update { it.copy(status = JobStatus.ERROR, message = "Teks kosong atau tidak berisi kata.") }
                    return@launch
                }
                val spec = Spec(
                    id = id, title = title, voiceId = voice.id,
                    prosody = Prosody(s.rate, s.pitch, s.volume), pauseMs = s.paragraphPauseMs,
                    words = TextProcessor.countWords(rawText),
                    preview = rawText.trim().take(160), chunks = chunks,
                    concurrency = s.concurrency, autoSave = s.autoSaveToDownloads,
                )
                current = spec
                persist(spec)
                run(spec)
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

    private suspend fun run(spec: Spec) {
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
        publish()
        val sem = Semaphore(spec.concurrency.coerceIn(1, 6))
        val failures = ArrayList<String>()
        kotlinx.coroutines.coroutineScope {
            (0 until total).filter { !doneFlags[it] }.map { i ->
                async {
                    sem.withPermit {
                        val chunk = spec.chunks[i]
                        try {
                            val audio = client.synthesize(chunk.text, spec.voiceId, spec.prosody) { n, e ->
                                publish("Mengulang bagian ${i + 1} (percobaan $n): ${e.message}")
                            }
                            val f = partFile(spec, i)
                            val tmp = File(f.parentFile, f.name + ".tmp")
                            tmp.outputStream().buffered().use { out ->
                                out.write(audio)
                                if (chunk.endsParagraph && i < total - 1 && spec.pauseMs > 0) {
                                    Mp3.writeSilence(out, spec.pauseMs)
                                }
                            }
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
        if (failures.isNotEmpty()) {
            _state.update {
                it.copy(
                    status = JobStatus.ERROR,
                    message = "${failures.size} bagian gagal (${failures.first()}). " +
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
                .put("volume", spec.prosody.volumePercent).put("pause", spec.pauseMs)
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
            pauseMs = o.optInt("pause", 450), words = o.optInt("words"), preview = o.optString("preview"),
            chunks = (0 until arr.length()).map { i ->
                val c = arr.getJSONObject(i); TextProcessor.Chunk(c.getString("t"), c.optBoolean("p", true))
            },
            concurrency = o.optInt("conc", 3), autoSave = o.optBoolean("auto", true),
        )
    }.getOrNull()

    /** Contoh suara pendek (di-cache). */
    suspend fun preview(voiceId: String, text: String, prosody: Prosody): File {
        val dir = File(context.cacheDir, "preview").apply { mkdirs() }
        val f = File(dir, "${voiceId}_${(text + prosody).hashCode()}.mp3")
        if (f.exists() && f.length() > 0) return f
        val voice = VoiceCatalog.find(voiceId)
        val prepared = TextProcessor.prepare(text, TextProcessor.Options(spellLettersIndo = voice.isMultilingual))
        val bytes = client.synthesize(prepared, voiceId, prosody, attempts = 3)
        val tmp = File(dir, f.name + ".tmp")
        tmp.writeBytes(bytes)
        tmp.renameTo(f)
        return f
    }

    suspend fun fetchAllVoices() = client.fetchVoices()
}
