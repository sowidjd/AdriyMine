package com.adriymine.tts

import com.adriymine.tts.tts.EdgeDrm
import com.adriymine.tts.tts.IndoNumber
import com.adriymine.tts.tts.TextProcessor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CoreTest {
    @Test
    fun drmMatchesReferenceImplementation() {
        // Vektor uji dihasilkan dari edge-tts 7.3.1 (generate_sec_ms_gec_v2)
        val vectors = mapOf(
            0.0 to "52BC7A17B50DFEC9-28C4394775C8751CD2F6859C030C06DB1489ACAB3B3A7651831FC26895177ED6",
            1700000000.0 to "2CD23A2CA0B2595A-F3C846C370E05F9CC83ACC5F995C5F5D87A4D0F14CE8936A0F902E64099E38A2",
            1763020000.5 to "778AA96B1A82BCDB-D0193D2A497700CBD27E0A43AF831D1CAEBCAA3E0155EC0554FA3A76EAFDEB86",
            1800000123.0 to "99E54519B490BE5C-E162DB0977FBDCB9B86DD8148BF1BCDC3C0303176CE39852A42B415935C20654",
            2000000000.0 to "2D62557F1142BC5D-FD9C30C68FF194A5EE6B45FEFC5E2BA1D1239F88A90569AB55CFFFAA7799F40E",
        )
        for ((t, expected) in vectors) assertEquals("t=$t", expected, EdgeDrm.generate(t))
    }

    @Test
    fun numbers() {
        assertEquals("dua puluh lima ribu", IndoNumber.toWords(25000))
        assertEquals("seribu sembilan ratus empat puluh lima", IndoNumber.toWords(1945))
        assertEquals("seratus sebelas", IndoNumber.toWords(111))
        assertEquals("dua juta lima ratus ribu", IndoNumber.toWords(2_500_000))
        assertEquals("nol delapan satu dua", IndoNumber.read("0812"))
    }

    private fun prep(s: String, spell: Boolean = false) =
        TextProcessor.prepare(s, TextProcessor.Options(spellLettersIndo = spell))

    @Test
    fun normalization() {
        val out = prep("Harganya Rp 25.000, diskon 45%. Nilai 3,5. Pukul 10.30 di Jl. Merdeka No. 5 dll.")
        println(out)
        assertTrue(out, out.contains("dua puluh lima ribu rupiah"))
        assertTrue(out, out.contains("empat puluh lima persen"))
        assertTrue(out, out.contains("tiga koma lima"))
        assertTrue(out, out.contains("Pukul sepuluh tiga puluh"))
        assertTrue(out, out.contains("Jalan Merdeka nomor lima"))
        assertTrue(out, out.contains("dan lain-lain."))
        val d = prep("Tanggal 17/08/1945 ke-2 dari 10-20 orang, tahun 2024.")
        println(d)
        assertTrue(d, d.contains("tujuh belas Agustus seribu sembilan ratus empat puluh lima"))
        assertTrue(d, d.contains("kedua"))
        assertTrue(d, d.contains("sepuluh sampai dua puluh"))
        val sp = prep("Huruf A, B, C. Lembaga DPR dan KTP serta BUMN. Budi pergi.", spell = true)
        println(sp)
        assertTrue(sp, sp.contains("Huruf a, be, ce."))
        assertTrue(sp, sp.contains("de pe er"))
        assertTrue(sp, sp.contains("ka te pe"))
        assertTrue(sp, sp.contains("be u em en"))
        assertTrue(sp, sp.contains("Budi pergi."))
    }

    @Test
    fun brokenLinesAndChunks() {
        val t = "Ini adalah kalimat yang\nterpotong karena PDF. Kalimat kedua.\n\nParagraf baru di sini."
        val p = prep(t)
        assertTrue(p, p.startsWith("Ini adalah kalimat yang terpotong karena PDF."))
        val long = (1..3000).joinToString(" ") { "Kalimat nomor $it berjalan baik." }
        val chunks = TextProcessor.chunk(prep(long))
        assertTrue(chunks.size > 10)
        assertTrue(chunks.all { it.text.length <= 2200 })
        val joined = chunks.joinToString(" ") { it.text }
        assertEquals(TextProcessor.countWords(prep(long)), TextProcessor.countWords(joined))
    }
}
