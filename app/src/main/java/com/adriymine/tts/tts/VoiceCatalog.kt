package com.adriymine.tts.tts

enum class Gender { FEMALE, MALE }

enum class VoiceGroup(val title: String, val subtitle: String) {
    INDONESIA("Suara bahasa Indonesia", "Logat Indonesia asli. Ucapan huruf & kata tepat."),
    OTHER("Lainnya", ""),
}

/**
 * Satu "gaya bicara": suara asli Indonesia (Gadis/Ardi) + intonasi, nada, irama, dan jeda
 * yang sudah diatur otomatis. Pengguna cukup memilih gaya; semua angka diatur aplikasi.
 *
 * Hanya suara id-ID yang dipakai: uji fonem membuktikan suara multibahasa (aksen Inggris/
 * Jerman) bisa membaca c → k, a → e, Q → "kyu". Gadis & Ardi 100% tepat.
 */
data class Voice(
    val id: String,
    val name: String,
    val gender: Gender,
    val locale: String,
    val description: String,
    val group: VoiceGroup,
    val recommended: Boolean = false,
    /** Skor kealamian hasil uji UTMOS (1–5). */
    val score: Double = 0.0,
    /** Kecepatan (%) & nada (Hz) gaya ini, terhadap suara dasar. */
    val tuneRate: Int = 0,
    val tunePitch: Int = 0,
    /** Penyamaan volume ke ±-19 LUFS (langkah 1,5 dB). */
    val gainSteps: Int = 0,
    val accuracy: Int = 100,
    /** Nama suara di server. */
    val serverId: String = id,
    /** Pengali panjang jeda (1.0 = normal). */
    val pauseScale: Double = 1.0,
    /** Contoh kalimat yang cocok untuk gaya ini. */
    val sample: String = "",
) {
    val isMultilingual: Boolean get() = serverId.contains("Multilingual")
    val baseName: String get() = name.substringBefore(' ')
    val styleName: String get() = name.substringAfter("· ", "Natural")
}

object VoiceCatalog {
    private const val GADIS = "id-ID-GadisNeural"
    private const val ARDI = "id-ID-ArdiNeural"

    val curated: List<Voice> = listOf(
        Voice("gadis-natural", "Gadis · Natural", Gender.FEMALE, "id-ID",
            "Wanita, jernih & ramah. Cocok untuk apa saja.", VoiceGroup.INDONESIA, true, 3.59,
            tuneRate = -5, tunePitch = -3, gainSteps = 1, serverId = GADIS,
            sample = "Halo, saya Gadis. Saya akan membacakan tulisanmu dengan suara yang jelas dan enak didengar."),
        Voice("gadis-cerita", "Gadis · Bercerita", Gender.FEMALE, "id-ID",
            "Hangat & ekspresif. Untuk cerpen, novel, dongeng.", VoiceGroup.INDONESIA, false, 3.39,
            tuneRate = -6, tunePitch = 2, gainSteps = 1, serverId = GADIS, pauseScale = 1.1,
            sample = "Pada suatu malam yang sunyi, seekor kucing kecil duduk di jendela. Ia menatap bulan, lalu tersenyum."),
        Voice("gadis-ceria", "Gadis · Ceria", Gender.FEMALE, "id-ID",
            "Semangat & riang. Untuk promosi, konten media sosial.", VoiceGroup.INDONESIA, false, 3.48,
            tuneRate = 4, tunePitch = 6, gainSteps = 1, serverId = GADIS, pauseScale = 0.9,
            sample = "Hai semuanya! Ada kabar gembira hari ini. Yuk, simak sampai habis, ya!"),
        Voice("gadis-lembut", "Gadis · Lembut", Gender.FEMALE, "id-ID",
            "Tenang & pelan. Untuk renungan, puisi, pengantar tidur.", VoiceGroup.INDONESIA, false, 3.59,
            tuneRate = -12, tunePitch = -2, gainSteps = 1, serverId = GADIS, pauseScale = 1.25,
            sample = "Tarik napas perlahan. Rasakan tenangnya malam, dan biarkan semua lelah pergi."),
        Voice("ardi-natural", "Ardi · Natural", Gender.MALE, "id-ID",
            "Pria, tegas & bersahabat. Cocok untuk apa saja.", VoiceGroup.INDONESIA, true, 3.62,
            tuneRate = -8, tunePitch = -4, gainSteps = -1, serverId = ARDI,
            sample = "Halo, saya Ardi. Saya siap membacakan tulisanmu dengan jelas dan tepat."),
        Voice("ardi-berita", "Ardi · Berita", Gender.MALE, "id-ID",
            "Lugas & berwibawa. Untuk berita, pengumuman, materi.", VoiceGroup.INDONESIA, false, 3.63,
            tuneRate = 0, tunePitch = -2, gainSteps = -1, serverId = ARDI, pauseScale = 0.9,
            sample = "Jakarta, hari ini. Pemerintah mengumumkan program beasiswa baru untuk dua puluh lima ribu mahasiswa."),
        Voice("ardi-hangat", "Ardi · Hangat", Gender.MALE, "id-ID",
            "Dalam & santai. Untuk buku audio, podcast, kisah inspirasi.", VoiceGroup.INDONESIA, false, 3.64,
            tuneRate = -12, tunePitch = -6, gainSteps = -1, serverId = ARDI, pauseScale = 1.15,
            sample = "Hidup ini seperti perjalanan panjang. Kadang kita perlu berhenti sejenak, lalu melangkah lagi."),
    )

    const val DEFAULT_VOICE = "gadis-natural"

    /** Kunci lama (nama suara server / suara yang dihapus) dipetakan ke gaya yang setara. */
    private fun migrate(id: String): String = when {
        curated.any { it.id == id } -> id
        id == ARDI -> "ardi-natural"
        listOf("Andrew", "Brian", "Remy", "Giuseppe", "William", "Hyunsu", "Osman", "Dimas", "Jajang", "Florian")
            .any { id.contains(it) } -> "ardi-natural"
        else -> DEFAULT_VOICE
    }

    val ranked: List<Voice> get() = curated

    fun find(id: String, @Suppress("UNUSED_PARAMETER") extra: List<Voice> = emptyList()): Voice =
        curated.first { it.id == migrate(id) }

    fun displayName(shortName: String): String = shortName

    fun sampleText(v: Voice): String = v.sample.ifBlank {
        "Halo, apa kabar? Saya siap membacakan tulisanmu dengan suara yang jelas dan natural."
    }
}
