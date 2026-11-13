package com.adriymine.tts.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

private val speeds = listOf(0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f)

@Composable
fun MiniPlayer(vm: MainViewModel, p: PlayerUi) {
    var dragging by remember { mutableStateOf<Float?>(null) }
    Column(
        Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceContainerHigh)
            .padding(start = 12.dp, end = 4.dp, top = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(p.title.ifBlank { "Audio" }, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.bodyMedium)
                Text(
                    "${formatDuration(p.positionMs / 1000)} / ${formatDuration(p.durationMs / 1000)}" +
                        if (p.subtitle.isNotBlank()) " • ${p.subtitle}" else "",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1
                )
            }
            TextButton(onClick = {
                val i = speeds.indexOf(p.speed).let { if (it < 0) 1 else it }
                vm.setSpeed(speeds[(i + 1) % speeds.size])
            }) { Text("${p.speed}x".replace(".0x", "x")) }
            IconButton(onClick = { vm.skip(-10_000) }) { Icon(Icons.Filled.Replay10, "Mundur 10 detik") }
            FilledIconButton(onClick = { vm.togglePlay() }, modifier = Modifier.size(44.dp)) {
                if (p.buffering) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                else Icon(if (p.playing) Icons.Filled.Pause else Icons.Filled.PlayArrow, if (p.playing) "Jeda" else "Putar")
            }
            IconButton(onClick = { vm.skip(10_000) }) { Icon(Icons.Filled.Forward10, "Maju 10 detik") }
            IconButton(onClick = { vm.stopPlayer() }) { Icon(Icons.Filled.Close, "Tutup pemutar") }
        }
        val frac = if (p.durationMs > 0) (p.positionMs.toFloat() / p.durationMs).coerceIn(0f, 1f) else 0f
        Slider(
            value = dragging ?: frac,
            onValueChange = { dragging = it },
            onValueChangeFinished = { dragging?.let { vm.seekTo(it) }; dragging = null },
            modifier = Modifier.fillMaxWidth().height(28.dp).padding(end = 8.dp)
        )
    }
}
