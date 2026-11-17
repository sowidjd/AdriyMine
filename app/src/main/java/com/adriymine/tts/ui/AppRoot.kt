package com.adriymine.tts.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.LibraryMusic
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector

private data class Tab(val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab("Buat", Icons.Outlined.EditNote),
    Tab("Pustaka", Icons.Outlined.LibraryMusic),
    Tab("Atur", Icons.Outlined.Settings),
)

@Composable
fun AppRoot(vm: MainViewModel) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    val player by vm.player.collectAsState()
    BackHandler(enabled = tab != 0) { tab = 0 }

    Scaffold(
        bottomBar = {
            Column {
                if (player.hasMedia) MiniPlayer(vm, player)
                NavigationBar {
                    tabs.forEachIndexed { i, t ->
                        NavigationBarItem(
                            selected = tab == i,
                            onClick = { tab = i },
                            icon = { Icon(t.icon, contentDescription = t.label) },
                            label = { Text(t.label) },
                        )
                    }
                }
            }
        }
    ) { pad ->
        Box(Modifier.fillMaxSize().padding(pad)) {
            when (tab) {
                0 -> CreateScreen(vm, openVoices = {}, openLibrary = { tab = 1 })
                1 -> LibraryScreen(vm)
                else -> SettingsScreen(vm)
            }
        }
    }
}
