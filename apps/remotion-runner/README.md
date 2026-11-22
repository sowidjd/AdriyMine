# Remotion Saku

Aplikasi HP untuk menjalankan kode Remotion: **tempel kode → Jalankan → putar → ekspor MP4**. Semua berjalan di browser HP (tanpa server, tanpa install).

## Cara pakai
1. Buka `dist/remotion-saku.html` di browser HP (Chrome Android paling stabil), atau buka versi Artifact claude.ai.
2. Tab **Kode** → **Tempel** (atau tekan lama di kolom kode → Tempel).
3. Tekan **Jalankan**. Video tampil di tab **Putar**.
4. Tab **Ekspor** → **Buat video** → **Simpan ke HP**.
5. Tab **Aset**: unggah gambar/suara agar `staticFile("nama.png")` bekerja.

## Yang didukung
- TypeScript/TSX/JSX, satu file atau banyak file sekaligus (penanda `// src/Root.tsx` atau blok ```tsx dari ChatGPT/Claude).
- `<Composition>`, `<Still>`, `<Folder>`, `registerRoot`, `calculateMetadata`, `defaultProps`, atau cukup komponen yang di-export.
- Paket bawaan (139 modul): remotion, @remotion/player, transitions (semua efek), shapes, paths, noise, motion-blur, layout-utils, animation-utils, media-utils, media, fonts, google-fonts, captions, gif, lottie, light-leaks, starburst, rounded-text-box, effects, zod, react. Paket lain dicoba diambil dari jsDelivr.
- Error ditampilkan dengan nama file, nomor baris, dan saran perbaikan; aplikasi tidak ikut mogok.

## Untuk pengembang
```
npm install
npm run build   # menghasilkan dist/index.html (Artifact) dan dist/remotion-saku.html (mandiri)
npm test        # uji otomatis di Chromium (Pixel 7): 9 skenario termasuk ekspor MP4
```
Ekspor memakai `@remotion/web-renderer` dengan `licenseKey: "free-license"` (lisensi gratis Remotion untuk perorangan/tim kecil, lihat remotion.dev/license).
