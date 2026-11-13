package com.adriymine.tts.tts

/**
 * Menyiapkan teks agar dibaca senatural mungkin oleh suara neural:
 *  - membersihkan karakter yang tidak didukung / simbol markdown / emoji
 *  - menyambung baris yang terpotong (hasil salin dari PDF)
 *  - mengubah angka, mata uang, persen, tanggal, jam ke kata bahasa Indonesia
 *  - memperluas singkatan umum (yg, dgn, dll, ...)
 *  - mengeja huruf & singkatan huruf kapital ala Indonesia (untuk suara multibahasa)
 *  - memecah teks panjang menjadi potongan per paragraf/kalimat.
 */
object TextProcessor {

    data class Options(
        val numbersToWords: Boolean = true,
        val expandAbbreviations: Boolean = true,
        /** Eja huruf tunggal & akronim (KTP -> ka te pe). Wajib untuk suara multibahasa. */
        val spellLettersIndo: Boolean = false,
    )

    data class Chunk(val text: String, val endsParagraph: Boolean)

    // ---------- Pembersihan ----------

    private val urlRegex = Regex("""(https?://|www\.)\S+""", RegexOption.IGNORE_CASE)
    private val emailRegex = Regex("""\b[\w.+-]+@[\w-]+\.[\w.]+\b""")

    fun clean(input: String): String {
        val sb = StringBuilder(input.length)
        var i = 0
        while (i < input.length) {
            val c = input[i]
            val code = c.code
            when {
                c == '\r' -> {}
                c == '\t' -> sb.append(' ')
                code in 0..8 || code in 11..12 || code in 14..31 || code == 0x7F -> sb.append(' ')
                Character.isHighSurrogate(c) -> { i++; sb.append(' ') } // emoji dll
                Character.isLowSurrogate(c) -> sb.append(' ')
                code in 0x2600..0x27BF || code in 0xFE00..0xFE0F || code == 0x200D -> sb.append(' ')
                c == ' ' || c == ' ' || c == ' ' -> sb.append(' ')
                c == '​' || c == '﻿' -> {}
                c == '“' || c == '”' || c == '„' || c == '«' || c == '»' -> sb.append('"')
                c == '‘' || c == '’' || c == '‚' -> sb.append('\'')
                c == '…' -> sb.append("...")
                c == '•' || c == '●' || c == '▪' || c == '■' || c == '‣' -> sb.append(' ')
                else -> sb.append(c)
            }
            i++
        }
        var t = sb.toString()
        t = urlRegex.replace(t, " ")
        t = emailRegex.replace(t) { it.value.replace("@", " et ").replace(".", " titik ") }
        // simbol markdown
        t = t.replace(Regex("""(?m)^\s{0,3}#{1,6}\s*"""), "")
        t = t.replace(Regex("""(?m)^\s*>\s?"""), "")
        t = t.replace(Regex("""(?m)^\s*[-*+]\s+"""), "")
        t = t.replace(Regex("""[*_`~|]{1,}"""), " ")
        t = t.replace(Regex("""\[(\d+)]"""), " ") // tanda kutipan [1]
        t = t.replace(Regex("""-{2,}|_{2,}|={2,}"""), " ")
        t = t.replace(Regex("""[ ]{2,}"""), " ")
        return t
    }

    /** Menyambung baris yang terputus di tengah kalimat (umum pada teks salinan PDF). */
    fun joinBrokenLines(t: String): String {
        val lines = t.split('\n')
        val out = StringBuilder(t.length)
        for (idx in lines.indices) {
            val line = lines[idx].trim()
            if (idx > 0) {
                val prev = lines[idx - 1].trim()
                if (line.isEmpty() || prev.isEmpty()) {
                    out.append('\n')
                } else {
                    val prevEndsSentence = prev.last() in ".!?:;\"')]…"
                    val startsLower = line.first().isLowerCase()
                    if (!prevEndsSentence && startsLower) {
                        if (prev.endsWith("-") && prev.length > 1 && prev[prev.length - 2].isLetter()) {
                            out.setLength(out.length - 1) // kata terpotong "berja-\nlan"
                        } else out.append(' ')
                    } else out.append('\n')
                }
            }
            out.append(line)
        }
        return out.toString()
    }

    // ---------- Singkatan ----------

    private val abbreviations: List<Pair<Regex, String>> = listOf(
        "yg" to "yang", "dgn" to "dengan", "dg" to "dengan", "tdk" to "tidak", "utk" to "untuk",
        "krn" to "karena", "sdh" to "sudah", "blm" to "belum", "tsb" to "tersebut",
        "dll" to "dan lain-lain", "dsb" to "dan sebagainya", "dst" to "dan seterusnya",
        "spt" to "seperti", "jg" to "juga", "kpd" to "kepada", "sbg" to "sebagai",
        "bbrp" to "beberapa", "sbb" to "sebagai berikut", "tgl" to "tanggal", "thn" to "tahun",
        "bln" to "bulan", "hrs" to "harus", "sblm" to "sebelum", "stlh" to "setelah",
        "org" to "orang", "pd" to "pada", "dlm" to "dalam", "bgt" to "banget", "gk" to "gak",
        "tp" to "tapi", "bs" to "bisa", "dpt" to "dapat", "msh" to "masih",
        "lg" to "lagi", "sm" to "sama", "kmrn" to "kemarin", "skrg" to "sekarang",
    ).map { (k, v) -> Regex("""(?<![\p{L}\d.])${Regex.escape(k)}(?![\p{L}\d])""", RegexOption.IGNORE_CASE) to v }

    private val titleAbbr: List<Pair<Regex, String>> = listOf(
        """\bProf\.\s*""" to "Profesor ", """\bDr\.\s*""" to "Doktor ", """\bdr\.\s*""" to "dokter ",
        """\bIr\.\s*""" to "Insinyur ", """\bJl\.\s*""" to "Jalan ", """\bJln\.\s*""" to "Jalan ",
        """\bNo\.\s*(?=\d)""" to "nomor ", """\bhlm\.\s*""" to "halaman ", """\bKec\.\s*""" to "Kecamatan ",
        """\bKab\.\s*""" to "Kabupaten ", """\bKel\.\s*""" to "Kelurahan ", """\bProv\.\s*""" to "Provinsi ",
        """\bTbk\.?""" to "Terbuka", """\bPT\.\s*""" to "PT ", """\bS\.Pd\.?""" to "es pe de",
        """\bS\.Kom\.?""" to "es kom", """\bS\.H\.?""" to "es ha", """\bS\.E\.?""" to "es e",
        """\bM\.Pd\.?""" to "em pe de", """\bHj\.\s*""" to "Hajah ",
        """\bSdr\.\s*""" to "Saudara ", """\bBpk\.\s*""" to "Bapak ",
        """\bvs\.?(?=\s)""" to "lawan", """&""" to " dan ", """\s=\s""" to " sama dengan ",
        """°C""" to " derajat Celsius", """°""" to " derajat",
    ).map { (k, v) -> Regex(k) to v }

    private fun expandAbbr(t: String): String {
        var s = t
        for ((r, v) in titleAbbr) s = r.replace(s, v)
        for ((r, v) in abbreviations) s = r.replace(s) { m ->
            val w = v
            if (m.value.first().isUpperCase()) w.replaceFirstChar { it.uppercase() } else w
        }
        return s
    }

    // ---------- Angka ----------

    private val bulan = arrayOf(
        "", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
        "September", "Oktober", "November", "Desember"
    )

    private val units = linkedMapOf(
        "km/jam" to "kilometer per jam", "km/h" to "kilometer per jam", "m/s" to "meter per detik",
        "km" to "kilometer", "kg" to "kilogram", "cm" to "sentimeter", "mm" to "milimeter",
        "ml" to "mililiter", "mg" to "miligram", "gr" to "gram", "ha" to "hektare",
        "m2" to "meter persegi", "m²" to "meter persegi", "m3" to "meter kubik", "m³" to "meter kubik",
        "GB" to "gigabita", "MB" to "megabita", "KB" to "kilobita", "TB" to "terabita",
        "mAh" to "mili ampere jam", "W" to "watt", "kW" to "kilowatt", "V" to "volt", "Hz" to "hertz",
        "m" to "meter", "g" to "gram", "l" to "liter", "L" to "liter",
    )
    private val unitRegex = Regex(
        """(\d)\s?(""" + units.keys.joinToString("|") { Regex.escape(it) } + """)(?![\p{L}\d])"""
    )

    private val reCurrency = Regex("""(?i)\bRp\.?\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+|-+))?""")
    private val reUsd = Regex("""(?:US)?\$\s?(\d{1,3}(?:[.,]\d{3})+|\d+)""")
    private val reDate = Regex("""\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b""")
    private val reTime = Regex("""(?i)\b(pukul|jam|pkl\.?)\s+(\d{1,2})[.:](\d{2})\b""")
    private val reTimeBare = Regex("""\b([01]?\d|2[0-3]):([0-5]\d)\b""")
    private val reOrdinal = Regex("""(?i)\bke-(\d+)\b""")
    private val rePercentRange = Regex("""(\d+(?:,\d+)?)\s?[-–]\s?(\d+(?:,\d+)?)\s?%""")
    private val reRange = Regex("""(?<![\d.,\-])([1-9]\d{0,3})\s?[–-]\s?([1-9]\d{0,3})(?![\d.,\-])""")
    private val reThousands = Regex("""(?<![\d.,])(\d{1,3}(?:\.\d{3})+)(?:,(\d+))?(?![\d])""")
    private val reDecimal = Regex("""(?<![\d.,])(\d+),(\d+)(?![\d])""")
    private val reDotTime = Regex("""(?<![\d.,])([01]?\d|2[0-3])\.([0-5]\d)(?![\d.])""")
    private val reDotDecimal = Regex("""(?<![\d.,])(\d+)\.(\d{1,2})(?![\d.])""")
    private val rePercent = Regex("""(\d)\s?%""")
    private val reInt = Regex("""\d+""")

    private fun decimal(intPart: String, frac: String): String =
        IndoNumber.read(intPart) + " koma " + IndoNumber.digits(frac)

    fun numbers(t: String): String {
        var s = t
        s = unitRegex.replace(s) { m -> m.groupValues[1] + " " + (units[m.groupValues[2]] ?: m.groupValues[2]) }
        s = reCurrency.replace(s) { m ->
            val whole = IndoNumber.read(m.groupValues[1].replace(".", ""))
            val frac = m.groupValues[2]
            val cents = if (frac.isNotEmpty() && frac.all { it.isDigit() } && frac.trim('0').isNotEmpty()) " koma " + IndoNumber.digits(frac) else ""
            " $whole$cents rupiah "
        }
        s = reUsd.replace(s) { m -> " " + IndoNumber.read(m.groupValues[1].replace(".", "").replace(",", "")) + " dolar " }
        s = reDate.replace(s) { m ->
            val d = m.groupValues[1].toInt(); val mo = m.groupValues[2].toInt()
            if (mo in 1..12 && d in 1..31) "${IndoNumber.read(d.toString())} ${bulan[mo]} ${IndoNumber.read(m.groupValues[3])}"
            else m.value
        }
        s = reTime.replace(s) { m ->
            val h = m.groupValues[2]; val mi = m.groupValues[3]
            val minute = if (mi == "00") "" else " " + IndoNumber.read(mi.trimStart('0').ifEmpty { "0" })
            "${m.groupValues[1]} ${IndoNumber.read(h.trimStart('0').ifEmpty { "0" })}$minute"
        }
        s = reTimeBare.replace(s) { m ->
            val mi = m.groupValues[2]
            val minute = if (mi == "00") "" else " " + IndoNumber.read(mi.trimStart('0').ifEmpty { "0" })
            IndoNumber.read(m.groupValues[1].trimStart('0').ifEmpty { "0" }) + minute
        }
        s = reOrdinal.replace(s) { m -> IndoNumber.ordinal(m.groupValues[1]) }
        s = rePercentRange.replace(s) { m -> num(m.groupValues[1]) + " sampai " + num(m.groupValues[2]) + " persen" }
        s = rePercent.replace(s) { m -> m.groupValues[1] + " persen" }
        s = reRange.replace(s) { m ->
            IndoNumber.read(m.groupValues[1]) + " sampai " + IndoNumber.read(m.groupValues[2])
        }
        s = reThousands.replace(s) { m ->
            val whole = IndoNumber.read(m.groupValues[1].replace(".", ""))
            if (m.groupValues[2].isNotEmpty()) whole + " koma " + IndoNumber.digits(m.groupValues[2]) else whole
        }
        s = reDecimal.replace(s) { m -> decimal(m.groupValues[1], m.groupValues[2]) }
        s = reDotTime.replace(s) { m ->
            val mi = m.groupValues[2]
            val minute = if (mi == "00") "" else " " + IndoNumber.read(mi.trimStart('0').ifEmpty { "0" })
            IndoNumber.read(m.groupValues[1].trimStart('0').ifEmpty { "0" }) + minute
        }
        s = reDotDecimal.replace(s) { m -> IndoNumber.read(m.groupValues[1]) + " titik " + IndoNumber.digits(m.groupValues[2]) }
        s = reInt.replace(s) { m -> " " + IndoNumber.read(m.value) + " " }
        return s
    }

    private fun num(x: String): String =
        if (x.contains(',')) decimal(x.substringBefore(','), x.substringAfter(',')) else IndoNumber.read(x)

    // ---------- Ejaan huruf ----------

    private val letterNames = mapOf(
        'A' to "a", 'B' to "be", 'C' to "ce", 'D' to "de", 'E' to "e", 'F' to "ef", 'G' to "ge",
        'H' to "ha", 'I' to "i", 'J' to "je", 'K' to "ka", 'L' to "el", 'M' to "em", 'N' to "en",
        'O' to "o", 'P' to "pe", 'Q' to "ki", 'R' to "er", 'S' to "es", 'T' to "te", 'U' to "u",
        'V' to "fe", 'W' to "we", 'X' to "eks", 'Y' to "ye", 'Z' to "zet"
    )
    private val readableCaps = setOf(
        "ITU", "INI", "DAN", "APA", "ADA", "YANG", "BAB", "OKE", "OK", "AKU", "KAU", "DIA", "KITA",
        "IYA", "YA", "TIDAK", "BISA", "SAYA", "KAMU", "MAU", "NYA", "UNTUK", "DARI", "KE", "DI", "PADA",
        "OLEH", "ATAU", "JUGA", "HAI", "HALO", "WOW", "AYO", "AJA", "SAJA", "LAGI", "SUDAH", "BELUM",
        "PASAL", "AYAT", "NASA", "ASEAN", "UNESCO", "UNICEF", "OPEC", "NATO", "POLRI", "PEMILU",
        "BAPPENAS", "TOEFL", "COVID", "AIDS", "ABRI", "SIM", "PIN", "SARS", "RAM", "ROM", "LAN"
    )

    private val reCapsWord = Regex("""(?<![\p{L}\d])([A-Z]{1,6})(?![\p{L}\d])""")
    private val reListMarker = Regex("""(?m)^([a-zA-Z])[.)]\s""")

    private fun spell(word: String): String = word.map { letterNames[it.uppercaseChar()] ?: it.toString() }.joinToString(" ")

    fun spellLetters(t: String): String {
        val lines = t.split('\n').map { line ->
            val letters = line.count { it.isLetter() }
            val upper = line.count { it.isUpperCase() }
            val words = line.trim().split(Regex("\\s+")).size
            // Baris yang seluruhnya huruf kapital (judul) diubah ke huruf biasa agar tidak dieja.
            if (letters > 0 && upper.toDouble() / letters > 0.7 && words >= 3) {
                line.lowercase().replaceFirstChar { it.uppercase() }
            } else line
        }
        var s = lines.joinToString("\n")
        s = reListMarker.replace(s) { m -> spell(m.groupValues[1]) + ", " }
        s = reCapsWord.replace(s) { m ->
            val w = m.groupValues[1]
            when {
                w in readableCaps -> w.lowercase()
                w.length == 1 -> letterNames[w[0]] ?: w
                w.length <= 3 -> spell(w)
                w.count { it in "AIUEO" } <= 1 -> spell(w)
                else -> w.lowercase().replaceFirstChar { it.uppercase() }
            }
        }
        return s
    }

    // ---------- Pipeline ----------

    fun prepare(raw: String, o: Options): String {
        var t = clean(raw)
        t = joinBrokenLines(t)
        if (o.expandAbbreviations) t = expandAbbr(t)
        if (o.numbersToWords) t = numbers(t)
        if (o.spellLettersIndo) t = spellLetters(t)
        t = t.replace(Regex("""[ ]{2,}"""), " ")
        t = t.replace(Regex(""" +([,.!?;:])"""), "$1")
        t = t.lines().joinToString("\n") { it.trim() }
        return t.trim()
    }

    // ---------- Pemecahan ----------

    private val sentenceEnd = Regex("""(?<=[.!?…])["')\]]*\s+""")

    private fun splitLong(p: String, max: Int): List<String> {
        if (p.length <= max) return listOf(p)
        val sentences = sentenceEnd.split(p).filter { it.isNotBlank() }
        val out = ArrayList<String>()
        val cur = StringBuilder()
        fun flush() { if (cur.isNotBlank()) out.add(cur.toString().trim()); cur.setLength(0) }
        for (s0 in sentences) {
            val pieces = if (s0.length > max) splitHard(s0, max) else listOf(s0)
            for (s in pieces) {
                if (cur.length + s.length + 1 > max) flush()
                if (cur.isNotEmpty()) cur.append(' ')
                cur.append(s)
            }
        }
        flush()
        return out
    }

    private fun splitHard(s: String, max: Int): List<String> {
        val out = ArrayList<String>()
        var rest = s
        while (rest.length > max) {
            var cut = rest.lastIndexOfAny(charArrayOf(',', ';', ':'), max)
            if (cut < max / 3) cut = rest.lastIndexOf(' ', max)
            if (cut < max / 3) cut = max
            out.add(rest.substring(0, cut + 1).trim())
            rest = rest.substring(cut + 1)
        }
        if (rest.isNotBlank()) out.add(rest.trim())
        return out
    }

    /**
     * Pecah teks yang sudah disiapkan menjadi potongan. Paragraf pendek digabung
     * (dipisah baris baru agar intonasi akhir kalimat tetap terjaga) hingga [mergeLimit].
     */
    fun chunk(prepared: String, maxChars: Int = 2200, mergeLimit: Int = 900): List<Chunk> {
        val paragraphs = prepared.split(Regex("""\n+""")).map { it.trim() }
            .filter { p -> p.any { it.isLetterOrDigit() } }
        val out = ArrayList<Chunk>()
        val buf = StringBuilder()
        fun flushBuf() {
            if (buf.isNotEmpty()) { out.add(Chunk(buf.toString(), true)); buf.setLength(0) }
        }
        for (p in paragraphs) {
            val para = if (p.last().isLetterOrDigit()) "$p." else p
            if (para.length > mergeLimit) {
                flushBuf()
                val parts = splitLong(para, maxChars)
                parts.forEachIndexed { i, s -> out.add(Chunk(s, i == parts.lastIndex)) }
            } else {
                if (buf.length + para.length + 1 > mergeLimit) flushBuf()
                if (buf.isNotEmpty()) buf.append('\n')
                buf.append(para)
            }
        }
        flushBuf()
        return out
    }

    fun countWords(t: String): Int {
        var n = 0; var inWord = false
        for (c in t) {
            if (c.isLetterOrDigit()) { if (!inWord) { n++; inWord = true } } else inWord = false
        }
        return n
    }
}
