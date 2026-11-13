package com.adriymine.tts.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File

data class LibraryItem(
    val id: String,
    val title: String,
    val voiceId: String,
    val voiceName: String,
    val createdAt: Long,
    val durationSec: Long,
    val words: Int,
    val preview: String,
    val file: File,
    val exportedTo: String? = null,
) {
    val sizeBytes: Long get() = file.length()
}

/** Pustaka audio hasil konversi, disimpan di penyimpanan internal aplikasi. */
class Library(context: Context) {
    val dir: File = File(context.filesDir, "library").apply { mkdirs() }
    private val _items = MutableStateFlow<List<LibraryItem>>(emptyList())
    val items: StateFlow<List<LibraryItem>> = _items.asStateFlow()

    suspend fun refresh() = withContext(Dispatchers.IO) {
        val list = dir.listFiles { f -> f.name.endsWith(".json") }.orEmpty().mapNotNull { meta ->
            runCatching {
                val o = JSONObject(meta.readText())
                val audio = File(dir, o.getString("id") + ".mp3")
                if (!audio.exists() || audio.length() == 0L) return@runCatching null
                LibraryItem(
                    id = o.getString("id"),
                    title = o.optString("title", "Audio"),
                    voiceId = o.optString("voiceId"),
                    voiceName = o.optString("voiceName"),
                    createdAt = o.optLong("createdAt"),
                    durationSec = o.optLong("durationSec"),
                    words = o.optInt("words"),
                    preview = o.optString("preview"),
                    file = audio,
                    exportedTo = o.optString("exportedTo").ifEmpty { null },
                )
            }.getOrNull()
        }.sortedByDescending { it.createdAt }
        _items.value = list
    }

    fun save(item: LibraryItem) {
        val o = JSONObject()
            .put("id", item.id)
            .put("title", item.title)
            .put("voiceId", item.voiceId)
            .put("voiceName", item.voiceName)
            .put("createdAt", item.createdAt)
            .put("durationSec", item.durationSec)
            .put("words", item.words)
            .put("preview", item.preview)
            .put("exportedTo", item.exportedTo ?: "")
        val tmp = File(dir, item.id + ".json.tmp")
        tmp.writeText(o.toString())
        tmp.renameTo(File(dir, item.id + ".json"))
        _items.value = (listOf(item) + _items.value.filter { it.id != item.id }).sortedByDescending { it.createdAt }
    }

    fun rename(item: LibraryItem, title: String) = save(item.copy(title = title.ifBlank { item.title }))

    fun delete(item: LibraryItem) {
        runCatching { File(dir, item.id + ".json").delete() }
        runCatching { item.file.delete() }
        _items.value = _items.value.filter { it.id != item.id }
    }

    fun audioFile(id: String) = File(dir, "$id.mp3")
}
