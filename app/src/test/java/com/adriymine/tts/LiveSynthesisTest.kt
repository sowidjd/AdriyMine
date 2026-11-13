package com.adriymine.tts

import com.adriymine.tts.tts.EdgeTtsClient
import com.adriymine.tts.tts.Mp3
import com.adriymine.tts.tts.Prosody
import com.adriymine.tts.tts.TextProcessor
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File

/**
 * Uji langsung ke server suara (butuh internet). Dijalankan hanya bila TTS_LIVE_OUT di-set:
 *   TTS_LIVE_OUT=/tmp/out TTS_LIVE_TEXT=teks.txt ./gradlew testDebugUnitTest --tests '*LiveSynthesisTest*'
 */
class LiveSynthesisTest {
    @Test
    fun synthesizeLongText() {
        val outDir = System.getenv("TTS_LIVE_OUT") ?: ""
        assumeTrue(outDir.isNotEmpty())
        val raw = File(System.getenv("TTS_LIVE_TEXT")!!).readText()
        val voices = (System.getenv("TTS_LIVE_VOICES") ?: "id-ID-GadisNeural").split(",")
        val client = EdgeTtsClient()
        for (voice in voices) {
            val multi = voice.contains("Multilingual")
            val prepared = TextProcessor.prepare(raw, TextProcessor.Options(spellLettersIndo = multi))
            val chunks = TextProcessor.chunk(prepared)
            println("voice=$voice words=${TextProcessor.countWords(raw)} chunks=${chunks.size}")
            val dir = File(outDir, voice).apply { mkdirs() }
            val sem = Semaphore(3)
            val t0 = System.currentTimeMillis()
            val parts = runBlocking {
                chunks.mapIndexed { i, c ->
                    async {
                        sem.withPermit {
                            val audio = client.synthesize(c.text, voice, Prosody()) { n, e -> println("retry $i #$n: ${e.message}") }
                            val f = File(dir, "%05d.mp3".format(i))
                            f.outputStream().use { o ->
                                o.write(audio)
                                if (c.endsParagraph && i < chunks.size - 1) Mp3.writeSilence(o, 450)
                            }
                            f
                        }
                    }
                }.awaitAll()
            }
            val dest = File(outDir, "$voice.mp3")
            Mp3.concat(parts, dest)
            println("done $voice in ${(System.currentTimeMillis() - t0) / 1000}s size=${dest.length()} dur=${Mp3.durationSec(dest.length())}s")
        }
    }
}
