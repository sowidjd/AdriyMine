package com.adriymine.tts.tts

import java.io.File
import java.io.OutputStream

/** Utilitas MP3 untuk format keluaran 24 kHz, 48 kbps, mono (CBR). */
object Mp3 {
    private const val FRAME_BYTES = 144
    private const val FRAME_MS = 24 // 576 sampel / 24000 Hz

    /**
     * Frame MP3 hening yang berdiri sendiri (main_data_begin = 0, tanpa data audio),
     * header identik dengan keluaran server sehingga sambungan mulus tanpa klik/noise.
     */
    private val silentFrame: ByteArray = ByteArray(FRAME_BYTES).also {
        it[0] = 0xFF.toByte(); it[1] = 0xF3.toByte(); it[2] = 0x64.toByte(); it[3] = 0xC4.toByte()
    }

    fun writeSilence(out: OutputStream, ms: Int) {
        val frames = (ms + FRAME_MS - 1) / FRAME_MS
        repeat(frames) { out.write(silentFrame) }
    }

    fun durationSec(bytes: Long): Long = bytes * 8 / 48_000

    /** Gabungkan potongan MP3 menjadi satu file (atomik). */
    fun concat(parts: List<File>, dest: File) {
        val tmp = File(dest.parentFile, dest.name + ".part")
        tmp.outputStream().buffered(1 shl 16).use { out ->
            for (p in parts) p.inputStream().buffered(1 shl 16).use { it.copyTo(out) }
        }
        if (dest.exists()) dest.delete()
        if (!tmp.renameTo(dest)) {
            tmp.copyTo(dest, overwrite = true); tmp.delete()
        }
    }
}
