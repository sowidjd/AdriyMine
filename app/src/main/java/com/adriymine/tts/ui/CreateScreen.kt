package com.adriymine.tts.ui

import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color as AColor
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.widget.EditText
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.FileOpen
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.adriymine.tts.service.JobState
import com.adriymine.tts.service.JobStatus
import com.adriymine.tts.tts.TextProcessor

@Composable
fun CreateScreen(vm: MainViewModel, openVoices: () -> Unit, openLibrary: () -> Unit) {
    val text by vm.text.collectAsState()
    val title by vm.title.collectAsState()
    val settings by vm.settings.collectAsState()
    val job by vm.job.collectAsState()
    val ctx = androidx.compose.ui.platform.LocalContext.current
    var confirmClear by remember { mutableStateOf(false) }

    val openFile = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) vm.importText(uri)
    }

    val words = remember(text) { TextProcessor.countWords(text) }
    val voice = vm.voiceOf(settings.voiceId)
    val minutes = remember(words, voice.id) {
        val wpm = 150.0 * (1 + voice.tuneRate / 100.0)
        if (words == 0) 0 else maxOf(1, (words / wpm).toInt())
    }

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) { Icon(Icons.Filled.AutoAwesome, null, tint = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(20.dp)) }
            Spacer(Modifier.width(10.dp))
            Column {
                Text("AdriyTTS", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Suara bahasa Indonesia • gratis • semua otomatis", style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = title, onValueChange = { vm.setTitle(it.take(80)) },
            modifier = Modifier.fillMaxWidth(), singleLine = true,
            label = { Text("Judul audio (opsional)") },
            shape = RoundedCornerShape(14.dp),
        )
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ToolChip(Icons.Filled.ContentPaste, "Tempel") {
                val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                val clip = cm?.primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.coerceToText(ctx)?.toString()
                if (clip.isNullOrBlank()) vm.toast("Papan klip kosong")
                else vm.setText(if (text.isBlank()) clip else text.trimEnd() + "\n\n" + clip)
            }
            ToolChip(Icons.Filled.FileOpen, "Buka .txt") {
                runCatching { openFile.launch(arrayOf("text/*")) }
            }
            ToolChip(Icons.Filled.DeleteSweep, "Hapus") { if (text.isNotEmpty()) confirmClear = true }
        }
        Spacer(Modifier.height(8.dp))
        TextEditor(
            text = text, onChange = vm::setText,
            modifier = Modifier.fillMaxWidth().weight(1f)
        )
        Text(
            "%,d kata • %,d karakter • ± %d menit audio".format(words, text.length, minutes).replace(',', '.'),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 6.dp, bottom = 8.dp)
        )
        // Pilihan gaya bicara (suara asli Indonesia); semua pengaturan lain otomatis.
        StylePicker(vm, settings.voiceId, serverReady = settings.voxUrl.isNotBlank(), openSettings = openVoices)
        Spacer(Modifier.height(10.dp))
        JobPanel(job, vm, openLibrary, openVoices)
        Spacer(Modifier.height(10.dp))
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = { Text("Hapus semua teks?") },
            text = { Text("Teks yang sedang ditulis akan dihapus.") },
            confirmButton = { TextButton(onClick = { vm.setText(""); vm.setTitle(""); confirmClear = false }) { Text("Hapus") } },
            dismissButton = { TextButton(onClick = { confirmClear = false }) { Text("Batal") } },
        )
    }
}

/** Pilihan suara: suara terpilih terlihat jelas, semua pilihan dibuka dalam satu daftar lengkap. */
@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
private fun StylePicker(vm: MainViewModel, selectedId: String, serverReady: Boolean, openSettings: () -> Unit) {
    val all = com.adriymine.tts.tts.VoiceCatalog.curated + com.adriymine.tts.tts.VoiceCatalog.voxStyles
    val v = vm.voiceOf(selectedId)
    val previewing by vm.previewing.collectAsState()
    var open by remember { mutableStateOf(false) }

    Card(
        onClick = { open = true },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(v.baseName, v.gender, true)
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text("Suara: ${v.baseName} · ${v.styleName}", fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(v.description, style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IconButton(onClick = { vm.previewVoice(v, com.adriymine.tts.tts.VoiceCatalog.sampleText(v)) }, enabled = previewing == null) {
                    if (previewing == v.id) androidx.compose.material3.CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                    else Icon(Icons.Filled.PlayArrow, "Dengar contoh", tint = MaterialTheme.colorScheme.primary)
                }
            }
            Spacer(Modifier.height(6.dp))
            OutlinedButton(onClick = { open = true }, modifier = Modifier.fillMaxWidth().height(40.dp), shape = RoundedCornerShape(12.dp)) {
                Text("Ganti suara  ·  ${all.size} pilihan")
            }
            if (v.isVox && !serverReady) {
                Text("Suara kloning ini butuh server VoxCPM2 di komputer. Tanpa server, audio dibuat dengan " +
                    (if (v.gender == com.adriymine.tts.tts.Gender.MALE) "Ardi" else "Gadis") + ".",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 6.dp))
            }
        }
    }

    if (open) {
        androidx.compose.material3.ModalBottomSheet(
            onDismissRequest = { open = false },
            sheetState = androidx.compose.material3.rememberModalBottomSheetState(skipPartiallyExpanded = true),
        ) {
            androidx.compose.foundation.lazy.LazyColumn(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, end = 16.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item { Text("Pilih suara", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
                item { SheetHeader("Suara bahasa Indonesia", "Langsung bisa dipakai di HP. Ucapan huruf & kata tepat.") }
                items(com.adriymine.tts.tts.VoiceCatalog.curated.size) { i ->
                    val x = com.adriymine.tts.tts.VoiceCatalog.curated[i]
                    VoiceRow(x, x.id == selectedId, previewing, needsServer = false,
                        onSelect = { vm.selectVoice(x.id); open = false },
                        onPreview = { vm.previewVoice(x, com.adriymine.tts.tts.VoiceCatalog.sampleText(x)) })
                }
                item {
                    SheetHeader("Suara kloning & VoxCPM2",
                        if (serverReady) "Server VoxCPM2 terhubung." else "Butuh server VoxCPM2 di komputer (Atur → Suara VoxCPM2).")
                }
                items(com.adriymine.tts.tts.VoiceCatalog.voxStyles.size) { i ->
                    val x = com.adriymine.tts.tts.VoiceCatalog.voxStyles[i]
                    VoiceRow(x, x.id == selectedId, previewing, needsServer = !serverReady,
                        onSelect = { vm.selectVoice(x.id); open = false },
                        onPreview = { vm.previewVoice(x, com.adriymine.tts.tts.VoiceCatalog.sampleText(x)) })
                }
                if (!serverReady) item {
                    OutlinedButton(onClick = { open = false; openSettings() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Hubungkan server VoxCPM2")
                    }
                }
            }
        }
    }
}

@Composable
private fun SheetHeader(title: String, sub: String) {
    Column(Modifier.padding(top = 10.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Text(sub, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun VoiceRow(
    v: com.adriymine.tts.tts.Voice, selected: Boolean, previewing: String?, needsServer: Boolean,
    onSelect: () -> Unit, onPreview: () -> Unit,
) {
    Card(
        onClick = onSelect,
        shape = RoundedCornerShape(14.dp),
        border = if (selected) androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainer
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(Modifier.padding(start = 10.dp, top = 8.dp, bottom = 8.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar(v.baseName, v.gender, selected)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("${v.baseName} · ${v.styleName}", fontWeight = FontWeight.SemiBold)
                Text(v.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (needsServer) Text("Perlu server komputer", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.error)
            }
            IconButton(onClick = onPreview, enabled = previewing == null && !needsServer) {
                if (previewing == v.id) androidx.compose.material3.CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Icon(Icons.Filled.PlayArrow, "Dengar contoh")
            }
        }
    }
}

@Composable
private fun JobPanel(job: JobState, vm: MainViewModel, openLibrary: () -> Unit, openSettings: () -> Unit) {
    var askServer by remember { mutableStateOf<(() -> Unit)?>(null) }
    askServer?.let { action ->
        val v = vm.voiceOf(vm.settings.collectAsState().value.voiceId)
        val alt = if (v.gender == com.adriymine.tts.tts.Gender.MALE) "Ardi" else "Gadis"
        AlertDialog(
            onDismissRequest = { askServer = null },
            title = { Text("Suara ${v.baseName} belum aktif") },
            text = {
                Text("Suara ${v.baseName} adalah suara kloning. Agar terdengar seperti suara aslinya, aplikasi harus " +
                    "tersambung ke server VoxCPM2 (di komputer atau server gratis di internet). " +
                    "Server belum disambungkan, jadi suara ${v.baseName} belum bisa dipakai.")
            },
            confirmButton = { TextButton(onClick = { askServer = null; openSettings() }) { Text("Sambungkan server") } },
            dismissButton = {
                TextButton(onClick = { askServer = null; vm.useFallbackVoice(); action() }) { Text("Pakai $alt dulu") }
            },
        )
    }
    fun guarded(action: () -> Unit) { if (vm.needsServerForCurrentVoice()) askServer = action else action() }
    when (job.status) {
        JobStatus.IDLE, JobStatus.CANCELLED -> Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            val previewing by vm.previewing.collectAsState()
            OutlinedButton(
                onClick = { guarded { vm.previewMyText() } }, enabled = previewing == null,
                modifier = Modifier.height(56.dp), shape = RoundedCornerShape(16.dp)
            ) {
                if (previewing != null) androidx.compose.material3.CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Icon(Icons.Filled.PlayArrow, null)
                Spacer(Modifier.width(6.dp)); Text("Coba dengar")
            }
            Box(Modifier.weight(1f)) { GenerateButton { guarded { vm.generate() } } }
        }
        JobStatus.PREPARING, JobStatus.RUNNING -> Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        ) {
            Column(Modifier.fillMaxWidth().padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Membuat audio… ${(job.progress * 100).toInt()}%", fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer)
                        Text(
                            if (job.total == 0) "Menyiapkan teks…" else "Bagian ${job.completed} dari ${job.total} • ${job.voiceName}",
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    TextButton(onClick = { vm.cancelJob() }) { Text("Batal") }
                }
                Spacer(Modifier.height(8.dp))
                if (job.total == 0) LinearProgressIndicator(Modifier.fillMaxWidth())
                else LinearProgressIndicator(progress = { job.progress }, modifier = Modifier.fillMaxWidth())
                job.message?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 6.dp),
                        color = MaterialTheme.colorScheme.onPrimaryContainer, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Text("Boleh layar dimatikan atau pindah aplikasi — proses tetap berjalan.",
                    style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 6.dp),
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.75f))
            }
        }
        JobStatus.ERROR -> Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
        ) {
            Column(Modifier.fillMaxWidth().padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.ErrorOutline, null, tint = MaterialTheme.colorScheme.onErrorContainer)
                    Spacer(Modifier.width(8.dp))
                    Text("Proses terhenti (${job.completed}/${job.total})", fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onErrorContainer)
                }
                Text(job.message ?: "", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 6.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (job.total > 0) Button(onClick = { vm.resumeJob() }) {
                        Icon(Icons.Filled.Refresh, null); Spacer(Modifier.width(6.dp)); Text("Lanjutkan")
                    }
                    OutlinedButton(onClick = { vm.dismissJob() }) { Text("Tutup") }
                }
            }
        }
        JobStatus.DONE -> Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
        ) {
            Column(Modifier.fillMaxWidth().padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.CheckCircle, null, tint = MaterialTheme.colorScheme.tertiary)
                    Spacer(Modifier.width(8.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Audio selesai!", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSecondaryContainer)
                        Text(
                            "Suara: ${job.voiceName} • " + (job.exportedTo?.let { "tersimpan di $it" } ?: "tersimpan di Pustaka"),
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                    androidx.compose.material3.IconButton(onClick = { vm.dismissJob() }) { Icon(Icons.Filled.Close, "Tutup") }
                }
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    job.result?.let { r ->
                        Button(onClick = { vm.play(r) }) { Icon(Icons.Filled.PlayArrow, null); Spacer(Modifier.width(4.dp)); Text("Putar") }
                        OutlinedButton(onClick = { vm.share(r) }) { Icon(Icons.Filled.Share, null); Spacer(Modifier.width(4.dp)); Text("Bagikan") }
                    }
                    TextButton(onClick = openLibrary) { Text("Pustaka") }
                }
            }
        }
    }
}

@Composable
private fun GenerateButton(onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
    ) {
        Icon(Icons.Filled.AutoAwesome, null)
        Spacer(Modifier.width(8.dp))
        Text("Buat Audio", fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun ToolChip(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    Row(
        Modifier.clip(RoundedCornerShape(50)).background(MaterialTheme.colorScheme.surfaceContainer)
            .clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(6.dp))
        Text(label, style = MaterialTheme.typography.labelLarge)
    }
}

/** Editor teks berbasis EditText native: tetap ringan untuk teks puluhan ribu kata. */
@Composable
private fun TextEditor(text: String, onChange: (String) -> Unit, modifier: Modifier) {
    val fg = MaterialTheme.colorScheme.onSurface.toArgb()
    val hintColor = MaterialTheme.colorScheme.onSurfaceVariant.toArgb()
    val border = MaterialTheme.colorScheme.outline
    Box(
        modifier.clip(RoundedCornerShape(14.dp)).border(1.dp, border, RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { c ->
                EditText(c).apply {
                    setBackgroundColor(AColor.TRANSPARENT)
                    gravity = Gravity.TOP or Gravity.START
                    inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE or
                        InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
                    isSingleLine = false
                    isVerticalScrollBarEnabled = true
                    setHorizontallyScrolling(false)
                    textSize = 16f
                    setLineSpacing(0f, 1.15f)
                    setPadding(36, 28, 36, 28)
                    this.hint = "Ketik atau tempel teks di sini…\n\nTips: pisahkan paragraf dengan baris kosong agar jeda terdengar alami."
                    setText(text)
                    tag = text
                    addTextChangedListener(object : TextWatcher {
                        override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
                        override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
                        override fun afterTextChanged(s: Editable?) {
                            val v = s?.toString() ?: ""
                            if (v != tag) { tag = v; onChange(v) }
                        }
                    })
                }
            },
            update = { et ->
                et.setTextColor(fg)
                et.setHintTextColor(hintColor)
                if (et.tag != text) {
                    et.tag = text
                    et.setText(text)
                    runCatching { et.setSelection(et.text.length) }
                }
            }
        )
    }
}

@Composable
fun Avatar(name: String, gender: com.adriymine.tts.tts.Gender, selected: Boolean = false) {
    val bg = if (gender == com.adriymine.tts.tts.Gender.FEMALE) androidx.compose.ui.graphics.Color(0xFFEC4899)
    else androidx.compose.ui.graphics.Color(0xFF3B82F6)
    Box(
        Modifier.size(42.dp).clip(CircleShape).background(if (selected) MaterialTheme.colorScheme.primary else bg),
        contentAlignment = Alignment.Center
    ) {
        Text(name.take(1).uppercase(), color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
    }
}
