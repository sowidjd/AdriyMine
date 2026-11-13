package com.adriymine.tts.tts

/**
 * Konstanta layanan suara neural Microsoft Edge "Read Aloud".
 * Nilai versi Chromium bisa diganti dari Pengaturan > Lanjutan bila Microsoft
 * mengubah syarat versi (tanpa perlu APK baru).
 */
object EdgeConfig {
    const val TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    const val DEFAULT_CHROMIUM_FULL_VERSION = "143.0.3650.75"
    const val BASE = "speech.platform.bing.com/consumer/speech/synthesize/readaloud"
    const val OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3"

    @Volatile
    var chromiumFullVersion: String = DEFAULT_CHROMIUM_FULL_VERSION

    val chromiumMajor: String get() = chromiumFullVersion.substringBefore('.')
    val secMsGecVersion: String get() = "2-$chromiumFullVersion"

    fun wssUrl(connectionId: String): String =
        "wss://$BASE/edge/v1?TrustedClientToken=$TRUSTED_CLIENT_TOKEN" +
            "&ConnectionId=$connectionId" +
            "&Sec-MS-GEC=${EdgeDrm.generateNow()}" +
            "&Sec-MS-GEC-Version=$secMsGecVersion"

    fun voiceListUrl(): String =
        "https://$BASE/voices/list?trustedclienttoken=$TRUSTED_CLIENT_TOKEN" +
            "&Sec-MS-GEC=${EdgeDrm.generateNow()}" +
            "&Sec-MS-GEC-Version=$secMsGecVersion"

    val userAgent: String
        get() = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/$chromiumMajor.0.0.0 Safari/537.36 Edg/$chromiumMajor.0.0.0"
}
