package com.adriymine.tts.tts

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Klien untuk server VoxCPM2 milik pengguna (lihat server/voxcpm_server.py).
 * Server mengembalikan MP3 24 kHz mono 96 kbps, sama dengan format mesin utama,
 * sehingga penggabung & penyisip jeda aplikasi tetap bekerja.
 */
class VoxClient {
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.MINUTES)   // model besar bisa lama, terutama tanpa GPU
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    data class Health(val ok: Boolean, val message: String)

    private fun base(url: String) = url.trim().trimEnd('/').let {
        if (it.startsWith("http://") || it.startsWith("https://")) it else "http://$it"
    }

    /** Kunci Hugging Face (hf_...) untuk server di Space privat; kosong bila server di komputer sendiri. */
    var hfToken: String = ""

    private fun Request.Builder.auth(token: String) = apply {
        if (token.isNotBlank()) header("X-Adriy-Token", token.trim())
        when {
            hfToken.isNotBlank() -> header("Authorization", "Bearer ${hfToken.trim()}")
            token.isNotBlank() -> header("Authorization", "Bearer ${token.trim()}")
        }
    }

    suspend fun health(url: String, token: String): Health = withContext(Dispatchers.IO) {
        if (url.isBlank()) return@withContext Health(false, "Alamat server belum diisi")
        runCatching {
            http.newBuilder().readTimeout(15, TimeUnit.SECONDS).build()
                .newCall(Request.Builder().url(base(url) + "/health").auth(token).build()).execute().use { r ->
                    when {
                        r.code == 401 -> Health(false, "Kata sandi server atau kunci Hugging Face salah")
                        r.code == 404 -> Health(false, "Server tidak ditemukan. Periksa alamat, atau kunci Hugging Face bila Space privat")
                        !r.isSuccessful -> Health(false, "Server menjawab ${r.code}")
                        else -> {
                            val o = JSONObject(r.body?.string() ?: "{}")
                            val dev = o.optString("device")
                            Health(o.optBoolean("ok"), "Terhubung • VoxCPM2 • " +
                                if (dev == "cuda") "GPU (cepat)" else "CPU (lambat)")
                        }
                    }
                }
        }.getOrElse { Health(false, "Tidak bisa terhubung: ${it.message}") }
    }

    suspend fun synthesize(url: String, token: String, text: String, voice: String, attempts: Int = 3): ByteArray {
        var last: Throwable? = null
        for (i in 0 until attempts) {
            try {
                return withContext(Dispatchers.IO) {
                    val body = JSONObject().put("text", text).put("voice", voice).toString()
                        .toRequestBody("application/json".toMediaType())
                    http.newCall(Request.Builder().url(base(url) + "/tts").auth(token).post(body).build()).execute().use { r ->
                        if (r.code == 401) throw TtsException("Kata sandi server VoxCPM2 salah", retryable = false)
                        if (!r.isSuccessful) throw TtsException("Server VoxCPM2 menjawab ${r.code}")
                        val b = r.body?.bytes() ?: ByteArray(0)
                        if (b.size < 1000) throw TtsException("Server VoxCPM2 tidak mengirim audio")
                        b
                    }
                }
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: TtsException) {
                if (!e.retryable) throw e
                last = e
            } catch (e: Exception) {
                last = TtsException("Server VoxCPM2 tidak terjangkau: ${e.message}", cause = e)
            }
            if (i < attempts - 1) delay(3000L * (i + 1))
        }
        throw last ?: TtsException("Gagal")
    }
}
