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
        /**
         * Gabungkan kalimat sangat pendek (≤3 kata) ke kalimat sebelahnya dengan koma.
         * Suara multibahasa menebak bahasa per kalimat; kalimat seperti "Dia tersenyum."
         * yang berdiri sendiri bisa terbaca berlogat asing. Terbukti lewat uji ASR.
         */
        val mergeShortSentences: Boolean = false,
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
        // Kurung berisi kalimat sisipan: dibaca dengan jeda singkat seperti koma.
        t = t.replace(Regex("""\(([^()\d][^()]{2,})\)"""), ", $1,")
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
        """(?i)\bpk\.\s*(?=\d)""" to "pukul ", """(?i)\bs\.d\.?""" to "sampai dengan", """(?i)\ba\.n\.""" to "atas nama",
        """(?i)\bu\.p\.""" to "untuk perhatian", """\bdkk\.?""" to "dan kawan-kawan", """\bttd\.?""" to "tertanda",
        """€\s?(?=\d)""" to "EURO_", """£\s?(?=\d)""" to "POUND_",
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
    private val reRange = Regex("""(?<![\d.,\-])(\d{1,4})\s?[–-]\s?(\d{1,4})(?![\d\-]|[.,]\d)""")
    private val reThousands = Regex("""(?<![\d.,])(\d{1,3}(?:\.\d{3})+)(?:,(\d+))?(?![\d])""")
    private val reDecimal = Regex("""(?<![\d.,])(\d+),(\d+)(?![\d])""")
    private val reDotTime = Regex("""(?<![\d.,])([01]?\d|2[0-3])\.([0-5]\d)(?![\d.])""")
    private val reDotDecimal = Regex("""(?<![\d.,])(\d+)\.(\d{1,2})(?![\d.])""")
    private val rePercent = Regex("""(\d)\s?%""")
    private val reInt = Regex("""\d+""")

    private fun decimal(intPart: String, frac: String): String =
        IndoNumber.read(intPart) + " koma " + IndoNumber.digits(frac)

    private val reBareUnit = Regex("""(?i)(\bper\s|/)(kg|km|cm|mm|ml|liter|ltr|l|m|g|gr|jam|hari|bulan|orang|porsi|pcs)\b""")
    private val bareUnitNames = mapOf("kg" to "kilogram", "km" to "kilometer", "cm" to "sentimeter", "mm" to "milimeter",
        "ml" to "mililiter", "liter" to "liter", "ltr" to "liter", "l" to "liter", "m" to "meter", "g" to "gram", "gr" to "gram",
        "jam" to "jam", "hari" to "hari", "bulan" to "bulan", "orang" to "orang", "porsi" to "porsi", "pcs" to "buah")

    private val romanKeywords = Regex("""(?i)\b(Bab|Pasal|Abad|Jilid|Bagian|Seri|Tahap|Kelas|Volume|Vol\.|Babak|Episode|Sesi|Season|Chapter|Perang Dunia|Paus|Raja|Hamengkubuwono|Pakubuwono|Paku Buwono)\s+([IVXLC]{1,7})\b""")
    private val reMonthAbbr = Regex("""\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Agt|Ags|Agust|Sep|Sept|Okt|Nov|Des)\b""")
    private val monthAbbr = mapOf("Jan" to 1, "Feb" to 2, "Mar" to 3, "Apr" to 4, "Mei" to 5, "Jun" to 6, "Jul" to 7, "Agu" to 8,
        "Agt" to 8, "Ags" to 8, "Agust" to 8, "Sep" to 9, "Sept" to 9, "Okt" to 10, "Nov" to 11, "Des" to 12)
    private val rePhone = Regex("""(?<![\d])(\+62|0)\d{2,4}(?:[- ]?\d{3,4}){1,3}(?![\d])""")
    private val reCurrencyMag = Regex("""(?i)\bRp\.?\s?(\d+(?:,\d+)?)\s?(ribu|rb|juta|jt|miliar|M|triliun|T)\b\.?""")
    private val reDecades = Regex("""(\d+)-an\b""")
    private val reTimes = Regex("""\b(\d+)\s?[xX]\b""")
    private val reFraction = Regex("""(?<![\d/])(\d{1,4})/(\d{1,4})(?![\d/])""")
    private val reRatio = Regex("""(?<![\d:])(\d{1,3}):(\d)(?![\d:])""")
    private val reParenNum = Regex("""\((\d{1,3}|[a-z])\)""")
    private val reEuro = Regex("""EURO_(\d{1,3}(?:[.,]\d{3})+|\d+)""")
    private val rePound = Regex("""POUND_(\d{1,3}(?:[.,]\d{3})+|\d+)""")

    private fun roman(r: String): Int? {
        val v = mapOf('I' to 1, 'V' to 5, 'X' to 10, 'L' to 50, 'C' to 100)
        var total = 0
        for (i in r.indices) {
            val c = v[r[i].uppercaseChar()] ?: return null
            val n = if (i + 1 < r.length) v[r[i + 1].uppercaseChar()] ?: return null else 0
            total += if (c < n) -c else c
        }
        return total.takeIf { it in 1..399 }
    }

    private val fractionWords = mapOf(2 to "setengah", 3 to "sepertiga", 4 to "seperempat", 5 to "seperlima",
        8 to "seperdelapan", 10 to "sepersepuluh")

    fun numbers(t: String): String {
        var s = t
        s = romanKeywords.replace(s) { m ->
            val n = roman(m.groupValues[2]) ?: return@replace m.value
            val kw = m.groupValues[1]
            if (kw.equals("Perang Dunia", true) || kw.equals("Paus", true) || kw.equals("Raja", true))
                "$kw ${IndoNumber.ordinal(n.toString())}" else "$kw ${IndoNumber.read(n.toString())}"
        }
        s = rePhone.replace(s) { m ->
            " " + m.value.split(Regex("[- ]")).joinToString(", ") { g ->
                if (g.startsWith("+")) "plus " + IndoNumber.digits(g) else IndoNumber.digits(g)
            } + " "
        }
        s = reCurrencyMag.replace(s) { m ->
            val mag = when (m.groupValues[2].lowercase()) {
                "ribu", "rb" -> "ribu"; "juta", "jt" -> "juta"; "miliar", "m" -> "miliar"; else -> "triliun"
            }
            " " + num(m.groupValues[1]) + " $mag rupiah "
        }
        s = reEuro.replace(s) { m -> IndoNumber.read(m.groupValues[1].replace(".", "").replace(",", "")) + " euro" }
        s = rePound.replace(s) { m -> IndoNumber.read(m.groupValues[1].replace(".", "").replace(",", "")) + " pound sterling" }
        s = reMonthAbbr.replace(s) { m -> m.groupValues[1] + " " + bulan[monthAbbr[m.groupValues[2]] ?: 0] }
        s = reDecades.replace(s) { m -> IndoNumber.read(m.groupValues[1]) + "an" }
        s = reTimes.replace(s) { m -> IndoNumber.read(m.groupValues[1]) + " kali" }
        s = reParenNum.replace(s) { m -> " " + m.groupValues[1] + " " }
        s = reFraction.replace(s) { m ->
            val a = m.groupValues[1].toInt(); val b = m.groupValues[2].toInt()
            when {
                m.groupValues[1].length == 4 && m.groupValues[2].length == 4 -> IndoNumber.read(m.groupValues[1]) + " " + IndoNumber.read(m.groupValues[2])
                a == 1 && fractionWords.containsKey(b) -> fractionWords[b]!!
                a in 1 until b && b <= 10 -> IndoNumber.read("$a") + " per " + IndoNumber.read("$b")
                else -> m.value
            }
        }
        s = reRatio.replace(s) { m -> IndoNumber.read(m.groupValues[1]) + " banding " + IndoNumber.read(m.groupValues[2]) }
        s = reBareUnit.replace(s) { m -> " per " + (bareUnitNames[m.groupValues[2].lowercase()] ?: m.groupValues[2]) }
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
            val a = m.groupValues[1].toInt(); val b = m.groupValues[2].toInt()
            // 10-20 = rentang; 3-1 = skor
            val before = s.substring(maxOf(0, m.range.first - 24), m.range.first).lowercase()
            val isScore = Regex("""skor|menang|kalah|imbang|unggul|hasil akhir|tertinggal""").containsMatchIn(before)
            IndoNumber.read(m.groupValues[1]) + (if (b > a && !isScore) " sampai " else " ") + IndoNumber.read(m.groupValues[2])
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

    // Semua singkatan dieja dengan abjad Indonesia; tidak ada pelafalan gaya Inggris.
    private val englishAcronyms = mapOf("OK" to "oke")

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
                w in englishAcronyms -> englishAcronyms.getValue(w)
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
        if (o.mergeShortSentences) t = mergeShort(t)
        t = t.replace(Regex("""[ ]{2,}"""), " ")
        t = t.replace(Regex(""" +([,.!?;:])"""), "$1")
        t = t.lines().joinToString("\n") { it.trim() }
        return t.trim()
    }

    // ---------- Kalimat pendek ----------

    private val reSentence = Regex("""[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$""")

    fun mergeShort(t: String): String = t.split('\n').joinToString("\n") { line ->
        val parts = reSentence.findAll(line).map { it.value }.toMutableList()
        // Judul/baris pendek (≤8 kata) dibiarkan apa adanya.
        if (parts.size < 2 || countWords(line) <= 8) return@joinToString line
        fun words(x: String) = countWords(x)
        fun endsWithPeriod(x: String) = x.trimEnd().let { it.endsWith(".") && !it.endsWith("..") }
        fun toComma(x: String): String {
            val tr = x.trimEnd()
            return tr.substring(0, tr.length - 1) + ", "
        }
        for (i in parts.indices) {
            val cur = parts[i]
            if (words(cur) > 3 || !endsWithPeriod(cur)) continue
            if (i < parts.lastIndex) {
                parts[i] = toComma(cur)
            } else if (i > 0 && endsWithPeriod(parts[i - 1])) {
                parts[i - 1] = toComma(parts[i - 1])
            }
        }
        parts.joinToString("").trim()
    }

    // ---------- Pemecahan ----------

    private val sentenceEnd = Regex("""(?<=[.!?…]["')\]]{0,3})\s+""")

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
     * Pecah teks yang sudah disiapkan menjadi potongan berbasis kalimat.
     *  - potongan awal dibuat bertahap makin besar ([ramp]) agar audio cepat mulai & tidak tersendat,
     *  - paragraf pendek boleh digabung (dipisah baris baru) selama potongan < [mergeLimit],
     *  - kalimat tidak pernah dipotong kecuali lebih panjang dari batas (dipotong di koma/spasi).
     */
    fun chunk(
        prepared: String,
        maxChars: Int = 1500,
        mergeLimit: Int = 900,
        firstLimit: Int = 260,
        ramp: List<Int> = listOf(firstLimit, (firstLimit * 1.5).toInt(), (firstLimit * 2.2).toInt()),
    ): List<Chunk> {
        data class Unit(val text: String, val endsPara: Boolean)
        val units = ArrayList<Unit>()
        prepared.split(Regex("""\n+""")).map { it.trim() }.filter { p -> p.any { it.isLetterOrDigit() } }.forEach { p0 ->
            val p = if (p0.last().isLetterOrDigit()) "$p0." else p0
            val sentences = sentenceEnd.split(p).filter { it.isNotBlank() }
            val pieces = sentences.flatMap { if (it.length > maxChars) splitHard(it, maxChars) else listOf(it) }
            pieces.forEachIndexed { i, x -> units.add(Unit(x.trim(), i == pieces.lastIndex)) }
        }
        val out = ArrayList<Chunk>()
        val cur = StringBuilder()
        var curEndsPara = false
        fun limit() = minOf(maxChars, ramp.getOrElse(out.size) { maxChars })
        for (u in units) {
            if (cur.isNotEmpty()) {
                val sepLen = 1
                val tooBig = cur.length + sepLen + u.text.length > limit()
                val paraBreakNotMergeable = curEndsPara && cur.length + u.text.length > minOf(mergeLimit, limit())
                if (tooBig || paraBreakNotMergeable) {
                    out.add(Chunk(cur.toString(), curEndsPara)); cur.setLength(0)
                }
            }
            if (cur.isNotEmpty()) cur.append(if (curEndsPara) '\n' else ' ')
            cur.append(u.text)
            curEndsPara = u.endsPara
        }
        if (cur.isNotEmpty()) out.add(Chunk(cur.toString(), true))
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
