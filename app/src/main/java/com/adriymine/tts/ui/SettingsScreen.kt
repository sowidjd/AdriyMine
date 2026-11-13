package com.adriymine.tts.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.adriymine.tts.BuildConfig
import com.adriymine.tts.tts.EdgeConfig
import java.io.File

@Composable
fun SettingsScreen(vm: MainViewModel) {
    val s by vm.settings.collectAsState()
    val ctx = LocalContext.current
    var showCrash by remember { mutableStateOf(false) }
    var chromium by remember(s.chromiumVersion) { mutableStateOf(s.chromiumVersion) }
    val crash = remember { File(ctx.filesDir, "crash.txt").takeIf { it.exists() }?.let { runCatching { it.readText() }.getOrNull() } }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Pengaturan", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)

        Section("Pengucapan bahasa Indonesia") {
            Toggle("Ubah angka jadi kata", "25.000 → dua puluh lima ribu, 45% → empat puluh lima persen, 13/11/2026 → tanggal", s.numbersToWords) {
                v -> vm.updateSettings { it.copy(numbersToWords = v) }
            }
            Toggle("Perluas singkatan", "yg → yang, dgn → dengan, dll → dan lain-lain, Jl. → Jalan", s.expandAbbreviations) {
                v -> vm.updateSettings { it.copy(expandAbbreviations = v) }
            }
            Toggle("Eja huruf ala Indonesia (suara multibahasa)", "A, B, C → a, be, ce • KTP → ka te pe. Mencegah ejaan gaya Inggris.", s.spellLettersMultilingual) {
                v -> vm.updateSettings { it.copy(spellLettersMultilingual = v) }
            }
            LabeledSlider("Jeda setelah titik", s.sentencePauseMs, 300f..1200f, 17, " ms") { v ->
                vm.updateSettings { it.copy(sentencePauseMs = v) }
            }
            LabeledSlider("Tambahan jeda paragraf", s.paragraphPauseMs, 0f..1500f, 14, " ms") { v ->
                vm.updateSettings { it.copy(paragraphPauseMs = v) }
            }
            Toggle("Setelan optimal per suara", "Kecepatan & nada terbaik hasil uji kealamian tiap suara", s.autoTune) {
                v -> vm.updateSettings { it.copy(autoTune = v) }
            }
        }

        Section("Proses & penyimpanan") {
            Toggle("Dengar sambil diproses", "Audio mulai diputar setelah bagian pertama jadi", s.playWhileGenerating) {
                v -> vm.updateSettings { it.copy(playWhileGenerating = v) }
            }
            Toggle("Simpan otomatis ke Download/AdriyTTS", "File MP3 langsung tersimpan di perangkat", s.autoSaveToDownloads) {
                v -> vm.updateSettings { it.copy(autoSaveToDownloads = v) }
            }
            LabeledSlider("Proses paralel", s.concurrency, 1f..5f, 3, "") { v -> vm.updateSettings { it.copy(concurrency = v) } }
            Text("Lebih tinggi = lebih cepat untuk teks panjang. Turunkan ke 1–2 bila internet lambat.",
                style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        Section("Cara kerja") {
            Text(
                "AdriyTTS memakai mesin suara neural Microsoft (teknologi yang sama dengan fitur \"Baca Nyaring\" di browser Edge) " +
                    "yang gratis dan tanpa batas pemakaian. Audio MP3 96 kbps (jernih, tanpa noise kompresi). Teks panjang dipecah per paragraf, " +
                    "diproses paralel, lalu digabung. Jeda setelah titik dan paragraf disisipkan presisi di posisi kata (dari metadata server) " +
                    "tanpa merusak audio, dan hening berlebih di sambungan dipangkas, sehingga ritme baca terdengar seperti narator manusia.\n\n" +
                    "Butuh koneksi internet saat membuat audio. Audio yang sudah jadi bisa diputar offline.",
                style = MaterialTheme.typography.bodySmall
            )
        }

        Section("Lanjutan") {
            Text("Versi Chromium (ubah hanya jika semua suara tiba-tiba gagal dengan pesan \"Server menolak (403)\")",
                style = MaterialTheme.typography.bodySmall)
            OutlinedTextField(value = chromium, onValueChange = { chromium = it.trim() }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row {
                TextButton(onClick = { vm.updateSettings { it.copy(chromiumVersion = chromium.ifBlank { EdgeConfig.DEFAULT_CHROMIUM_FULL_VERSION }) }; vm.toast("Disimpan") }) { Text("Simpan") }
                TextButton(onClick = { vm.updateSettings { it.copy(chromiumVersion = EdgeConfig.DEFAULT_CHROMIUM_FULL_VERSION) } }) { Text("Kembalikan default") }
            }
            if (crash != null) TextButton(onClick = { showCrash = true }) { Text("Lihat laporan error terakhir") }
            Text("Versi aplikasi ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(24.dp))
    }

    if (showCrash && crash != null) {
        AlertDialog(
            onDismissRequest = { showCrash = false },
            title = { Text("Laporan error") },
            text = { Text(crash.take(3000), style = MaterialTheme.typography.labelSmall, modifier = Modifier.verticalScroll(rememberScrollState())) },
            confirmButton = {
                TextButton(onClick = { runCatching { File(ctx.filesDir, "crash.txt").delete() }; showCrash = false }) { Text("Hapus") }
            },
            dismissButton = { TextButton(onClick = { showCrash = false }) { Text("Tutup") } },
        )
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            content()
        }
    }
}

@Composable
private fun Toggle(title: String, sub: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f).padding(end = 8.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            Text(sub, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked = checked, onCheckedChange = onChange)
    }
}
