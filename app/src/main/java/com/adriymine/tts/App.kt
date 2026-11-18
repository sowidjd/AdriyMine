package com.adriymine.tts

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import com.adriymine.tts.data.Library
import com.adriymine.tts.data.Prefs
import com.adriymine.tts.service.SynthesisEngine
import com.adriymine.tts.service.SynthesisService
import java.io.File

class App : Application() {
    lateinit var prefs: Prefs
        private set
    lateinit var library: Library
        private set
    lateinit var engine: SynthesisEngine
        private set

    override fun onCreate() {
        super.onCreate()
        installCrashLogger()
        prefs = Prefs(this)
        library = Library(this)
        engine = SynthesisEngine(this, library)
        engine.voxConfig = { prefs.state.value.let { it.voxUrl to it.voxToken } }
        engine.hfToken = { prefs.state.value.hfToken }
        if (Build.VERSION.SDK_INT >= 26) {
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(
                NotificationChannel(SynthesisService.CHANNEL, "Proses konversi", NotificationManager.IMPORTANCE_LOW)
            )
        }
    }

    /** Catat crash ke file agar bisa dilihat di Pengaturan (membantu perbaikan). */
    private fun installCrashLogger() {
        val prev = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            runCatching {
                File(filesDir, "crash.txt").writeText(
                    "${java.util.Date()}\n${Build.MANUFACTURER} ${Build.MODEL} SDK ${Build.VERSION.SDK_INT}\n" +
                        Log.getStackTraceString(e)
                )
            }
            prev?.uncaughtException(t, e)
        }
    }

    companion object {
        fun get(c: Context): App = c.applicationContext as App
    }
}
