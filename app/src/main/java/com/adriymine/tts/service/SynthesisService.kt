package com.adriymine.tts.service

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import com.adriymine.tts.App
import com.adriymine.tts.MainActivity
import com.adriymine.tts.R
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * Layanan latar depan agar konversi teks panjang tetap berjalan saat layar mati
 * atau aplikasi diminimalkan.
 */
class SynthesisService : LifecycleService() {

    companion object {
        const val CHANNEL = "synthesis"
        private const val ID = 1001
        private const val DONE_ID = 1002
        const val ACTION_CANCEL = "com.adriymine.tts.CANCEL"

        fun start(context: Context) {
            runCatching {
                ContextCompat.startForegroundService(context, Intent(context, SynthesisService::class.java))
            }
        }
    }

    private var started = false
    private var wakeLock: android.os.PowerManager.WakeLock? = null
    private var wifiLock: android.net.wifi.WifiManager.WifiLock? = null

    /** Jaga CPU & Wi-Fi tetap aktif saat layar mati, agar proses tidak terputus (penyebab gagal). */
    private fun acquireLocks() {
        runCatching {
            val pm = getSystemService(POWER_SERVICE) as android.os.PowerManager
            wakeLock = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "AdriyTTS:synthesis").apply {
                setReferenceCounted(false); acquire(3 * 60 * 60_000L)
            }
        }
        runCatching {
            @Suppress("DEPRECATION")
            val mode = if (Build.VERSION.SDK_INT >= 29) android.net.wifi.WifiManager.WIFI_MODE_FULL_HIGH_PERF
                else android.net.wifi.WifiManager.WIFI_MODE_FULL
            val wm = applicationContext.getSystemService(WIFI_SERVICE) as android.net.wifi.WifiManager
            wifiLock = wm.createWifiLock(mode, "AdriyTTS:synthesis").apply { setReferenceCounted(false); acquire() }
        }
    }

    private fun releaseLocks() {
        runCatching { if (wakeLock?.isHeld == true) wakeLock?.release() }
        runCatching { if (wifiLock?.isHeld == true) wifiLock?.release() }
    }

    override fun onDestroy() {
        releaseLocks()
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        if (intent?.action == ACTION_CANCEL) {
            App.get(this).engine.cancel()
        }
        if (!started) {
            started = true
            val ok = runCatching {
                val type = if (Build.VERSION.SDK_INT >= 29) ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC else 0
                ServiceCompat.startForeground(this, ID, build("Menyiapkan…", 0, 0), type)
            }.isSuccess
            if (!ok) { stopSelf(); return START_NOT_STICKY }
            acquireLocks()
            lifecycleScope.launch {
                App.get(this@SynthesisService).engine.state.collectLatest { s ->
                    if (s.active) {
                        val text = if (s.total > 0) "Bagian ${s.completed} dari ${s.total}" else "Menyiapkan teks…"
                        notify(build(text, s.completed, s.total))
                    } else {
                        finishWith(s)
                    }
                }
            }
        }
        return START_NOT_STICKY
    }

    private fun finishWith(s: JobState) {
        val nm = NotificationManagerCompat.from(this)
        val msg = when (s.status) {
            JobStatus.DONE -> "Selesai: ${s.title}" + (s.exportedTo?.let { " • tersimpan di $it" } ?: "")
            JobStatus.ERROR -> "Terhenti: ${s.message ?: "gagal"}"
            else -> null
        }
        releaseLocks()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        if (msg != null) runCatching {
            nm.notify(DONE_ID, NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_notif)
                .setContentTitle(if (s.status == JobStatus.DONE) "Audio siap" else "Konversi terhenti")
                .setContentText(msg)
                .setStyle(NotificationCompat.BigTextStyle().bigText(msg))
                .setContentIntent(openApp())
                .setAutoCancel(true)
                .build())
        }
        stopSelf()
    }

    private fun openApp(): PendingIntent = PendingIntent.getActivity(
        this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    private fun build(text: String, done: Int, total: Int): Notification {
        val cancel = PendingIntent.getService(
            this, 1, Intent(this, SynthesisService::class.java).setAction(ACTION_CANCEL),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_notif)
            .setContentTitle("Membuat audio…")
            .setContentText(text)
            .setOnlyAlertOnce(true)
            .setOngoing(true)
            .setProgress(total.coerceAtLeast(1), done, total == 0)
            .setContentIntent(openApp())
            .addAction(0, "Batalkan", cancel)
            .build()
    }

    private fun notify(n: Notification) {
        runCatching { NotificationManagerCompat.from(this).notify(ID, n) }
    }
}
