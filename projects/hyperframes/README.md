# Jembatan ke HyperFrames

[HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen, Apache-2.0) adalah alat yang mengubah halaman HTML jadi video MP4.
Folder ini menghubungkan video Canvas kita (yang memakai `projects/_bersama/dasar.js`) ke HyperFrames.
Dengan begitu video bisa dilihat di HyperFrames Studio, dicek, dan dirender.

Cara membuat animasi **tidak berubah**: tetap ditulis di `projects/<nama>/index.html` dan mengikuti `aturan.md`.

## Pemakaian

```bash
# 1. buat proyek HyperFrames dari video (hasilnya di projects/<nama>/hf/, boleh dibuat ulang kapan saja)
node projects/hyperframes/buat.mjs gagak

cd projects/gagak/hf
# 2. cek
npx hyperframes@0.9.104 lint
npx hyperframes@0.9.104 snapshot --at 5,60,168        # gambar contoh, tersimpan di .hyperframes/artifacts/snapshots/
# 3. lihat & sunting di Studio (browser)
npx hyperframes@0.9.104 preview
# 4. render
npx hyperframes@0.9.104 render --quality draft --fps 24 --start 0 --end 10 -o uji.mp4   # uji 10 detik
npx hyperframes@0.9.104 render --quality delivery --fps 24 -o video.mp4                  # video penuh
```

Butuh Node.js 22+ dan FFmpeg.

## Cara kerjanya

- `buat.mjs` menyalin `dasar.js`, font Fredoka, GSAP (`lib/gsap.min.js`, 3.14.2), dan isi `timeline.json` ke `hf/`.
- Skrip animasi video dipindah ke `hf/video.js`.
- Timeline GSAP sepanjang durasi narasi memanggil `renderAt(t)` dari `dasar.js` untuk setiap frame. HyperFrames memegang waktunya, jadi tidak ada `requestAnimationFrame`.
- `window.HF_MODE = true` membuat `dasar.js` tidak memutar sendiri dan tidak membuat JPEG per frame.
- **Suara:** kalau `projects/<nama>/audio.wav` (hasil `audio.py`) ada, file itu ikut dipasang sebagai trek audio. Kalau tidak ada, video yang dihasilkan tanpa suara.
  File suara tiruan pemilik tetap **tidak** diunggah ke GitHub (`hf/` diabaikan git).

## Batasan

- Hanya untuk video yang memakai `_bersama/dasar.js`. Video lama `bangun-pagi` dan `peregrine` punya mesin sendiri.
- Video lama yang dirender ulang memakai kartu penutup terbaru ("Stay Curious, World!"), tetapi teks di dalam adegan tetap yang lama.
- HyperFrames mengirim data pemakaian anonim. Untuk mematikannya, jalankan `npx hyperframes@0.9.104 telemetry disable`.
