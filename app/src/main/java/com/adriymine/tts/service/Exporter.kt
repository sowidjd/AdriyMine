package com.adriymine.tts.service

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import java.io.File

object Exporter {
    const val FOLDER = "AdriyTTS"

    fun safeName(title: String): String {
        val base = title.replace(Regex("""[\\/:*?"<>|\n\r\t]"""), " ").trim().take(60).ifBlank { "Audio" }
        return base
    }

    /**
     * Simpan salinan MP3 ke folder publik Download/AdriyTTS. Mengembalikan lokasi yang mudah dibaca.
     * Android 10+: lewat MediaStore (tanpa izin). Android 7-9: butuh izin penyimpanan.
     */
    fun saveToDownloads(context: Context, src: File, title: String): String {
        val name = safeName(title) + ".mp3"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = context.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                put(MediaStore.MediaColumns.MIME_TYPE, "audio/mpeg")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + FOLDER)
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("Tidak bisa membuat file di Download")
            try {
                resolver.openOutputStream(uri)?.use { out -> src.inputStream().use { it.copyTo(out) } }
                    ?: throw IllegalStateException("Tidak bisa menulis file")
                values.clear()
                values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            } catch (e: Exception) {
                runCatching { resolver.delete(uri, null, null) }
                throw e
            }
            return "Download/$FOLDER/$name"
        } else {
            @Suppress("DEPRECATION")
            val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), FOLDER)
            dir.mkdirs()
            var out = File(dir, name)
            var n = 1
            while (out.exists()) { out = File(dir, safeName(title) + " ($n).mp3"); n++ }
            src.copyTo(out)
            MediaScannerConnection.scanFile(context, arrayOf(out.absolutePath), arrayOf("audio/mpeg"), null)
            return "Download/$FOLDER/${out.name}"
        }
    }

    /** Salin ke lokasi pilihan pengguna (Storage Access Framework). */
    fun copyToUri(context: Context, src: File, uri: Uri) {
        context.contentResolver.openOutputStream(uri, "w")?.use { out ->
            src.inputStream().use { it.copyTo(out) }
        } ?: throw IllegalStateException("Tidak bisa menulis ke lokasi tersebut")
    }

    fun shareIntent(context: Context, src: File, title: String): Intent {
        val uri = FileProvider.getUriForFile(context, context.packageName + ".files", src)
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "audio/mpeg"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, title)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        return Intent.createChooser(send, "Bagikan audio").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
}
