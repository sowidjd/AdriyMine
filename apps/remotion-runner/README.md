# Remotion Saku

Aplikasi HP untuk menjalankan kode Remotion: **tempel kode → Jalankan → putar → ekspor MP4**. Semua berjalan di HP sendiri (tanpa server).

## Cara memasang
- **APK Android**: unduh `apk/RemotionSaku.apk` ke HP, buka, izinkan "pasang dari sumber ini". Android 8 ke atas.
- **Tanpa pasang**: buka `dist/remotion-saku.html` di Chrome HP, atau versi Artifact claude.ai.

## Cara pakai
1. Tab **Kode** → **Tempel**. Di APK juga bisa: pilih kode di aplikasi lain (WhatsApp, Chrome) → Bagikan → Remotion Saku.
2. **Rapikan**: merapikan kode secara offline (Prettier).
3. **Jalankan** → video tampil di tab **Putar**.
4. Ada error? Tekan **Perbaiki dengan AI** (gratis). AI hanya dipakai di tombol ini.
5. Tab **Ekspor** → **Cek cuplikan hasil** (opsional) → **Buat video** → **Simpan ke HP** (masuk ke folder Movies/Remotion Saku).
6. Tab **Lainnya**: unggah aset untuk `staticFile()`, status & kunci AI, bantuan.

## Kode salah tetap diputar (mode toleran)
- Salah tulis kecil diperbaiki otomatis: tanda yang kurang ditambahkan, kurung di akhir ditutup, baris yang rusak dilewati (lokasi error dicari dengan @babel/parser).
- Nama/komponen/fungsi yang belum dibuat atau di-import diganti "kosong"; file/paket yang tidak ada diganti modul kosong.
- Komponen yang error saat diputar disembunyikan sendirian (pelindung per komponen), bagian lain tetap jalan.
- Semua tindakan tampil di tab Putar: "Video tetap diputar, N bagian kode dilewati", dengan pesan berbahasa Indonesia, tombol Lihat baris, dan **Perbaiki semuanya dengan AI**.

## Node.js
- **Node mini (bawaan, selalu aktif)**: `fs` (berisi file proyek di `/src` dan aset di `/public`), `path`, `process`, `Buffer`, `events`, `util`, `stream`, `url`, `os`, `crypto` (randomUUID, createHash sha256), `timers`, file data `.json/.txt/.csv/.md`, dan `remotion.config.ts` (`@remotion/cli/config` diabaikan dengan aman). Fungsi yang memang butuh proses/server (child_process, http, @remotion/renderer) memberi pesan jelas.
- **Node.js asli lewat Termux (opsional)**: `bridge/saku-bridge.mjs` berjalan di Termux (`pkg install nodejs-lts`), hanya di 127.0.0.1:3737 dan wajib **kode sambung** 6 angka. Fungsinya: memasang paket npm apa pun (npm `--ignore-scripts` + esbuild, React/Remotion tetap memakai milik aplikasi) dan menjalankan skrip Node.js dari tab Lainnya. Perintah pemasangan bisa disalin dari aplikasi.

## AI gratis dengan cadangan otomatis
Router otomatis:
- Tanpa kunci: Pollinations, LLM7, OVHcloud AI Endpoints, dan **Kilo Gateway** (router model gratis; hanya di APK karena dipanggil lewat Android, bebas aturan CORS).
- Daftar model gratis dicari online (endpoint /models tiap penyedia + katalog harian model ":free" untuk OpenRouter), diperbarui tiap 6 jam saat terhubung internet.
- Model yang paling sering berhasil didahulukan. Error dibaca dengan benar: "sedang ramai" (429) hanya mengistirahatkan model itu sebentar, "kode terlalu panjang" pindah ke model lain, hanya "kuota habis"/"perlu saldo" yang mengistirahatkan penyedia.
- Kunci gratis opsional: OpenRouter, Groq, Gemini, Cerebras, Hugging Face, Pollinations.
- AI hanya diminta **mengganti baris tertentu** (format `GANTI a-b … SELESAI`), jadi tidak bisa meringkas kode; jawaban berisi "// ..." / "sisanya sama" ditolak; hasil diperiksa dulu sebelum dipakai.
- Setiap percobaan (penyedia, model, alasan gagal) ditampilkan di layar.

## Format video (rasio)
Tab **Putar → Format video**: Asli, TikTok, Reels, Shorts (9:16), YouTube (16:9), Feed IG (1:1, 4:5), Sinema (21:9), atau Kustom; resolusi 720p–4K.
Cara menyesuaikan: **Pas** (seluruh video terlihat + warna latar), **Penuhi** (dipotong), **Ubah kanvas** (untuk kode yang memakai `useVideoConfig()`).

## Pratinjau sebelum unduh & video panjang
- Setelah render, layar **Pratinjau hasil** memutar file video yang sebenarnya; baru setelah itu **Simpan ke HP / Bagikan / Buang**.
- **Cek cuplikan hasil**: gambar 1 frame persis seperti di file video, sebelum render penuh.
- Durasi sampai 4 jam. Video > 2 menit bisa dibagi per 5/10/15 menit (di APK tiap bagian langsung tersimpan). Bila browser mendukung, hasil ditulis ke penyimpanan internal (bukan RAM).

## 3D gaya video sains (`@saku/3d`)
```tsx
import { Canvas3D, Studio, Effects, Cutaway, Label3D, CameraPath, OrbitCamera, Turntable, Model } from '@saku/3d';
```
- `Canvas3D`: kanvas seukuran video; jam 3D = waktu video, jadi `useFrame` pun sinkron dan hasil ekspor = pratinjau. `ThreeCanvas` dan `Canvas` biasa otomatis diganti dengan ini.
- `Studio`: lampu kunci/rim, pantulan lingkungan (offline), bayangan lembut di lantai.
- `Effects`: bloom, ambient occlusion (N8AO), depth of field, vignette, tone mapping ACES.
- `Cutaway`: membelah objek dengan bidang potong yang diberi warna (teknik stencil), per lapisan bisa `userData={{ capColor }}`.
- `Label3D`: label teks + garis penunjuk yang selalu berada di dalam bingkai.
- `CameraPath`, `OrbitCamera`, `Turntable`, `Model` (.glb dari Aset).
Contoh lengkap: **Contoh → 3D sains: penampang Bumi**.

## Yang didukung
- TypeScript/TSX/JSX, satu atau banyak file (penanda `// src/Root.tsx` atau blok ```tsx), sudah diuji 21.000+ baris.
- `<Composition>`, `<Still>`, `<Folder>`, `registerRoot`, `calculateMetadata`, `defaultProps`, atau cukup komponen yang di-export.
- Fungsi Remotion/React yang lupa di-import (useCurrentFrame, interpolate, useState, dll.) otomatis tersedia.
- **3D**: `@remotion/three` (`ThreeCanvas`), `three`, `@react-three/fiber`, `@react-three/drei`.
- 176 modul bawaan (termasuk postprocessing dan pustaka tambahan three.js seperti GLTFLoader, RoomEnvironment, TextGeometry): remotion, player, transitions (semua efek), shapes, paths, noise, motion-blur, layout-utils, animation-utils, media-utils, media, fonts, google-fonts, captions, gif, lottie, light-leaks, starburst, rounded-text-box, effects, zod, react. Paket lain dicoba diambil dari jsDelivr.

## Untuk pengembang
```
npm install
npm run build   # dist/index.html (Artifact), dist/remotion-saku.html (mandiri), aset APK
npm test        # uji Chromium (Pixel 7): fitur utama, 3D sains, video 32 menit, router AI, jalur APK
npm run apk     # butuh Android SDK (ANDROID_HOME) dan android/keystore/saku.jks
```
- `scripts/patch-web-renderer.mjs` menambal `@remotion/web-renderer` agar `radial-gradient(... at X Y)` ikut tergambar saat ekspor.
- Kunci tanda tangan APK (`android/keystore/`) sengaja tidak disimpan di GitHub.
- Ekspor memakai lisensi gratis Remotion (`licenseKey: "free-license"`), lihat remotion.dev/license.
