package com.adriymine.tts.data

import android.content.Context
import com.adriymine.tts.tts.EdgeConfig
import com.adriymine.tts.tts.VoiceCatalog
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class Settings(
    val voiceId: String = VoiceCatalog.DEFAULT_VOICE,
    val rate: Int = 0,          // persen, -50..+100
    val pitch: Int = 0,         // Hz, -30..+30
    val volume: Int = 0,        // persen, -50..+50
    /** Jeda total setelah titik (ms). Hasil uji: suara multibahasa aslinya hanya ±385 ms. */
    val sentencePauseMs: Int = 650,
    /** Tambahan jeda saat ganti paragraf (ms). */
    val paragraphPauseMs: Int = 450,
    /** Pakai setelan kecepatan/nada optimal per suara hasil uji. */
    val autoTune: Boolean = true,
    val numbersToWords: Boolean = true,
    val expandAbbreviations: Boolean = true,
    val spellLettersMultilingual: Boolean = true,
    val playWhileGenerating: Boolean = true,
    val autoSaveToDownloads: Boolean = true,
    val concurrency: Int = 4,
    val chromiumVersion: String = EdgeConfig.DEFAULT_CHROMIUM_FULL_VERSION,
    /** Alamat server VoxCPM2 milik pengguna (kosong = tidak dipakai). */
    val voxUrl: String = "",
    val voxToken: String = "",
    /** Kunci Hugging Face (hf_...) bila server berada di Space privat. */
    val hfToken: String = "",
)

/** Prosodi akhir = setelan pengguna + setelan optimal suara (bila aktif). */
/** Prosodi sepenuhnya otomatis dari gaya bicara yang dipilih (tanpa pengaturan manual). */
@Suppress("UnusedReceiverParameter")
fun Settings.prosodyFor(v: com.adriymine.tts.tts.Voice) = com.adriymine.tts.tts.Prosody(
    ratePercent = v.tuneRate,
    pitchHz = v.tunePitch,
    volumePercent = 0,
)

class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
    private val _state = MutableStateFlow(load())
    val state: StateFlow<Settings> = _state.asStateFlow()

    init {
        EdgeConfig.chromiumFullVersion = _state.value.chromiumVersion
    }

    private fun load(): Settings {
        val d = Settings()
        return runCatching {
            Settings(
                voiceId = sp.getString("voiceId4", d.voiceId) ?: d.voiceId,
                rate = sp.getInt("rate", d.rate),
                pitch = sp.getInt("pitch", d.pitch),
                volume = sp.getInt("volume", d.volume),
                sentencePauseMs = sp.getInt("spause", d.sentencePauseMs),
                paragraphPauseMs = sp.getInt("pause2", d.paragraphPauseMs),
                autoTune = sp.getBoolean("tune", d.autoTune),
                numbersToWords = sp.getBoolean("num", d.numbersToWords),
                expandAbbreviations = sp.getBoolean("abbr", d.expandAbbreviations),
                spellLettersMultilingual = sp.getBoolean("spell", d.spellLettersMultilingual),
                playWhileGenerating = sp.getBoolean("playGen", d.playWhileGenerating),
                autoSaveToDownloads = sp.getBoolean("autosave", d.autoSaveToDownloads),
                concurrency = sp.getInt("conc2", d.concurrency).coerceIn(1, 6),
                chromiumVersion = sp.getString("chromium", d.chromiumVersion)?.takeIf { it.isNotBlank() } ?: d.chromiumVersion,
                voxUrl = sp.getString("voxUrl", "") ?: "",
                voxToken = sp.getString("voxToken", "") ?: "",
                hfToken = sp.getString("hfToken", "") ?: "",
            )
        }.getOrDefault(d)
    }

    fun update(f: (Settings) -> Settings) {
        val s = f(_state.value)
        _state.value = s
        EdgeConfig.chromiumFullVersion = s.chromiumVersion
        sp.edit()
            .putString("voiceId4", s.voiceId)
            .putInt("rate", s.rate)
            .putInt("pitch", s.pitch)
            .putInt("volume", s.volume)
            .putInt("spause", s.sentencePauseMs)
            .putInt("pause2", s.paragraphPauseMs)
            .putBoolean("tune", s.autoTune)
            .putBoolean("num", s.numbersToWords)
            .putBoolean("abbr", s.expandAbbreviations)
            .putBoolean("spell", s.spellLettersMultilingual)
            .putBoolean("playGen", s.playWhileGenerating)
            .putBoolean("autosave", s.autoSaveToDownloads)
            .putInt("conc2", s.concurrency)
            .putString("chromium", s.chromiumVersion)
            .putString("voxUrl", s.voxUrl)
            .putString("voxToken", s.voxToken)
            .putString("hfToken", s.hfToken)
            .apply()
    }
}
