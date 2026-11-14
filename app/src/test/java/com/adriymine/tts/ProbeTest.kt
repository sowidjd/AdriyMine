package com.adriymine.tts

import com.adriymine.tts.tts.TextProcessor
import org.junit.Assume.assumeTrue
import org.junit.Test

class ProbeTest {
    @Test
    fun probe() {
        val f = System.getenv("PROBE_IN") ?: ""
        assumeTrue(f.isNotEmpty())
        java.io.File(f).readLines().filter { it.isNotBlank() }.forEach { line ->
            val a = TextProcessor.prepare(line, TextProcessor.Options())
            val b = TextProcessor.prepare(line, TextProcessor.Options(spellLettersIndo = true, mergeShortSentences = true))
            println("IN : $line\nNAT: $a\nMUL: $b\n")
        }
    }
}
