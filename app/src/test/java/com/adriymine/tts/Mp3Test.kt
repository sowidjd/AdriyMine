package com.adriymine.tts

import com.adriymine.tts.tts.Mp3
import com.adriymine.tts.tts.WordMark
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Struktur MP3 hasil olahan harus tetap valid: setiap frame asli utuh kecuali global_gain. */
class Mp3Test {
    private val audio = javaClass.getResourceAsStream("/ava_sample.mp3")!!.readBytes()
    private val words = javaClass.getResourceAsStream("/ava_sample.words")!!.bufferedReader().readLines().map {
        val p = it.split('\t'); WordMark(p[0].toLong(), p[1].toLong(), p[2])
    }
    private val text = "Malam itu, angin berembus pelan dari arah laut. Rina duduk sendirian di beranda rumah, memandangi bintang yang berkelip di langit."

    private fun frames(d: ByteArray): List<ByteArray> {
        val out = ArrayList<ByteArray>(); var i = 0
        while (i + 4 <= d.size) {
            assertEquals("sync @$i", 0xFF, d[i].toInt() and 0xFF)
            val size = if (((d[i + 2].toInt() ushr 1) and 1) == 1) 289 else 288
            if (i + size > d.size) break
            out.add(d.copyOfRange(i, i + size)); i += size
        }
        return out
    }
    private fun gg(f: ByteArray) = (((f[7].toInt() and 3) shl 6) or ((f[8].toInt() and 0xFF) ushr 2))
    private fun silent(f: ByteArray) = f.drop(4).take(9).all { it.toInt() == 0 } ||
        (((f[5].toInt() and 0x7F) shl 5) or ((f[6].toInt() and 0xFF) ushr 3)) == 0 // part2_3 = 0

    @Test
    fun gainOnlyTouchesGlobalGain() {
        val src = frames(audio)
        for (steps in listOf(-1, 1, 2)) {
            val out = frames(Mp3.polish(audio, emptyList(), text, Mp3.PauseSpec(), Mp3.Boundary.NONE, isLast = false, gainSteps = steps))
            var checked = 0
            for (k in src.indices) {
                if (k >= out.size) break
                val a = src[k]; val b = out[k]
                if (silent(a)) continue
                assertEquals("main_data_begin frame $k", a[4], b[4])
                assertEquals("global_gain frame $k", (gg(a) + steps).coerceIn(0, 255), gg(b))
                // semua byte selain 2 byte global_gain identik
                for (j in a.indices) if (j != 7 && j != 8) assertEquals("byte $j frame $k", a[j], b[j])
                checked++
            }
            assertTrue(checked > 50)
        }
    }

    @Test
    fun pausesKeepOriginalFramesInOrder() {
        val src = frames(audio).filter { !silent(it) }
        val out = frames(Mp3.polish(audio, words, text, Mp3.PauseSpec(), Mp3.Boundary.PARAGRAPH, isLast = false))
            .filter { !silent(it) }
        // frame asli bersuara muncul berurutan tanpa perubahan (kecuali ekor yang dipangkas)
        assertTrue(out.size <= src.size && out.size > src.size - 20)
        for (k in out.indices) assertTrue("frame $k", out[k].contentEquals(src[k]))
    }
}
