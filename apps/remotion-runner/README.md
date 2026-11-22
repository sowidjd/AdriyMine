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

## AI gratis dengan cadangan otomatis
Urutan: Claude (hanya di claude.ai) → penyedia yang kuncinya Anda isi → Pollinations → Pollinations Gen → LLM7.
Kunci gratis opsional: OpenRouter (router `openrouter/free` + model `:free` yang dicari otomatis), Groq, Google Gemini, Cerebras, Hugging Face.
Bila satu penyedia kuotanya habis (429/402), aplikasi menandainya "istirahat" dan langsung pindah ke berikutnya; bila model tidak ada, mencoba model lain di penyedia yang sama.
Hasil AI selalu diperiksa dulu (dikompilasi); kalau masih error, AI diminta mencoba lagi dengan pesan error barunya. File panjang (>350 baris) diperbaiki dengan potongan SEARCH/REPLACE agar tidak terpotong.

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
