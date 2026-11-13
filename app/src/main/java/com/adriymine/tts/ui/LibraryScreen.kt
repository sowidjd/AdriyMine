package com.adriymine.tts.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.LibraryMusic
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.adriymine.tts.data.LibraryItem
import com.adriymine.tts.service.Exporter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun LibraryScreen(vm: MainViewModel) {
    val items by vm.library.collectAsState()
    var pendingExport by remember { mutableStateOf<LibraryItem?>(null) }
    var toDelete by remember { mutableStateOf<LibraryItem?>(null) }
    var toRename by remember { mutableStateOf<LibraryItem?>(null) }

    val saveAs = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("audio/mpeg")) { uri ->
        val it = pendingExport
        if (uri != null && it != null) vm.exportTo(it, uri)
        pendingExport = null
    }

    if (items.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Filled.LibraryMusic, null, modifier = Modifier.size(56.dp), tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(12.dp))
                Text("Belum ada audio", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("Audio yang kamu buat akan muncul di sini dan otomatis tersimpan di folder Download/${Exporter.FOLDER}.",
                    style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    } else {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                Text("Pustaka Audio", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text("${items.size} audio • file MP3 bisa diputar di aplikasi musik mana pun",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            items(items, key = { it.id }) { item ->
                LibraryRow(item, vm,
                    onSaveAs = { pendingExport = item; runCatching { saveAs.launch(Exporter.safeName(item.title) + ".mp3") } },
                    onDelete = { toDelete = item }, onRename = { toRename = item })
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }

    toDelete?.let { item ->
        AlertDialog(
            onDismissRequest = { toDelete = null },
            title = { Text("Hapus audio?") },
            text = { Text("\"${item.title}\" akan dihapus dari pustaka aplikasi. Salinan di folder Download tidak ikut terhapus.") },
            confirmButton = { TextButton(onClick = { vm.delete(item); toDelete = null }) { Text("Hapus") } },
            dismissButton = { TextButton(onClick = { toDelete = null }) { Text("Batal") } },
        )
    }
    toRename?.let { item ->
        var name by remember(item.id) { mutableStateOf(item.title) }
        AlertDialog(
            onDismissRequest = { toRename = null },
            title = { Text("Ganti nama") },
            text = { OutlinedTextField(value = name, onValueChange = { name = it.take(80) }, singleLine = true) },
            confirmButton = { TextButton(onClick = { vm.rename(item, name); toRename = null }) { Text("Simpan") } },
            dismissButton = { TextButton(onClick = { toRename = null }) { Text("Batal") } },
        )
    }
}

fun formatDuration(sec: Long): String {
    val h = sec / 3600; val m = (sec % 3600) / 60; val s = sec % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%d:%02d".format(m, s)
}

private fun formatSize(b: Long): String = when {
    b > 1_000_000 -> "%.1f MB".format(b / 1_000_000.0)
    else -> "%d KB".format(b / 1000)
}

@Composable
private fun LibraryRow(item: LibraryItem, vm: MainViewModel, onSaveAs: () -> Unit, onDelete: () -> Unit, onRename: () -> Unit) {
    var menu by remember { mutableStateOf(false) }
    val date = remember(item.createdAt) { SimpleDateFormat("d MMM yyyy, HH:mm", Locale("id", "ID")).format(Date(item.createdAt)) }
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            FilledTonalIconButton(onClick = { vm.play(item) }, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Filled.PlayArrow, "Putar")
            }
            Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                Text(item.title, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text("${item.voiceName} • ${formatDuration(item.durationSec)} • ${formatSize(item.sizeBytes)}",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(date + (item.exportedTo?.let { " • $it" } ?: ""), style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            IconButton(onClick = { vm.share(item) }) { Icon(Icons.Filled.Share, "Bagikan") }
            Box {
                IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, "Lainnya") }
                DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                    DropdownMenuItem(text = { Text("Simpan ke Download") }, leadingIcon = { Icon(Icons.Filled.Download, null) },
                        onClick = { menu = false; vm.saveToDownloads(item) })
                    DropdownMenuItem(text = { Text("Simpan ke folder lain…") }, leadingIcon = { Icon(Icons.Filled.FolderOpen, null) },
                        onClick = { menu = false; onSaveAs() })
                    DropdownMenuItem(text = { Text("Ganti nama") }, leadingIcon = { Icon(Icons.Filled.Edit, null) },
                        onClick = { menu = false; onRename() })
                    DropdownMenuItem(text = { Text("Hapus") }, leadingIcon = { Icon(Icons.Filled.Delete, null) },
                        onClick = { menu = false; onDelete() })
                }
            }
        }
    }
}
