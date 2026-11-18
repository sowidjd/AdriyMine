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
    var showAdvanced by remember { mutableStateOf(false) }
    var chromium by remember(s.chromiumVersion) { mutableStateOf(s.chromiumVersion) }
    val crash = remember { File(ctx.filesDir, "crash.txt").takeIf { it.exists() }?.let { runCatching { it.readText() }.getOrNull() } }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Pengaturan", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)

        Section("Semua sudah otomatis") {
            Text(
                "Kecepatan, nada, intonasi, dan jeda titik/koma/paragraf diatur sendiri oleh aplikasi " +
                    "sesuai gaya suara yang kamu pilih. Angka, tanggal, singkatan, dan huruf A sampai Z " +
                    "dibaca dengan ejaan dan logat bahasa Indonesia.",
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Section("Kebiasaan") {
            Toggle("Dengar sambil diproses", "Audio mulai diputar setelah bagian pertama jadi", s.playWhileGenerating) {
                v -> vm.updateSettings { it.copy(playWhileGenerating = v) }
            }
            Toggle("Simpan otomatis ke folder Download", "File MP3 tersimpan di Download/AdriyTTS", s.autoSaveToDownloads) {
                v -> vm.updateSettings { it.copy(autoSaveToDownloads = v) }
            }
        }

        Section("Suara VoxCPM2 (opsional)") {
            val voxStatus by vm.voxStatus.collectAsState()
            var url by remember(s.voxUrl) { mutableStateOf(s.voxUrl) }
            var token by remember(s.voxToken) { mutableStateOf(s.voxToken) }
            var hf by remember(s.hfToken) { mutableStateOf(s.hfToken) }
            Text(
                "VoxCPM2 adalah model suara 2 miliar parameter. Model ini terlalu besar untuk HP, jadi dijalankan " +
                    "di komputer kamu (sebaiknya dengan kartu grafis NVIDIA) memakai program server AdriyTTS. " +
                    "Isi alamatnya di sini, lalu pilih suara \"VoxCPM2\" di layar Buat. " +
                    "Bila server mati, aplikasi otomatis memakai Gadis/Ardi agar audio tetap jadi.",
                style = MaterialTheme.typography.bodySmall
            )
            OutlinedTextField(value = url, onValueChange = { url = it.trim() }, singleLine = true,
                label = { Text("Alamat server, mis. http://192.168.1.10:8808") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = token, onValueChange = { token = it.trim() }, singleLine = true,
                label = { Text("Kata sandi (token), bila ada") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = hf, onValueChange = { hf = it.trim() }, singleLine = true,
                label = { Text("Kunci Hugging Face (hf_…), bila server di Hugging Face") },
                visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth())
            Row {
                TextButton(onClick = {
                    vm.updateSettings { it.copy(voxUrl = url, voxToken = token, hfToken = hf) }
                    vm.testVox()
                }) { Text("Simpan & tes koneksi") }
                if (s.voxUrl.isNotBlank()) TextButton(onClick = {
                    url = ""; token = ""; hf = ""
                    vm.updateSettings { it.copy(voxUrl = "", voxToken = "", hfToken = "", voiceId = if (it.voiceId.startsWith("vox-")) "gadis-natural" else it.voiceId) }
                }) { Text("Matikan") }
            }
            voxStatus?.let { Text(it, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold) }
        }

        Section("Bila ada masalah") {
            Text(
                "• Proses terhenti karena internet putus? Tidak apa-apa: aplikasi mencoba lagi sendiri, dan bagian yang sudah jadi tidak hilang.\n" +
                    "• Butuh internet saat membuat audio. Audio yang sudah jadi bisa diputar tanpa internet.",
                style = MaterialTheme.typography.bodySmall
            )
            TextButton(onClick = { showAdvanced = !showAdvanced }) { Text(if (showAdvanced) "Sembunyikan lanjutan" else "Pengaturan lanjutan") }
            if (showAdvanced) {
                Text("Versi Chromium (ubah hanya jika semua suara gagal dengan pesan \"Server menolak (403)\")",
                    style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(value = chromium, onValueChange = { chromium = it.trim() }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Row {
                    TextButton(onClick = { vm.updateSettings { it.copy(chromiumVersion = chromium.ifBlank { EdgeConfig.DEFAULT_CHROMIUM_FULL_VERSION }) }; vm.toast("Disimpan") }) { Text("Simpan") }
                    TextButton(onClick = { vm.updateSettings { it.copy(chromiumVersion = EdgeConfig.DEFAULT_CHROMIUM_FULL_VERSION) } }) { Text("Kembalikan default") }
                }
                if (crash != null) TextButton(onClick = { showCrash = true }) { Text("Lihat laporan error terakhir") }
            }
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
