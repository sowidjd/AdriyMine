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
        rule.onAllNodesWithText("Suara")[0].performClick()
        rule.onNodeWithText("Pilih Suara").assertIsDisplayed()
        rule.onNode(hasScrollAction()).performScrollToNode(hasText("Ava"))
        rule.onNodeWithText("Ava").performClick()
        rule.onNode(hasScrollAction()).performScrollToNode(hasText("Tampilkan semua bahasa"))
        rule.onAllNodesWithText("Pustaka")[0].performClick()
        rule.onNodeWithText("Belum ada audio").assertIsDisplayed()
        rule.onAllNodesWithText("Atur")[0].performClick()
        rule.onNodeWithText("Pengaturan").assertIsDisplayed()
        rule.onNodeWithText("Ubah angka jadi kata").performClick()
        rule.onAllNodesWithText("Buat")[0].performClick()
        rule.onNodeWithText("Suara: Ava").assertIsDisplayed()
    }
}
