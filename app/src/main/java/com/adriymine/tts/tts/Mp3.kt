package com.adriymine.tts.tts

import java.io.ByteArrayOutputStream
import java.io.File
import java.io.OutputStream

/**
 * Utilitas MP3 untuk keluaran server: MPEG-2 Layer III, 24 kHz, 96 kbps, mono (CBR).
 *
 * Fitur utama: penyisipan jeda di tengah aliran MP3 secara *bit-perfect*.
 * MP3 memakai "bit reservoir" (frame berikutnya meminjam byte dari frame sebelumnya),
 * sehingga menyisipkan frame hening biasa akan merusak suara sesudahnya (klik/noise).
 * Frame hening di sini membawa salinan byte reservoir terakhir, sehingga frame sesudahnya
 * tetap terdekode identik 100% dengan aslinya (diverifikasi per sampel).
 */
object Mp3 {
    const val FRAME_BYTES = 288          // 72 * 96000 / 24000
    const val FRAME_MS = 24.0            // 576 sampel / 24000 Hz
    private const val SIDE_INFO = 9      // MPEG-2 mono
    private const val MAIN_DATA = FRAME_BYTES - 4 - SIDE_INFO
    const val BITRATE = 96_000
    private val HEADER = byteArrayOf(0xFF.toByte(), 0xF3.toByte(), 0xA4.toByte(), 0xC4.toByte())

    private val zeroFrame: ByteArray = ByteArray(FRAME_BYTES).also { HEADER.copyInto(it) }

    fun framesFor(ms: Double): Int = if (ms <= 0) 0 else Math.round(ms / FRAME_MS).toInt()

    fun writeSilence(out: OutputStream, ms: Double) {
        repeat(framesFor(ms)) { out.write(zeroFrame) }
    }

    fun durationSec(bytes: Long): Long = bytes * 8 / BITRATE

    private class Frame(val off: Int, val size: Int, val bigValues: Int, val part23: Int)

    private val bitrates = intArrayOf(0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160)

    /** Parse frame; null bila format tidak sesuai (maka audio dipakai apa adanya). */
    private fun parse(d: ByteArray): List<Frame>? {
        val out = ArrayList<Frame>(d.size / FRAME_BYTES + 1)
        var i = 0
        while (i + 13 <= d.size) {
            val b1 = d[i + 1].toInt() and 0xFF
            if ((d[i].toInt() and 0xFF) != 0xFF || (b1 and 0xE0) != 0xE0) return null
            // hanya MPEG-2 (b1 = F3) mono yang didukung untuk pemrosesan
            if (b1 != 0xF3 || ((d[i + 3].toInt() and 0xC0) != 0xC0)) return null
            val b2 = d[i + 2].toInt() and 0xFF
            val brIdx = b2 ushr 4
            if (brIdx == 0 || brIdx >= bitrates.size || ((b2 ushr 2) and 3) != 1) return null
            val size = 72 * bitrates[brIdx] * 1000 / 24000 + ((b2 ushr 1) and 1)
            if (size <= 13) return null
            var bits = 0L
            for (k in 0 until 9) bits = (bits shl 8) or (d[i + 4 + k].toLong() and 0xFF)
            val p23 = ((bits ushr (72 - 21)) and 0xFFF).toInt()
            val bv = ((bits ushr (72 - 30)) and 0x1FF).toInt()
            out.add(Frame(i, size, bv, p23))
            i += size
        }
        return out
    }

    enum class Boundary { NONE, SENTENCE, PARAGRAPH }

    data class PauseSpec(
        /** Jeda total yang diinginkan setelah titik/tanda tanya/seru (ms, pada kecepatan normal). */
        val sentenceMs: Int = 650,
        /** Tambahan jeda untuk pergantian paragraf (ms). */
        val paragraphExtraMs: Int = 450,
        /** Faktor kecepatan bicara (1.0 normal, 1.2 = 20% lebih cepat) untuk menskalakan jeda. */
        val speed: Double = 1.0,
    )

    /**
     * Rapikan satu potongan audio:
     *  1. sisipkan jeda di akhir kalimat/paragraf bila jeda alami model terlalu pendek,
     *  2. pangkas hening panjang di ekor (bawaan server),
     *  3. tambahkan jeda sambungan menuju potongan berikutnya.
     */
    fun polish(
        audio: ByteArray,
        words: List<WordMark>,
        text: String,
        spec: PauseSpec,
        trailing: Boundary,
        isLast: Boolean,
    ): ByteArray {
        val frames = parse(audio) ?: return audio
        if (frames.isEmpty()) return audio
        val sentence = spec.sentenceMs / spec.speed
        val paraExtra = spec.paragraphExtraMs / spec.speed

        // --- 1. jeda di dalam potongan, berdasarkan posisi kata ---
        val inserts = HashMap<Int, Int>() // index frame -> jumlah frame hening
        if (words.size >= 2) {
            var cursor = 0
            for (w in 0 until words.size - 1) {
                val wt = words[w].text
                if (wt.isEmpty()) continue
                val idx = text.indexOf(wt, cursor)
                if (idx < 0) continue
                cursor = idx + wt.length
                var j = cursor
                while (j < text.length && !text[j].isLetterOrDigit()) j++
                val between = text.substring(cursor, j)
                val kind = when {
                    between.contains('\n') -> Boundary.PARAGRAPH
                    between.any { it == '.' || it == '!' || it == '?' || it == '…' } -> Boundary.SENTENCE
                    else -> Boundary.NONE
                }
                if (kind == Boundary.NONE) continue
                val end = words[w].endMs
                val gap = words[w + 1].startMs - end
                if (gap < 0) continue
                val target = sentence + if (kind == Boundary.PARAGRAPH) paraExtra else 0.0
                val add = framesFor(target - gap)
                if (add > 0) {
                    val at = ((end + gap / 2) / FRAME_MS).toInt().coerceIn(1, frames.size - 1)
                    inserts[at] = (inserts[at] ?: 0) + add
                }
            }
        }

        // --- 2. pangkas ekor ---
        var keep = frames.size
        val tailKeepMs = 160.0
        if (words.isNotEmpty()) {
            val lastEnd = words.last().endMs
            keep = minOf(frames.size, ((lastEnd + tailKeepMs) / FRAME_MS).toInt() + 1)
        } else {
            while (keep > 1 && frames[keep - 1].part23 == 0 && frames[keep - 1].bigValues == 0) keep--
            keep = minOf(frames.size, keep + framesFor(tailKeepMs))
        }
        val keptTailMs = if (words.isNotEmpty()) tailKeepMs else tailKeepMs

        // --- tulis ulang ---
        val out = ByteArrayOutputStream(audio.size + 64 * FRAME_BYTES)
        val reservoir = ByteArray(MAIN_DATA)
        var resLen = 0
        for (k in 0 until keep) {
            val n = inserts[k] ?: 0
            if (n > 0) {
                val z = ByteArray(FRAME_BYTES)
                HEADER.copyInto(z)
                // salin byte reservoir terakhir ke area data frame hening (rata kanan)
                System.arraycopy(reservoir, MAIN_DATA - resLen, z, FRAME_BYTES - resLen, resLen)
                repeat(n) { out.write(z) }
            }
            val f = frames[k]
            out.write(audio, f.off, f.size)
            // perbarui reservoir dengan area data frame ini
            val mdLen = f.size - 4 - SIDE_INFO
            val src = f.off + 4 + SIDE_INFO
            if (mdLen >= MAIN_DATA) {
                System.arraycopy(audio, src + mdLen - MAIN_DATA, reservoir, 0, MAIN_DATA)
                resLen = MAIN_DATA
            } else {
                val shift = mdLen
                System.arraycopy(reservoir, shift, reservoir, 0, MAIN_DATA - shift)
                System.arraycopy(audio, src, reservoir, MAIN_DATA - mdLen, mdLen)
                resLen = minOf(MAIN_DATA, resLen + mdLen)
            }
        }

        // --- 3. jeda sambungan (perkiraan hening awal potongan berikutnya ±150 ms) ---
        val leadNextMs = 150.0
        val boundaryMs = when {
            isLast -> 350.0 - keptTailMs
            trailing == Boundary.PARAGRAPH -> sentence + paraExtra - keptTailMs - leadNextMs
            else -> sentence - keptTailMs - leadNextMs
        }
        repeat(framesFor(boundaryMs)) { out.write(zeroFrame) }
        return out.toByteArray()
    }

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
