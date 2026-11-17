package com.adriymine.tts

import com.adriymine.tts.tts.Mp3
import com.adriymine.tts.tts.TextProcessor
import com.adriymine.tts.tts.VoiceCatalog
import com.adriymine.tts.tts.VoxClient
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File

/** Uji ujung-ke-ujung ke server VoxCPM2 (server/voxcpm_server.py). Jalan bila VOX_URL di-set. */
class VoxLiveTest {
    @Test
    fun synthesizeThroughServer() {
        val url = System.getenv("VOX_URL") ?: ""
        assumeTrue(url.isNotEmpty())
        val token = System.getenv("VOX_TOKEN") ?: ""
        val out = File(System.getenv("VOX_OUT")!!)
        val raw = File(System.getenv("VOX_TEXT")!!).readText()
        val client = VoxClient()
        runBlocking {
            val h = client.health(url, token)
            println("health: ${h.ok} ${h.message}")
            assertTrue(h.ok)
            assertTrue(!client.health(url, "salah").ok)
            for (id in (System.getenv("VOX_VOICES") ?: "vox-wanita,vox-pria").split(",")) {
                val v = VoiceCatalog.find(id)
                val prepared = TextProcessor.prepare(raw, TextProcessor.Options(spellLettersIndo = true))
                val chunks = TextProcessor.chunk(prepared, maxChars = 320, mergeLimit = 320, ramp = listOf(140, 220, 320))
                val t0 = System.currentTimeMillis()
                val parts = chunks.mapIndexed { i, c ->
                    val a = client.synthesize(url, token, c.text, v.voxVoice)
                    val p = Mp3.polish(a, emptyList(), c.text, Mp3.PauseSpec(),
                        if (c.endsParagraph) Mp3.Boundary.PARAGRAPH else Mp3.Boundary.SENTENCE, i == chunks.lastIndex)
                    File(out, "$id-%02d.mp3".format(i)).also { it.writeBytes(p) }
                }
                val dest = File(out, "$id.mp3")
                Mp3.concat(parts, dest)
                println("done $id chunks=${chunks.size} in ${(System.currentTimeMillis() - t0) / 1000}s dur=${Mp3.durationSec(dest.length())}s")
            }
        }
    }
}
