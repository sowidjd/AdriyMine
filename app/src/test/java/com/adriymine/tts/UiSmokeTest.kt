package com.adriymine.tts

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performScrollToNode
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
class UiSmokeTest {
    @get:Rule
    val rule = createAndroidComposeRule<MainActivity>()

    @Test
    fun allTabsRenderWithoutCrash() {
        rule.onNodeWithText("Buat Audio").assertIsDisplayed()
        rule.onNodeWithText("Buat Audio").performClick() // teks kosong -> hanya toast
        rule.onNodeWithText("Coba dengar").performClick()
        rule.onNodeWithText("Pilih suara").assertIsDisplayed()
        rule.onAllNodes(hasScrollAction())[0].performScrollToNode(hasText("Berita"))
        rule.onNodeWithText("Berita").performClick()
        rule.onAllNodesWithText("Pustaka")[0].performClick()
        rule.onNodeWithText("Belum ada audio").assertIsDisplayed()
        rule.onAllNodesWithText("Atur")[0].performClick()
        rule.onNodeWithText("Semua sudah otomatis").assertIsDisplayed()
        rule.onNodeWithText("Pengaturan lanjutan").performClick()
        rule.onAllNodesWithText("Buat")[0].performClick()
        rule.onNodeWithText("Buat Audio").assertIsDisplayed()
    }
}
