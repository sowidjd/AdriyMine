package com.adriymine.tts.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Slider
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
import androidx.compose.ui.unit.dp
import com.adriymine.tts.tts.Gender
import com.adriymine.tts.tts.Voice
import com.adriymine.tts.tts.VoiceCatalog
import com.adriymine.tts.tts.VoiceGroup
import kotlin.math.roundToInt

@Composable
fun VoicesScreen(vm: MainViewModel) {
    val s by vm.settings.collectAsState()
    val previewing by vm.previewing.collectAsState()
    val all by vm.allVoices.collectAsState()
    val loading by vm.voicesLoading.collectAsState()
    var query by remember { mutableStateOf("") }
    var showAll by remember { mutableStateOf(false) }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Text("Pilih Suara", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("Ketuk ▶ untuk mendengar contoh. Semua suara adalah suara neural AI (bukan suara robot).",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { StyleCard(vm, s.rate, s.pitch, s.volume) }

        VoiceGroup.entries.filter { it != VoiceGroup.OTHER }.forEach { g ->
            item(key = "h_$g") { GroupHeader(g.title, g.subtitle) }
            items(VoiceCatalog.curated.filter { it.group == g }, key = { it.id }) { v ->
                VoiceRow(v, selected = v.id == s.voiceId, loading = previewing == v.id,
                    onSelect = { vm.selectVoice(v.id) }, onPreview = { vm.previewVoice(v) })
            }
        }

        item(key = "other") {
            GroupHeader(VoiceGroup.OTHER.title, "300+ suara dari puluhan bahasa (Inggris, Arab, Jepang, dll)")
            if (!showAll) {
                OutlinedButton(onClick = { showAll = true; vm.loadAllVoices() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Tampilkan semua bahasa")
                }
            } else {
                OutlinedTextField(
                    value = query, onValueChange = { query = it }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, leadingIcon = { Icon(Icons.Filled.Search, null) },
                    placeholder = { Text("Cari: en-US, ja-JP, Arab, …") }, shape = RoundedCornerShape(14.dp)
                )
                if (loading) Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(10.dp)); Text("Memuat daftar suara…")
                }
            }
        }
        if (showAll) {
            val q = query.trim().lowercase()
            val list = all.filter { q.isEmpty() || it.id.lowercase().contains(q) || it.name.lowercase().contains(q) }.take(400)
            items(list, key = { "all_" + it.id }) { v ->
                VoiceRow(v, selected = v.id == s.voiceId, loading = previewing == v.id,
                    onSelect = { vm.selectVoice(v.id) }, onPreview = { vm.previewVoice(v) })
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun GroupHeader(title: String, sub: String) {
    Column(Modifier.padding(top = 10.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary)
        Text(sub, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun VoiceRow(v: Voice, selected: Boolean, loading: Boolean, onSelect: () -> Unit, onPreview: () -> Unit) {
    Card(
        onClick = onSelect,
        shape = RoundedCornerShape(16.dp),
        border = if (selected) BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainer
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(Modifier.padding(start = 12.dp, top = 10.dp, bottom = 10.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar(v.name, v.gender, selected)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(v.name, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.width(6.dp))
                    Text(if (v.gender == Gender.FEMALE) "• Wanita" else "• Pria", style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (v.recommended) {
                        Spacer(Modifier.width(6.dp))
                        Icon(Icons.Filled.Star, "Rekomendasi", tint = androidx.compose.ui.graphics.Color(0xFFF59E0B), modifier = Modifier.size(16.dp))
                    }
                }
                if (v.description.isNotBlank()) Text(v.description, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IconButton(onClick = onPreview) {
                if (loading) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp)
                else Icon(Icons.Filled.PlayCircle, "Dengar contoh", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp))
            }
            RadioButton(selected = selected, onClick = onSelect)
        }
    }
}

@Composable
private fun StyleCard(vm: MainViewModel, rate: Int, pitch: Int, volume: Int) {
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Gaya bicara", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                TextButton(onClick = { vm.updateSettings { it.copy(rate = 0, pitch = 0, volume = 0) } }) { Text("Reset") }
            }
            LabeledSlider("Kecepatan", rate, -50f..100f, 29, "%") { v -> vm.updateSettings { it.copy(rate = v) } }
            LabeledSlider("Nada suara", pitch, -30f..30f, 29, " Hz") { v -> vm.updateSettings { it.copy(pitch = v) } }
            LabeledSlider("Volume", volume, -50f..50f, 19, "%") { v -> vm.updateSettings { it.copy(volume = v) } }
            Text("Saran: biarkan 0 untuk hasil paling natural. Kecepatan -10% enak untuk audiobook.",
                style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun LabeledSlider(label: String, value: Int, range: ClosedFloatingPointRange<Float>, steps: Int, unit: String, onChange: (Int) -> Unit) {
    var local by remember(value) { mutableStateOf(value.toFloat()) }
    Column {
        Row {
            Text(label, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            val v = local.roundToInt()
            Text((if (v > 0) "+$v" else "$v") + unit, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        }
        Slider(
            value = local, onValueChange = { local = it }, valueRange = range, steps = steps,
            onValueChangeFinished = { onChange(local.roundToInt()) }
        )
    }
}
