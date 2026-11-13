package com.adriymine.tts.tts

/** Konversi angka ke kata bahasa Indonesia. */
object IndoNumber {
    private val satuan = arrayOf(
        "nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
        "sepuluh", "sebelas"
    )

    fun digits(s: String): String =
        s.filter { it.isDigit() }.map { satuan[it - '0'] }.joinToString(" ")

    fun toWords(n: Long): String {
        if (n < 0) return "minus " + toWords(-n)
        return when {
            n < 12 -> satuan[n.toInt()]
            n < 20 -> satuan[(n - 10).toInt()] + " belas"
            n < 100 -> {
                val r = n % 10
                satuan[(n / 10).toInt()] + " puluh" + if (r > 0) " " + satuan[r.toInt()] else ""
            }
            n < 200 -> "seratus" + rest(n - 100)
            n < 1000 -> satuan[(n / 100).toInt()] + " ratus" + rest(n % 100)
            n < 2000 -> "seribu" + rest(n - 1000)
            n < 1_000_000 -> toWords(n / 1000) + " ribu" + rest(n % 1000)
            n < 1_000_000_000 -> toWords(n / 1_000_000) + " juta" + rest(n % 1_000_000)
            n < 1_000_000_000_000 -> toWords(n / 1_000_000_000) + " miliar" + rest(n % 1_000_000_000)
            n < 1_000_000_000_000_000 -> toWords(n / 1_000_000_000_000) + " triliun" + rest(n % 1_000_000_000_000)
            else -> digits(n.toString())
        }
    }

    private fun rest(n: Long): String = if (n > 0) " " + toWords(n) else ""

    /** Angka dalam bentuk string (boleh diawali nol / sangat panjang). */
    fun read(numStr: String): String {
        val d = numStr.filter { it.isDigit() }
        if (d.isEmpty()) return numStr
        // Nomor telepon/kode diawali 0 atau sangat panjang: dibaca per digit.
        if ((d.length > 1 && d[0] == '0') || d.length > 15) return digits(d)
        return toWords(d.toLong())
    }

    fun ordinal(numStr: String): String {
        val d = numStr.filter { it.isDigit() }
        if (d == "1") return "pertama"
        return "ke" + read(d)
    }
}
