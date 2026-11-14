package com.adriymine.tts.tts

import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.json.JSONArray
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class TtsException(message: String, val retryable: Boolean = true, cause: Throwable? = null) :
    IOException(message, cause)

/** Posisi satu kata di audio (satuan 100 ns, dari metadata WordBoundary server). */
data class WordMark(val offset: Long, val duration: Long, val text: String) {
    val startMs: Double get() = offset / 10_000.0
    val endMs: Double get() = (offset + duration) / 10_000.0
}

class SynthResult(val audio: ByteArray, val words: List<WordMark>)

data class Prosody(val ratePercent: Int = 0, val pitchHz: Int = 0, val volumePercent: Int = 0) {
    private fun signed(v: Int) = if (v >= 0) "+$v" else "$v"
    val rate get() = signed(ratePercent) + "%"
    val pitch get() = signed(pitchHz) + "Hz"
    val volume get() = signed(volumePercent) + "%"
}

/**
 * Klien layanan suara neural Microsoft Edge "Read Aloud" (gratis, tanpa API key).
 * Protokol: WebSocket -> speech.config -> ssml -> terima potongan audio MP3 -> turn.end.
 */
class EdgeTtsClient(private val http: OkHttpClient = defaultHttp) {

    companion object {
        val defaultHttp: OkHttpClient by lazy {
            OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(90, TimeUnit.SECONDS)
                .writeTimeout(20, TimeUnit.SECONDS)
                .pingInterval(15, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .build()
        }

        fun escapeXml(s: String): String {
            val sb = StringBuilder(s.length + 16)
            for (c in s) when (c) {
                '&' -> sb.append("&amp;")
                '<' -> sb.append("&lt;")
                '>' -> sb.append("&gt;")
                '"' -> sb.append("&quot;")
                '\'' -> sb.append("&apos;")
                else -> sb.append(c)
            }
            return sb.toString()
        }

        private fun jsDate(): String {
            val f = SimpleDateFormat("EEE MMM dd yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'", Locale.US)
            f.timeZone = TimeZone.getTimeZone("UTC")
            return f.format(Date())
        }

        private fun uuid() = UUID.randomUUID().toString().replace("-", "")

        fun buildSsml(text: String, voice: String, p: Prosody): String =
            "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
                "<voice name='$voice'><prosody pitch='${p.pitch}' rate='${p.rate}' volume='${p.volume}'>" +
                escapeXml(text) +
                "</prosody></voice></speak>"
    }

    private fun request(url: String): Request = Request.Builder()
        .url(url)
        .header("Pragma", "no-cache")
        .header("Cache-Control", "no-cache")
        .header("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
        .header("User-Agent", EdgeConfig.userAgent)
        .header("Accept-Language", "en-US,en;q=0.9")
        .header("Cookie", "muid=${EdgeDrm.muid()};")
        .build()

    /** Satu kali sintesis (tanpa retry). */
    suspend fun synthesizeOnce(text: String, voice: String, prosody: Prosody): SynthResult {
        val timeoutMs = 45_000L + text.length * 60L
        return withTimeout(timeoutMs) {
            suspendCancellableCoroutine { cont -> startSocket(cont, text, voice, prosody) }
        }
    }

    private fun startSocket(cont: CancellableContinuation<SynthResult>, text: String, voice: String, prosody: Prosody) {
        val audio = ByteArrayOutputStream()
        val words = ArrayList<WordMark>()
        var done = false
        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                val cfg = "X-Timestamp:${jsDate()}\r\n" +
                    "Content-Type:application/json; charset=utf-8\r\n" +
                    "Path:speech.config\r\n\r\n" +
                    "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{" +
                    "\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"true\"}," +
                    "\"outputFormat\":\"${EdgeConfig.OUTPUT_FORMAT}\"}}}}\r\n"
                webSocket.send(cfg)
                val ssml = "X-RequestId:${uuid()}\r\n" +
                    "Content-Type:application/ssml+xml\r\n" +
                    "X-Timestamp:${jsDate()}Z\r\n" +
                    "Path:ssml\r\n\r\n" +
                    buildSsml(text, voice, prosody)
                webSocket.send(ssml)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                if (text.contains("Path:audio.metadata")) {
                    runCatching {
                        val body = text.substring(text.indexOf("\r\n\r\n") + 4)
                        val arr = org.json.JSONObject(body).getJSONArray("Metadata")
                        for (i in 0 until arr.length()) {
                            val m = arr.getJSONObject(i)
                            if (m.optString("Type") != "WordBoundary") continue
                            val d = m.getJSONObject("Data")
                            words.add(WordMark(d.getLong("Offset"), d.getLong("Duration"),
                                d.optJSONObject("text")?.optString("Text") ?: ""))
                        }
                    }
                    return
                }
                if (text.contains("Path:turn.end")) {
                    synchronized(this) { if (done) return; done = true }
                    webSocket.close(1000, null)
                    val bytes = audio.toByteArray()
                    if (bytes.isEmpty()) {
                        if (cont.isActive) cont.resumeWithException(TtsException("Server tidak mengirim audio"))
                    } else if (cont.isActive) cont.resume(SynthResult(bytes, words.sortedBy { it.offset }))
                }
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                if (bytes.size < 2) return
                val headerLen = ((bytes[0].toInt() and 0xFF) shl 8) or (bytes[1].toInt() and 0xFF)
                if (headerLen + 2 > bytes.size) return
                val header = bytes.substring(2, 2 + headerLen).utf8()
                if (!header.contains("Path:audio")) return
                val start = 2 + headerLen
                if (start < bytes.size) {
                    synchronized(audio) { audio.write(bytes.substring(start).toByteArray()) }
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(1000, null)
                finishEarly("Koneksi ditutup server ($code)")
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                finishEarly("Koneksi ditutup ($code)")
            }

            private fun finishEarly(msg: String) {
                synchronized(this) { if (done) return; done = true }
                // Server menutup koneksi sebelum turn.end: biasanya SSML ditolak.
                if (cont.isActive) cont.resumeWithException(TtsException(msg))
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                synchronized(this) { if (done) return; done = true }
                if (response != null && response.code == 403) {
                    // Jam perangkat tidak sinkron: koreksi dengan tanggal server.
                    response.header("Date")?.let { d ->
                        runCatching {
                            val f = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
                            val server = f.parse(d)!!.time / 1000.0
                            val local = System.currentTimeMillis() / 1000.0 + EdgeDrm.clockSkewSeconds
                            EdgeDrm.clockSkewSeconds += server - local
                        }
                    }
                }
                val msg = when {
                    response != null -> "Server menolak (${response.code})"
                    t is java.net.UnknownHostException -> "Tidak ada koneksi internet"
                    t is java.net.SocketTimeoutException -> "Koneksi terlalu lambat (timeout)"
                    else -> "Gangguan jaringan: ${t.message ?: t.javaClass.simpleName}"
                }
                if (cont.isActive) cont.resumeWithException(TtsException(msg, cause = t))
            }
        }
        val ws = http.newWebSocket(request(EdgeConfig.wssUrl(uuid())), listener)
        cont.invokeOnCancellation { runCatching { ws.cancel() } }
    }

    /**
     * Sintesis dengan retry + backoff eksponensial. Mencoba hingga [attempts] kali.
     */
    suspend fun synthesize(
        text: String,
        voice: String,
        prosody: Prosody,
        attempts: Int = 6,
        onRetry: (Int, Throwable) -> Unit = { _, _ -> },
    ): SynthResult {
        var last: Throwable? = null
        for (i in 0 until attempts) {
            try {
                // Server kadang gagal berulang untuk kombinasi teks+prosodi tertentu:
                // mulai percobaan ke-3, ubah kecepatan sebesar 1% (tak terdengar) agar lolos.
                val p = if (i >= 2) prosody.copy(ratePercent = prosody.ratePercent + (if (i % 2 == 0) 1 else -1)) else prosody
                return synthesizeOnce(text, voice, p)
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
                last = TtsException("Waktu habis menunggu server", cause = e)
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                last = e
            }
            if (i < attempts - 1) {
                onRetry(i + 1, last!!)
                delay(minOf(1500L shl i, 20_000L))
            }
        }
        throw last ?: TtsException("Gagal")
    }

    /** Ambil daftar seluruh suara dari server (opsional, untuk menu "Semua bahasa"). */
    suspend fun fetchVoices(): List<Voice> = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        val req = Request.Builder().url(EdgeConfig.voiceListUrl())
            .header("User-Agent", EdgeConfig.userAgent)
            .header("Accept", "*/*")
            .header("Cookie", "muid=${EdgeDrm.muid()};")
            .build()
        http.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw TtsException("Gagal memuat daftar suara (${resp.code})")
            val arr = JSONArray(resp.body?.string() ?: "[]")
            (0 until arr.length()).mapNotNull { i ->
                val o = arr.optJSONObject(i) ?: return@mapNotNull null
                val short = o.optString("ShortName")
                if (short.isEmpty()) return@mapNotNull null
                val tags = o.optJSONObject("VoiceTag")
                val personalities = tags?.optJSONArray("VoicePersonalities")
                val pers = if (personalities != null) (0 until personalities.length()).joinToString(", ") { personalities.optString(it) } else ""
                Voice(
                    id = short,
                    name = VoiceCatalog.displayName(short),
                    gender = if (o.optString("Gender") == "Female") Gender.FEMALE else Gender.MALE,
                    locale = o.optString("Locale"),
                    description = pers,
                    group = VoiceGroup.OTHER,
                    gainSteps = 0,
                )
            }
        }
    }
}
