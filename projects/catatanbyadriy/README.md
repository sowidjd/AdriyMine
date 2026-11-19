# CatatanByAdriy (aplikasi Android)

Aplikasi catatan, berkas, AI, dan kalender. Tampilan dibuat mengikuti 7 gambar contoh (Dashboard, Catatan, Editor x2, Berkas, AI, Kalender).

- **APK siap pasang:** `dist/CatatanByAdriy.apk` (Android 7.0 ke atas).
- Semua data (catatan, berkas unggahan, agenda) tersimpan **di HP**, tanpa login, tanpa internet.
- Catatan membaca Markdown luas: judul, daftar bertingkat, tugas [ ], tabel, kode berwarna, rumus $..$/$$..$$, diagram mermaid, peringatan > [!NOTE], kotak ::: info, ==stabilo==, ++sisipan++, ~sub~, ^sup^, catatan kaki, singkatan, daftar definisi, emoji :smile:. Menu ⋮ → Edit sebagai Markdown / Ekspor .md. Berkas .md bisa dibuka dan dijadikan catatan.
- "Rapikan dengan AI" merapikan catatan memakai Markdown di HP (tanpa server): spasi, penanda daftar, huruf kapital, judul bagian, tugas, tabel.
- Asisten AI memakai model gratis yang dicari otomatis (`www/ai.js`): OpenRouter model `:free`, Groq, Gemini (bila kunci gratis diisi di sidebar → Pengaturan), lalu Pollinations tanpa kunci (batas 1 balasan / 45 detik). Model yang error/kena batas dilewati otomatis; daftar model dicari ulang saat semua gagal dan saat internet tersambung lagi.
- Animasi pembuka dibuat dengan Remotion di folder `intro/` (`REMOTION_BROWSER=/path/chrome-headless-shell npm run build` → `www/media/intro.webm`).

## Struktur
- `www/` — tampilan & logika (HTML/CSS/JS). Skala: `1rem` = lebar layar / 64, jadi ukuran pas di semua lebar HP.
- `www/md.js` — Markdown (render, ubah ke Markdown, rapikan). Pustaka di `www/lib/` (markdown-it + plugin, KaTeX, highlight.js, mermaid, turndown, DOMPurify).
- `www/img/` — ilustrasi & ikon berwarna, dipotong langsung dari gambar contoh (`tools/crop.py`).
- `android/` — pembungkus WebView (Java, tanpa library tambahan).
- `tools/compare.js` — render tiap layar untuk dibandingkan dengan gambar contoh.

## Membangun ulang APK
```
cd android
./gradlew assembleRelease
# hasil: app/build/outputs/apk/release/app-release.apk
```
Butuh Android SDK (platform 35, build-tools 35.0.0) di `local.properties`.
File kunci tanda tangan `android/keystore/catatan.jks` tidak diunggah ke GitHub; tanpa file itu APK ditandatangani kunci debug.
