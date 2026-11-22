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

## Yang didukung
- TypeScript/TSX/JSX, satu atau banyak file (penanda `// src/Root.tsx` atau blok ```tsx), sudah diuji 21.000+ baris.
- `<Composition>`, `<Still>`, `<Folder>`, `registerRoot`, `calculateMetadata`, `defaultProps`, atau cukup komponen yang di-export.
- Fungsi Remotion/React yang lupa di-import (useCurrentFrame, interpolate, useState, dll.) otomatis tersedia.
- **3D**: `@remotion/three` (`ThreeCanvas`), `three`, `@react-three/fiber`, `@react-three/drei`.
- 143 modul bawaan: remotion, player, transitions (semua efek), shapes, paths, noise, motion-blur, layout-utils, animation-utils, media-utils, media, fonts, google-fonts, captions, gif, lottie, light-leaks, starburst, rounded-text-box, effects, zod, react. Paket lain dicoba diambil dari jsDelivr.

## Untuk pengembang
```
npm install
npm run build   # dist/index.html (Artifact), dist/remotion-saku.html (mandiri), aset APK
npm test        # uji Chromium (Pixel 7): 14 skenario + router AI + jalur APK
npm run apk     # butuh Android SDK (ANDROID_HOME) dan android/keystore/saku.jks
```
- `scripts/patch-web-renderer.mjs` menambal `@remotion/web-renderer` agar `radial-gradient(... at X Y)` ikut tergambar saat ekspor.
- Kunci tanda tangan APK (`android/keystore/`) sengaja tidak disimpan di GitHub.
- Ekspor memakai lisensi gratis Remotion (`licenseKey: "free-license"`), lihat remotion.dev/license.
