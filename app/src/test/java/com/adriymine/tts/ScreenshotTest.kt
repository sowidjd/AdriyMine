package com.adriymine.tts

import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.test.core.app.ApplicationProvider
import com.adriymine.tts.data.LibraryItem
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Tangkapan layar untuk dokumentasi. Jalankan dengan SHOTS_OUT=/folder. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w393dp-h852dp-xhdpi")
class ScreenshotTest {
    @get:Rule
    val rule = createAndroidComposeRule<MainActivity>()

    @Test
    fun shots() {
        val out = System.getenv("SHOTS_OUT") ?: ""
        assumeTrue(out.isNotEmpty())
        val app = ApplicationProvider.getApplicationContext<App>()
        rule.runOnUiThread {
            rule.activity.let { a ->
                val vm = androidx.lifecycle.ViewModelProvider(a)[com.adriymine.tts.ui.MainViewModel::class.java]
                vm.setTitle("Cerita Pagi di Desa")
                vm.updateSettings { it.copy(voxUrl = "http://192.168.1.10:8808") }
                vm.setText(File(System.getenv("SHOTS_TEXT")!!).readText())
            }
            val lib = app.library
            listOf(
                Triple("Cerita Pagi di Desa", "Ava", 85L), Triple("Materi Sejarah Bab 3", "Andrew", 2814L),
                Triple("Novel: Langit Senja (5.838 kata)", "Ardi", 2779L), Triple("Berita Pagi", "Gadis", 102L),
            ).forEachIndexed { i, (t, v, d) ->
                val f = lib.audioFile("demo$i"); f.writeBytes(ByteArray((d * 12000).toInt().coerceAtMost(200_000)))
                lib.save(LibraryItem("demo$i", t, "x", v, System.currentTimeMillis() - i * 3_600_000L, d, (d * 2).toInt(), t, f,
                    if (i % 2 == 0) "Download/AdriyTTS/$t.mp3" else null))
            }
        }
        rule.waitForIdle()
        rule.onRoot().captureRoboImage("$out/1_buat.png")
        rule.onAllNodesWithText("Pustaka")[0].performClick(); rule.waitForIdle()
        rule.onRoot().captureRoboImage("$out/2_pustaka.png")
        rule.onAllNodesWithText("Atur")[0].performClick(); rule.waitForIdle()
        rule.onRoot().captureRoboImage("$out/3_pengaturan.png")
        rule.onAllNodes(androidx.compose.ui.test.hasScrollAction())[0].performScrollToNode(hasText("Simpan & tes koneksi"))
        rule.waitForIdle()
        rule.onRoot().captureRoboImage("$out/4_voxcpm.png")
    }
}
