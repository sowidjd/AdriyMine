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
    val paragraphPauseMs: Int = 450,
    val numbersToWords: Boolean = true,
    val expandAbbreviations: Boolean = true,
    val spellLettersMultilingual: Boolean = true,
    val playWhileGenerating: Boolean = true,
    val autoSaveToDownloads: Boolean = true,
    val concurrency: Int = 3,
    val chromiumVersion: String = EdgeConfig.DEFAULT_CHROMIUM_FULL_VERSION,
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
                voiceId = sp.getString("voiceId", d.voiceId) ?: d.voiceId,
                rate = sp.getInt("rate", d.rate),
                pitch = sp.getInt("pitch", d.pitch),
                volume = sp.getInt("volume", d.volume),
                paragraphPauseMs = sp.getInt("pause", d.paragraphPauseMs),
                numbersToWords = sp.getBoolean("num", d.numbersToWords),
                expandAbbreviations = sp.getBoolean("abbr", d.expandAbbreviations),
                spellLettersMultilingual = sp.getBoolean("spell", d.spellLettersMultilingual),
                playWhileGenerating = sp.getBoolean("playGen", d.playWhileGenerating),
                autoSaveToDownloads = sp.getBoolean("autosave", d.autoSaveToDownloads),
                concurrency = sp.getInt("conc", d.concurrency).coerceIn(1, 6),
                chromiumVersion = sp.getString("chromium", d.chromiumVersion)?.takeIf { it.isNotBlank() } ?: d.chromiumVersion,
            )
        }.getOrDefault(d)
    }

    fun update(f: (Settings) -> Settings) {
        val s = f(_state.value)
        _state.value = s
        EdgeConfig.chromiumFullVersion = s.chromiumVersion
        sp.edit()
            .putString("voiceId", s.voiceId)
            .putInt("rate", s.rate)
            .putInt("pitch", s.pitch)
            .putInt("volume", s.volume)
            .putInt("pause", s.paragraphPauseMs)
            .putBoolean("num", s.numbersToWords)
            .putBoolean("abbr", s.expandAbbreviations)
            .putBoolean("spell", s.spellLettersMultilingual)
            .putBoolean("playGen", s.playWhileGenerating)
            .putBoolean("autosave", s.autoSaveToDownloads)
            .putInt("conc", s.concurrency)
            .putString("chromium", s.chromiumVersion)
            .apply()
    }
}
