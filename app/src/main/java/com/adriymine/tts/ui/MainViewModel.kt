package com.adriymine.tts.ui

import android.app.Application
import android.content.ComponentName
import android.net.Uri
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.adriymine.tts.App
import com.adriymine.tts.data.LibraryItem
import com.adriymine.tts.data.Settings
import com.adriymine.tts.service.Exporter
import com.adriymine.tts.service.JobStatus
import com.adriymine.tts.service.PlaybackService
import com.adriymine.tts.service.SynthesisService
import com.adriymine.tts.tts.TextProcessor
import com.adriymine.tts.tts.Voice
import com.adriymine.tts.tts.VoiceCatalog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

data class PlayerUi(
    val connected: Boolean = false,
    val hasMedia: Boolean = false,
    val playing: Boolean = false,
    val buffering: Boolean = false,
    val title: String = "",
    val subtitle: String = "",
    val positionMs: Long = 0,
    val durationMs: Long = 0,
    val speed: Float = 1f,
    val error: String? = null,
)

const val DEFAULT_PREVIEW = "Halo! Selamat datang. Hari ini cuaca cerah sekali, dan aku ingin bercerita tentang perjalananku mencari kuliner di Yogyakarta. Rasanya menyenangkan, ya?"

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val ctx = app
    private val a = App.get(app)
    val settings = a.prefs.state
    val job = a.engine.state
    val library = a.library.items

    private val draftFile = File(app.filesDir, "draft.txt")
    private val titleFile = File(app.filesDir, "draft_title.txt")
    val text = MutableStateFlow("")
    val title = MutableStateFlow("")
    private var saveDraftJob: Job? = null

    private val _player = MutableStateFlow(PlayerUi())
    val player = _player.asStateFlow()
    private var controller: MediaController? = null

    private val _previewing = MutableStateFlow<String?>(null)
    val previewing = _previewing.asStateFlow()

    private val _allVoices = MutableStateFlow<List<Voice>>(emptyList())
    val allVoices = _allVoices.asStateFlow()
    private val _voicesLoading = MutableStateFlow(false)
    val voicesLoading = _voicesLoading.asStateFlow()

    /** Berapa potongan pekerjaan yang sudah dimasukkan ke pemutar (mode dengar sambil proses). */
    private var streamJobId: String? = null
    private var streamAdded = 0

    init {
        viewModelScope.launch(Dispatchers.IO) {
            runCatching { text.value = if (draftFile.exists()) draftFile.readText() else "" }
            runCatching { title.value = if (titleFile.exists()) titleFile.readText() else "" }
            a.library.refresh()
        }
        connectPlayer()
        viewModelScope.launch {
            job.collect { s ->
                if (streamJobId == s.jobId && s.readyFiles.size > streamAdded) {
                    val c = controller ?: return@collect
                    val newFiles = s.readyFiles.subList(streamAdded, s.readyFiles.size)
                    runCatching {
                        newFiles.forEachIndexed { k, f ->
                            c.addMediaItem(item(f, s.title, "Bagian ${streamAdded + k + 1}", "${s.jobId}_${streamAdded + k}"))
                        }
                        streamAdded = s.readyFiles.size
                        if (c.playbackState == Player.STATE_ENDED || c.playbackState == Player.STATE_IDLE) {
                            c.prepare()
                            if (c.playbackState == Player.STATE_ENDED) c.seekToNextMediaItem()
                            c.play()
                        }
                    }
                }
                if (s.status == JobStatus.DONE && s.result != null && streamJobId == s.jobId) {
                    streamJobId = null
                }
            }
        }
    }

    // ---------- Teks ----------

    fun setText(t: String) {
        text.value = t
        scheduleDraftSave()
    }

    fun setTitle(t: String) {
        title.value = t
        scheduleDraftSave()
    }

    private fun scheduleDraftSave() {
        saveDraftJob?.cancel()
        saveDraftJob = viewModelScope.launch(Dispatchers.IO) {
            delay(600)
            runCatching { draftFile.writeText(text.value) }
            runCatching { titleFile.writeText(title.value) }
        }
    }

    fun importText(uri: Uri) {
        viewModelScope.launch {
            val r = withContext(Dispatchers.IO) {
                runCatching {
                    ctx.contentResolver.openInputStream(uri)?.use { input ->
                        val bytes = input.readBytes()
                        if (bytes.size > 8_000_000) throw IllegalStateException("File terlalu besar (maks 8 MB)")
                        String(bytes, Charsets.UTF_8).removePrefix("﻿")
                    } ?: throw IllegalStateException("File tidak bisa dibuka")
                }
            }
            r.onSuccess {
                setText(it)
                val name = uri.lastPathSegment?.substringAfterLast('/')?.substringBeforeLast('.')
                if (title.value.isBlank() && !name.isNullOrBlank()) setTitle(name)
                toast("Teks dimuat: ${TextProcessor.countWords(it)} kata")
            }.onFailure { toast("Gagal membuka file: ${it.message}") }
        }
    }

    // ---------- Pengaturan ----------

    fun updateSettings(f: (Settings) -> Settings) = a.prefs.update(f)

    fun selectVoice(id: String) = updateSettings { it.copy(voiceId = id) }

    fun voiceOf(id: String): Voice = VoiceCatalog.find(id, _allVoices.value)

    fun loadAllVoices() {
        if (_voicesLoading.value || _allVoices.value.isNotEmpty()) return
        _voicesLoading.value = true
        viewModelScope.launch {
            runCatching { a.engine.fetchAllVoices() }
                .onSuccess { list ->
                    val curatedIds = VoiceCatalog.curated.map { it.id }.toSet()
                    _allVoices.value = list.filter { it.id !in curatedIds }.sortedBy { it.locale + it.name }
                }
                .onFailure { toast("Gagal memuat daftar suara: ${it.message}") }
            _voicesLoading.value = false
        }
    }

    // ---------- Konversi ----------

    fun generate(): Boolean {
        val t = text.value
        if (TextProcessor.countWords(t) == 0) { toast("Tulis atau tempel teks terlebih dahulu"); return false }
        if (job.value.active) { toast("Masih ada proses berjalan"); return false }
        val s = settings.value
        val ttl = title.value.ifBlank {
            t.trim().lineSequence().firstOrNull { it.isNotBlank() }?.take(40)?.trim() ?: "Audio"
        }
        a.engine.start(t, ttl, s)
        SynthesisService.start(ctx)
        if (s.playWhileGenerating) {
            val c = controller
            runCatching { c?.stop(); c?.clearMediaItems() }
            streamJobId = job.value.jobId
            streamAdded = 0
            runCatching { c?.setPlaybackParameters(PlaybackParameters(_player.value.speed)) }
        } else {
            streamJobId = null
            // potongan lama di cache akan dihapus: hentikan bila sedang diputar
            val c = controller
            if (c?.currentMediaItem?.mediaId?.startsWith("a") == true) runCatching { c.stop(); c.clearMediaItems() }
        }
        return true
    }

    fun resumeJob() {
        a.engine.resume()
        SynthesisService.start(ctx)
    }

    fun cancelJob() = a.engine.cancel()
    fun dismissJob() = a.engine.dismiss()

    private val _voiceHealth = MutableStateFlow<Map<String, Boolean>>(emptyMap())
    val voiceHealth = _voiceHealth.asStateFlow()
    private var healthJob: Job? = null

    /** Cek ketersediaan semua suara di server (dipanggil saat layar Suara dibuka). */
    fun checkVoices() {
        if (healthJob?.isActive == true) return
        if (android.os.Build.FINGERPRINT == "robolectric") return
        healthJob = viewModelScope.launch {
            val sem = kotlinx.coroutines.sync.Semaphore(4)
            VoiceCatalog.curated.map { v ->
                launch {
                    sem.acquire()
                    try {
                        val ok = a.engine.isVoiceHealthy(v.id)
                        _voiceHealth.update { it + (v.id to ok) }
                    } finally { sem.release() }
                }
            }.forEach { it.join() }
        }
    }

    private val _voxStatus = MutableStateFlow<String?>(null)
    val voxStatus = _voxStatus.asStateFlow()

    /** Uji koneksi ke server VoxCPM2 milik pengguna. */
    fun testVox() {
        _voxStatus.value = "Menghubungi server…"
        viewModelScope.launch {
            val h = a.engine.voxHealth()
            _voxStatus.value = (if (h.ok) "✓ " else "✗ ") + h.message
            if (h.ok) selectVoice("vox-wanita")
        }
    }

    /** Teks pratinjau yang bisa diubah pengguna di layar Suara. */
    val previewText = MutableStateFlow(DEFAULT_PREVIEW)

    /** Status pratinjau: id suara yang sedang diproses, atau "compare"/"mytext". */
    fun previewVoice(v: Voice, text: String = previewText.value) {
        if (_previewing.value != null) return
        _previewing.value = v.id
        viewModelScope.launch {
            runCatching { a.engine.preview(v.id, text.ifBlank { VoiceCatalog.sampleText(v) }, settings.value) }
                .onSuccess { f -> playFiles(listOf(f), "Pratinjau • ${v.name}", v.group.title) }
                .onFailure {
                    val healthy = a.engine.isVoiceHealthy(v.id, force = true)
                    _voiceHealth.update { m -> m + (v.id to healthy) }
                    if (!healthy) {
                        val alt = a.engine.fallbackFor(v)
                        toast("Suara ${v.name} sedang tidak tersedia di server Microsoft." + (alt?.let { a -> " Coba ${a.name} yang mirip." } ?: ""))
                    } else toast("Gagal membuat pratinjau: ${it.message}. Periksa koneksi internet.")
                }
            _previewing.value = null
        }
    }

    /** Bandingkan beberapa suara berurutan dengan kalimat yang sama (A/B). */
    fun compareVoices(all: List<Voice>, text: String = previewText.value) {
        val voices = all.filter { _voiceHealth.value[it.id] != false }
        if (_previewing.value != null || voices.isEmpty()) return
        _previewing.value = "compare"
        viewModelScope.launch {
            val items = ArrayList<Pair<File, Voice>>()
            var failed = 0
            for ((i, v) in voices.withIndex()) {
                _compareProgress.value = "Menyiapkan ${i + 1}/${voices.size}: ${v.name}"
                runCatching { a.engine.preview(v.id, text.ifBlank { VoiceCatalog.sampleText(v) }, settings.value) }
                    .onSuccess { f ->
                        items.add(f to v)
                        if (items.size == 1) playList(items) else appendToList(f, v)
                    }.onFailure { failed++ }
            }
            _compareProgress.value = null
            if (failed > 0) toast("$failed suara gagal dimuat (periksa internet)")
            _previewing.value = null
        }
    }

    private val _compareProgress = MutableStateFlow<String?>(null)
    val compareProgress = _compareProgress.asStateFlow()

    /** Dengarkan cuplikan awal teks pengguna dengan suara & setelan saat ini sebelum membuat audio penuh. */
    fun previewMyText() {
        val t = text.value.trim()
        if (TextProcessor.countWords(t) == 0) { toast("Tulis atau tempel teks terlebih dahulu"); return }
        var snippet = t.take(400)
        val cut = snippet.lastIndexOfAny(charArrayOf('.', '!', '?'))
        if (t.length > 400 && cut > 80) snippet = snippet.substring(0, cut + 1)
        previewVoice(voiceOf(settings.value.voiceId), snippet)
    }

    private fun playList(items: List<Pair<File, Voice>>) {
        val c = controller ?: return
        streamJobId = null
        runCatching {
            c.setMediaItems(items.map { (f, v) -> item(f, "Bandingkan • ${v.name}", v.group.title) })
            c.setPlaybackParameters(PlaybackParameters(_player.value.speed))
            c.prepare(); c.play()
        }
    }

    private fun appendToList(f: File, v: Voice) {
        val c = controller ?: return
        runCatching {
            c.addMediaItem(item(f, "Bandingkan • ${v.name}", v.group.title))
            if (c.playbackState == Player.STATE_ENDED) { c.seekToNextMediaItem(); c.play() }
        }
    }

    // ---------- Pustaka ----------

    fun play(item: LibraryItem) = playFiles(listOf(item.file), item.title, item.voiceName)

    fun delete(item: LibraryItem) {
        runCatching {
            val c = controller
            if (c != null && c.currentMediaItem?.mediaId == item.file.absolutePath) { c.stop(); c.clearMediaItems() }
        }
        a.library.delete(item)
    }

    fun rename(item: LibraryItem, newTitle: String) = a.library.rename(item, newTitle)

    fun saveToDownloads(item: LibraryItem) {
        viewModelScope.launch {
            val r = withContext(Dispatchers.IO) { runCatching { Exporter.saveToDownloads(ctx, item.file, item.title) } }
            r.onSuccess { path ->
                a.library.save(item.copy(exportedTo = path))
                toast("Tersimpan di $path")
            }.onFailure { toast("Gagal menyimpan: ${it.message}") }
        }
    }

    fun exportTo(item: LibraryItem, uri: Uri) {
        viewModelScope.launch {
            val r = withContext(Dispatchers.IO) { runCatching { Exporter.copyToUri(ctx, item.file, uri) } }
            r.onSuccess { toast("File berhasil disimpan") }.onFailure { toast("Gagal menyimpan: ${it.message}") }
        }
    }

    fun share(item: LibraryItem) {
        runCatching { ctx.startActivity(Exporter.shareIntent(ctx, item.file, item.title)) }
            .onFailure { toast("Tidak bisa membagikan: ${it.message}") }
    }

    // ---------- Pemutar ----------

    private fun item(f: File, title: String, subtitle: String, id: String = f.absolutePath) =
        MediaItem.Builder()
            .setUri(Uri.fromFile(f))
            .setMediaId(id)
            .setMediaMetadata(MediaMetadata.Builder().setTitle(title).setArtist(subtitle).build())
            .build()

    private fun playFiles(files: List<File>, title: String, subtitle: String) {
        val c = controller
        if (c == null) { toast("Pemutar belum siap, coba lagi"); connectPlayer(); return }
        streamJobId = null
        runCatching {
            c.setMediaItems(files.map { item(it, title, subtitle) })
            c.setPlaybackParameters(PlaybackParameters(_player.value.speed))
            c.prepare()
            c.play()
        }.onFailure { toast("Gagal memutar: ${it.message}") }
    }

    fun togglePlay() {
        val c = controller ?: return
        runCatching {
            if (c.isPlaying) c.pause() else {
                if (c.playbackState == Player.STATE_ENDED) c.seekTo(0, 0)
                if (c.playbackState == Player.STATE_IDLE) c.prepare()
                c.play()
            }
        }
    }

    fun seekTo(fraction: Float) {
        val c = controller ?: return
        runCatching {
            val p = _player.value
            if (p.durationMs > 0) seekGlobal((fraction * p.durationMs).toLong())
        }
    }

    fun skip(deltaMs: Long) {
        val p = _player.value
        runCatching { seekGlobal((p.positionMs + deltaMs).coerceIn(0, maxOf(0, p.durationMs - 500))) }
    }

    /** Seek di seluruh playlist seolah-olah satu file. */
    private fun seekGlobal(ms: Long) {
        val c = controller ?: return
        val tl = c.currentTimeline
        if (tl.isEmpty) return
        val w = androidx.media3.common.Timeline.Window()
        var acc = 0L
        for (i in 0 until tl.windowCount) {
            tl.getWindow(i, w)
            val d = w.durationMs.takeIf { it > 0 } ?: 0L
            if (ms < acc + d || i == tl.windowCount - 1) {
                c.seekTo(i, (ms - acc).coerceAtLeast(0))
                return
            }
            acc += d
        }
    }

    fun setSpeed(sp: Float) {
        _player.update { it.copy(speed = sp) }
        runCatching { controller?.setPlaybackParameters(PlaybackParameters(sp)) }
    }

    fun stopPlayer() {
        runCatching { controller?.stop(); controller?.clearMediaItems() }
        streamJobId = null
    }

    private fun connectPlayer() {
        if (controller != null) return
        if (android.os.Build.FINGERPRINT == "robolectric") return // lingkungan uji
        runCatching {
            val token = SessionToken(ctx, ComponentName(ctx, PlaybackService::class.java))
            val future = MediaController.Builder(ctx, token).buildAsync()
            future.addListener({
                runCatching {
                    val c = future.get()
                    controller = c
                    c.addListener(object : Player.Listener {
                        override fun onPlayerError(error: PlaybackException) {
                            _player.update { it.copy(error = "Gagal memutar: ${error.errorCodeName}") }
                            toast("Gagal memutar audio")
                        }
                    })
                    _player.update { it.copy(connected = true) }
                    startTicker()
                }.onFailure { toast("Pemutar gagal dimulai: ${it.message}") }
            }, ContextCompat.getMainExecutor(ctx))
        }
    }

    private fun startTicker() {
        viewModelScope.launch {
            val w = androidx.media3.common.Timeline.Window()
            while (isActive) {
                val c = controller
                if (c != null) runCatching {
                    val tl = c.currentTimeline
                    var total = 0L; var before = 0L
                    val idx = c.currentMediaItemIndex
                    if (!tl.isEmpty) for (i in 0 until tl.windowCount) {
                        tl.getWindow(i, w)
                        val d = w.durationMs.takeIf { it > 0 } ?: 0L
                        if (i < idx) before += d
                        total += d
                    }
                    val md = c.mediaMetadata
                    _player.update {
                        it.copy(
                            hasMedia = c.mediaItemCount > 0,
                            playing = c.isPlaying,
                            buffering = c.playbackState == Player.STATE_BUFFERING,
                            title = md.title?.toString() ?: "",
                            subtitle = md.artist?.toString() ?: "",
                            positionMs = before + c.currentPosition.coerceAtLeast(0),
                            durationMs = total,
                        )
                    }
                }
                delay(400)
            }
        }
    }

    fun toast(msg: String) {
        ContextCompat.getMainExecutor(ctx).execute { Toast.makeText(ctx, msg, Toast.LENGTH_LONG).show() }
    }

    override fun onCleared() {
        runCatching { controller?.release() }
        controller = null
        super.onCleared()
    }
}
