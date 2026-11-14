package com.adriymine.tts.tts

enum class Gender { FEMALE, MALE }

enum class VoiceGroup(val title: String, val subtitle: String) {
    INDONESIA("Bahasa Indonesia (asli)", "Logat Indonesia paling pas, ejaan huruf & angka sempurna"),
    MULTI("Multibahasa — fasih bahasa Indonesia", "Suara AI generasi terbaru: paling ekspresif & bernada hidup"),
    REGIONAL("Melayu & bahasa daerah", "Untuk teks bahasa Melayu, Jawa, atau Sunda"),
    OTHER("Bahasa lain", "Semua suara dari server"),
}

data class Voice(
    val id: String,
    val name: String,
    val gender: Gender,
    val locale: String,
    val description: String,
    val group: VoiceGroup,
    val recommended: Boolean = false,
    /** Skor kealamian hasil uji UTMOS (1–5) pada teks bahasa Indonesia; 0 = belum diuji. */
    val score: Double = 0.0,
    /** Setelan optimal hasil uji (ditambahkan ke setelan pengguna bila "setelan optimal" aktif). */
    val tuneRate: Int = 0,
    val tunePitch: Int = 0,
    /** Penyamaan volume ke ±-19 LUFS (langkah 1,5 dB), hasil ukur EBU R128. */
    val gainSteps: Int = 1,
) {
    /** Suara multibahasa butuh ejaan huruf/akronim ala Indonesia agar tidak dieja bahasa Inggris. */
    val isMultilingual: Boolean get() = id.contains("Multilingual")
}

object VoiceCatalog {
    val curated: List<Voice> = listOf(
        Voice("id-ID-GadisNeural", "Gadis", Gender.FEMALE, "id-ID",
            "Wanita Indonesia, jernih & ramah. Terbaik untuk ejaan huruf, angka, singkatan.", VoiceGroup.INDONESIA, recommended = true, score = 3.7, tuneRate = -5, tunePitch = -3),
        Voice("id-ID-ArdiNeural", "Ardi", Gender.MALE, "id-ID",
            "Pria Indonesia, tegas & bersahabat. Cocok untuk narasi, berita, materi belajar.", VoiceGroup.INDONESIA, recommended = true, score = 3.64, tuneRate = -8, tunePitch = -4, gainSteps = -1),

        Voice("en-US-AvaMultilingualNeural", "Ava", Gender.FEMALE, "multi",
            "Sangat ekspresif, hangat, penuh emosi. Cocok untuk cerita & novel.", VoiceGroup.MULTI, recommended = true, score = 4.19, tuneRate = -5, tunePitch = 2),
        Voice("en-US-AndrewMultilingualNeural", "Andrew", Gender.MALE, "multi",
            "Hangat, percaya diri, natural seperti orang bicara. Cocok untuk narasi & podcast.", VoiceGroup.MULTI, recommended = true, score = 4.23, tuneRate = 0, tunePitch = 0),
        Voice("en-US-EmmaMultilingualNeural", "Emma", Gender.FEMALE, "multi",
            "Ceria, jelas, gaya percakapan. Cocok untuk konten santai & edukasi.", VoiceGroup.MULTI, recommended = true, score = 4.17, tuneRate = 0, tunePitch = 0, gainSteps = 0),
        Voice("en-US-BrianMultilingualNeural", "Brian", Gender.MALE, "multi",
            "Santai, tulus, mudah didengar. Cocok untuk vlog & cerita sehari-hari.", VoiceGroup.MULTI, score = 3.91, tuneRate = 0, tunePitch = 0),
        Voice("de-DE-SeraphinaMultilingualNeural", "Seraphina", Gender.FEMALE, "multi",
            "Lembut, dewasa, tenang. Cocok untuk audiobook & renungan.", VoiceGroup.MULTI, score = 3.72, tuneRate = 0, tunePitch = 0),
        Voice("de-DE-FlorianMultilingualNeural", "Florian", Gender.MALE, "multi",
            "Berat, berwibawa. Cocok untuk dokumenter & narasi serius.", VoiceGroup.MULTI, score = 3.95, tuneRate = 0, tunePitch = 0),
        Voice("fr-FR-VivienneMultilingualNeural", "Vivienne", Gender.FEMALE, "multi",
            "Anggun & halus. Cocok untuk puisi dan cerita romantis.", VoiceGroup.MULTI, score = 3.7, tuneRate = 0, tunePitch = 0),
        Voice("fr-FR-RemyMultilingualNeural", "Remy", Gender.MALE, "multi",
            "Ramah & ringan. Cocok untuk konten santai.", VoiceGroup.MULTI, recommended = true, score = 4.08, tuneRate = 0, tunePitch = 0),
        Voice("it-IT-GiuseppeMultilingualNeural", "Giuseppe", Gender.MALE, "multi",
            "Bersemangat & hangat. Cocok untuk iklan dan promosi.", VoiceGroup.MULTI, score = 4.06, tuneRate = 0, tunePitch = 0),
        Voice("en-AU-WilliamMultilingualNeural", "William", Gender.MALE, "multi",
            "Jelas & stabil. Cocok untuk tutorial dan materi pelajaran.", VoiceGroup.MULTI, score = 3.87, tuneRate = 0, tunePitch = 0),
        Voice("pt-BR-ThalitaMultilingualNeural", "Thalita", Gender.FEMALE, "multi",
            "Muda, cerah, bersemangat. Cocok untuk konten media sosial.", VoiceGroup.MULTI, score = 3.72, tuneRate = 0, tunePitch = 0, gainSteps = 2),
        Voice("ko-KR-HyunsuMultilingualNeural", "Hyunsu", Gender.MALE, "multi",
            "Muda & lembut. Cocok untuk cerita ringan.", VoiceGroup.MULTI, score = 4.04, tuneRate = 0, tunePitch = 0),

        Voice("ms-MY-YasminNeural", "Yasmin (Melayu)", Gender.FEMALE, "ms-MY",
            "Wanita Malaysia. Logat Melayu.", VoiceGroup.REGIONAL, score = 3.57, tuneRate = 0, tunePitch = 0, gainSteps = 0),
        Voice("ms-MY-OsmanNeural", "Osman (Melayu)", Gender.MALE, "ms-MY",
            "Pria Malaysia. Logat Melayu.", VoiceGroup.REGIONAL, score = 4.06, tuneRate = 0, tunePitch = 0, gainSteps = 0),
        Voice("jv-ID-SitiNeural", "Siti (Jawa)", Gender.FEMALE, "jv-ID",
            "Untuk teks berbahasa Jawa.", VoiceGroup.REGIONAL),
        Voice("jv-ID-DimasNeural", "Dimas (Jawa)", Gender.MALE, "jv-ID",
            "Untuk teks berbahasa Jawa.", VoiceGroup.REGIONAL),
        Voice("su-ID-TutiNeural", "Tuti (Sunda)", Gender.FEMALE, "su-ID",
            "Untuk teks berbahasa Sunda.", VoiceGroup.REGIONAL),
        Voice("su-ID-JajangNeural", "Jajang (Sunda)", Gender.MALE, "su-ID",
            "Untuk teks berbahasa Sunda.", VoiceGroup.REGIONAL),
    )

    const val DEFAULT_VOICE = "en-US-AvaMultilingualNeural"

    /** Urutan tampil: kelompok, lalu skor kealamian tertinggi. */
    val ranked: List<Voice> get() = curated.sortedWith(compareBy<Voice>({ it.group.ordinal }, { -it.score }))

    fun find(id: String, extra: List<Voice> = emptyList()): Voice =
        curated.firstOrNull { it.id == id } ?: extra.firstOrNull { it.id == id }
        ?: Voice(id, displayName(id), Gender.FEMALE, id.take(5), "", VoiceGroup.OTHER, gainSteps = 0)

    fun displayName(shortName: String): String {
        val parts = shortName.split('-')
        val n = parts.lastOrNull()?.removeSuffix("Neural")?.removeSuffix("Multilingual") ?: shortName
        val loc = parts.take(2).joinToString("-")
        return "$n ($loc)"
    }

    fun sampleText(v: Voice): String = when (v.locale) {
        "jv-ID" -> "Sugeng enjang, kula badhe maosaken seratan panjenengan kanthi swanten ingkang alus."
        "su-ID" -> "Wilujeng enjing, abdi bade maoskeun tulisan anjeun kalayan sora anu lemes."
        "ms-MY" -> "Selamat pagi, saya akan membacakan tulisan anda dengan suara yang jelas."
        "id-ID", "multi" -> "Halo, apa kabar? Saya ${v.name.substringBefore(' ')}. Saya siap membacakan tulisanmu dengan suara yang jelas, natural, dan penuh perasaan."
        else -> "Hello! This is a sample of my voice."
    }
}
