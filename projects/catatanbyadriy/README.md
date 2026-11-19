# CatatanByAdriy (aplikasi Android)

Aplikasi catatan, berkas, AI, dan kalender. Tampilan dibuat mengikuti 7 gambar contoh (Dashboard, Catatan, Editor x2, Berkas, AI, Kalender).

- **APK siap pasang:** `dist/CatatanByAdriy.apk` (Android 7.0 ke atas).
- Semua data (catatan, berkas unggahan, agenda) tersimpan **di HP**, tanpa login, tanpa internet.
- Asisten AI belum tersambung ke layanan AI apa pun; tombol chat menyimpan pesan dan memberi tahu bahwa AI belum aktif.

## Struktur
- `www/` — tampilan & logika (HTML/CSS/JS). Skala: `1rem` = 10px pada gambar contoh lebar 1086px.
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
