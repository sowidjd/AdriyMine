package com.adriymine.tts.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
    val previewText by vm.previewText.collectAsState()
    val compareProgress by vm.compareProgress.collectAsState()
    val healthMap by vm.voiceHealth.collectAsState()
    androidx.compose.runtime.LaunchedEffect(Unit) { vm.checkVoices() }

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
        item { PreviewStudio(vm, previewText, previewing, compareProgress) }
        item { StyleCard(vm, s) }

        VoiceGroup.entries.filter { it != VoiceGroup.OTHER }.forEach { g ->
            item(key = "h_$g") { GroupHeader(g.title, g.subtitle) }
            items(VoiceCatalog.ranked.filter { it.group == g }, key = { it.id }) { v ->
                VoiceRow(v, selected = v.id == s.voiceId, loading = previewing == v.id,
                    onSelect = { vm.selectVoice(v.id) }, onPreview = { vm.previewVoice(v) }, available = healthMap[v.id])
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
private fun VoiceRow(v: Voice, selected: Boolean, loading: Boolean, onSelect: () -> Unit, onPreview: () -> Unit, available: Boolean? = null) {
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
                    if (v.score >= 4.15) {
                        Spacer(Modifier.width(6.dp))
                        Text("TERBAIK", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold,
                            color = androidx.compose.ui.graphics.Color.White,
                            modifier = Modifier
                                .background(androidx.compose.ui.graphics.Color(0xFF10B981), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 1.dp))
                    }
                }
                if (v.description.isNotBlank()) Text(v.description, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (v.score > 0) ScoreBar(v.score)
                if (available == false) Text("⚠ Sedang tidak tersedia di server (sementara). Aplikasi otomatis memakai suara pengganti yang mirip.",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 2.dp))
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
private fun ScoreBar(score: Double) {
    val frac = ((score - 3.0) / 1.5).coerceIn(0.08, 1.0).toFloat()
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
        Text("Kealamian", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.width(6.dp))
        androidx.compose.material3.LinearProgressIndicator(
            progress = { frac }, modifier = Modifier.width(80.dp).height(6.dp),
            color = if (score >= 4.0) androidx.compose.ui.graphics.Color(0xFF10B981) else MaterialTheme.colorScheme.primary,
        )
        Spacer(Modifier.width(6.dp))
        Text("%.1f/5".format(score).replace('.', ','), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold)
    }
}

private val previewSamples = listOf(
    "Cerita" to "Malam itu, angin berembus pelan dari arah laut. Rina duduk sendirian di beranda, memandangi bintang. \"Aku pasti bisa,\" bisiknya sambil tersenyum.",
    "Berita" to "Jakarta, 13 November 2026. Pemerintah mengumumkan program beasiswa baru untuk 25.000 mahasiswa di seluruh Indonesia.",
    "Dialog" to "\"Kamu sudah makan?\" tanya Ibu. \"Belum, Bu. Nanti saja,\" jawab Budi. \"Ayo makan dulu, nanti keburu dingin!\"",
    "Huruf & angka" to "Vokal: A, I, U, E, O. Abjad: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z. Harganya Rp 150.000.",
)

@Composable
private fun PreviewStudio(vm: MainViewModel, text: String, previewing: String?, progress: String?) {
    val s by vm.settings.collectAsState()
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Studio Pratinjau", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSecondaryContainer)
            Text("Tulis kalimat apa saja lalu dengarkan dengan suara mana pun. Hasil pratinjau diproses persis seperti audio akhir.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
            OutlinedTextField(
                value = text, onValueChange = { vm.previewText.value = it.take(600) },
                modifier = Modifier.fillMaxWidth(), minLines = 2, maxLines = 5, shape = RoundedCornerShape(12.dp),
                label = { Text("Kalimat pratinjau") }
            )
            androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(previewSamples) { (label, t) ->
                    androidx.compose.material3.AssistChip(onClick = { vm.previewText.value = t }, label = { Text(label) })
                }
            }
            val current = vm.voiceOf(s.voiceId)
            androidx.compose.material3.Button(
                onClick = { vm.previewVoice(current, text) }, enabled = previewing == null,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (previewing == current.id) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Icon(Icons.Filled.PlayCircle, null)
                Spacer(Modifier.width(8.dp)); Text("Dengar dengan suara terpilih (${current.name})")
            }
            Text("Bandingkan berurutan dengan kalimat yang sama:", style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSecondaryContainer)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { vm.compareVoices(VoiceCatalog.ranked.filter { it.recommended }.sortedByDescending { it.score }.take(4), text) },
                    enabled = previewing == null, modifier = Modifier.weight(1f)
                ) { Text("4 Terbaik", maxLines = 1) }
                OutlinedButton(
                    onClick = { vm.compareVoices(VoiceCatalog.ranked.filter { it.group == VoiceGroup.INDONESIA || it.group == VoiceGroup.MULTI }, text) },
                    enabled = previewing == null, modifier = Modifier.weight(1f)
                ) { Text("Semua suara", maxLines = 1) }
            }
            progress?.let {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                    Text(it + " — diputar berurutan", style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}

@Composable
private fun StyleCard(vm: MainViewModel, s: com.adriymine.tts.data.Settings) {
    val rate = s.rate; val pitch = s.pitch; val volume = s.volume
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Gaya bicara", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                TextButton(onClick = { vm.updateSettings { it.copy(rate = 0, pitch = 0, volume = 0) } }) { Text("Reset") }
            }
            LabeledSlider("Kecepatan", rate, -50f..100f, 29, "%") { v -> vm.updateSettings { it.copy(rate = v) } }
            LabeledSlider("Nada suara", pitch, -30f..30f, 29, " Hz") { v -> vm.updateSettings { it.copy(pitch = v) } }
            LabeledSlider("Volume", volume, -50f..50f, 19, "%") { v -> vm.updateSettings { it.copy(volume = v) } }
            LabeledSlider("Jeda setelah titik", s.sentencePauseMs, 300f..1200f, 17, " ms") { v -> vm.updateSettings { it.copy(sentencePauseMs = v) } }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Setelan optimal per suara", style = MaterialTheme.typography.bodyMedium)
                    Text("Kecepatan & nada terbaik hasil uji otomatis tiap suara", style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                androidx.compose.material3.Switch(checked = s.autoTune, onCheckedChange = { c -> vm.updateSettings { it.copy(autoTune = c) } })
            }
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
            Text((if (v > 0 && (unit == "%" || unit == " Hz")) "+$v" else "$v") + unit, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        }
        val step = (range.endInclusive - range.start) / (steps + 1)
        Slider(
            value = local,
            onValueChange = { local = (range.start + Math.round((it - range.start) / step) * step).coerceIn(range) },
            valueRange = range,
            onValueChangeFinished = { onChange(local.roundToInt()) }
        )
    }
}
