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
            val prepared = TextProcessor.prepare(raw, TextProcessor.Options(spellLettersIndo = multi, mergeShortSentences = multi))
            val chunks = if (multi) TextProcessor.chunk(prepared, maxChars = 480, mergeLimit = 480, ramp = listOf(170, 240, 360)) else TextProcessor.chunk(prepared, maxChars = 1500, mergeLimit = 900, ramp = listOf(260, 500, 900))
            println("voice=$voice words=${TextProcessor.countWords(raw)} chunks=${chunks.size}")
            val dir = File(outDir, voice).apply { mkdirs() }
            val sem = Semaphore(4)
            val t0 = System.currentTimeMillis()
            val parts = runBlocking {
                chunks.mapIndexed { i, c ->
                    async {
                        sem.withPermit {
                            val r = client.synthesize(c.text, voice, com.adriymine.tts.tts.VoiceCatalog.find(voice).let { Prosody(it.tuneRate, it.tunePitch) }) { n, e -> println("retry $i #$n: ${e.message}") }
                            val raw0 = File(dir, "raw_%05d.mp3".format(i)); raw0.writeBytes(r.audio)
                            File(dir, "raw_%05d.txt".format(i)).writeText(c.text)
                            File(dir, "raw_%05d.words".format(i)).writeText(r.words.joinToString("\n") { "${it.offset}\t${it.duration}\t${it.text}" })
                            if (r.words.isEmpty()) println("chunk $i: no word metadata")
                            val polished = Mp3.polish(r.audio, r.words, c.text, Mp3.PauseSpec(speed = 1.0 + com.adriymine.tts.tts.VoiceCatalog.find(voice).tuneRate / 100.0),
                                if (c.endsParagraph) Mp3.Boundary.PARAGRAPH else Mp3.Boundary.SENTENCE, i == chunks.size - 1)
                            val f = File(dir, "%05d.mp3".format(i))
                            f.writeBytes(polished)
                            println("READY $i t=${System.currentTimeMillis() - t0} dur=${polished.size * 8 / 96}")
                            f
                        }
                    }
                }.awaitAll()
            }
            val dest = File(outDir, "$voice.mp3")
            File(outDir, "$voice.chunks.txt").writeText(chunks.joinToString("\n----\n") { "[${it.endsParagraph}] ${it.text}" })
            Mp3.concat(parts, dest)
            println("done $voice in ${(System.currentTimeMillis() - t0) / 1000}s size=${dest.length()} dur=${Mp3.durationSec(dest.length())}s")
        }
    }
}
