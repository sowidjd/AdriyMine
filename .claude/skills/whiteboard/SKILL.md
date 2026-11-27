---
name: whiteboard
description: >-
  Membuat video Arfiy World bergaya WHITEBOARD ANIMATION: papan putih, gambar spidol yang tergambar goresan demi
  goresan dengan tangan memegang spidol mengikuti ujungnya, tulisan tangan, arsiran warna, orang lidi, panah, lampu
  ide, gelembung bicara, grafik, gambar dari path SVG, Adriy atau gambar apa pun diungkap dengan sapuan, kamera di papan
  besar, dan transisi dihapus penghapus. Memakai projects/_bersama/papantulis.js. Pakai saat pemilik minta
  "whiteboard", "papan tulis", "animasi gambar tangan", "doodle explainer", atau gaya §9 yang dipilih whiteboard.
---

# Whiteboard Animation

Gaya **"dijelaskan sambil digambar"**. Penonton melihat tangan menggambar ide langkah demi langkah, dan setiap goresan muncul tepat saat narasi menyebutnya.
Kekuatannya ada pada **rasa penasaran: "dia mau gambar apa?"** Gaya ini sangat cocok untuk penjelasan sebab-akibat (bagian Penyebab §12).
Semua aturan `aturan.md` tetap berlaku: caption, kotak aman, nama channel, penutup, dan variasi §16.

**Contoh lengkap:** `projects/whiteboard-contoh/`. Isinya judul tulisan tangan, orang lidi menguap dengan panah ke Adriy (diungkap dengan sapuan), gelembung bicara, lampu ide yang diarsir kuning, hati dari path SVG, dan grafik naik dengan lingkaran dan centang.

## Memasang

```html
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/papantulis.js"></script>
<script>
const GAYA = WB.gaya(), SP = WB.SPIDOL;                 // papan putih, garis spidol, transisi dihapus penghapus
const rencana = {};                                     // buat rencana SEKALI per adegan (t0() baru ada setelah timeline dimuat)
const R1 = () => rencana.a ??= WB.rencana([
  { teks: 'Kok bisa?', x: 540, y: 330, ukuran: 78 },
  { goresan: WB.lampu(540, 620, 1.4) },
  { arsir: lingkaranPath, warna: '#FFD84D', kotak: [450, 520, 180, 200] },
], { mulai: t0('a1') - .1, laju: 1500 });
S.adegan = t => { R1()(t); WB.tanganAktif(); };        // tangan selalu dipanggil terakhir di adegan
</script>
```

## Isi pustaka (`WB.*`)

| Fungsi | Untuk |
|---|---|
| `WB.rencana(item, {mulai, laju, lajuTeks})` | **Inti gaya ini.** Item digambar berurutan. Durasinya otomatis sebanding dengan panjang goresan (`laju` px/detik). `tunda` menambah jeda sebelum satu item. |
| item `{goresan, warna, lebar}` | Garis spidol yang tergambar, tangan mengikuti ujungnya |
| item `{teks, x, y, ukuran, warna}` | Tulisan tangan (huruf muncul berurutan) |
| item `{arsir: Path2D, warna, kotak}` | Mewarnai dengan arsiran spidol zigzag |
| item `{ungkap: fn, kotak}` | Gambar apa pun (Adriy, ikon dari skill lain) muncul dengan sapuan |
| item `{jeda: detik}` / `{durasi}` | Mengatur ritme |
| `WB.garis`, `WB.lingkaran`, `WB.kotak`, `WB.panah`, `WB.garisBawah`, `WB.centang`, `WB.silang`, `WB.bintang`, `WB.orangLidi`, `WB.lampu`, `WB.gelembung`, `WB.grafikNaik` | Bentuk siap pakai (daftar goresan) |
| `WB.dariSVG(d, x, y, skala)` | Gambar dari path SVG apa pun. Path harus dibuat sendiri atau berlisensi bebas. |
| `WB.tanganAktif()` / `WB.tangan(x, y)` | Tangan memegang spidol, digambar dari kode (bukan foto) |
| `WB.kamera({x, y, zoom}, fn)` | Papan besar: kamera bergeser ke area yang sedang digambar |
| `WB.hapus(k, fn)` | Transisi penghapus menyapu papan (bawaan `WB.gaya`) |
| `WB.SPIDOL` | Warna spidol: hitam, biru, merah, hijau, oranye, ungu |

## Resep supaya bagus (wajib)

1. **Garis hitam dulu, warna belakangan.** Garis luar spidol hitam, lalu 1–2 warna aksen (merah untuk penting, biru untuk catatan) dan arsiran untuk satu hal yang disorot.
2. **Gambar mengikuti narasi.** Goresan dimulai bersamaan dengan kata yang dimaksud. Atur lewat `mulai: t0('id')` dan `tunda`. Jangan menggambar hal yang belum diucapkan.
3. **Ritme menggambar:** tulisan ±14 huruf/detik, garis 1.300–1.700 px/detik. Gambar besar (> 2 detik) dipecah jadi beberapa item supaya tangan "berpindah". Itu terlihat alami.
4. **Kosongkan papan secara berkala.** Maksimal 5–7 gambar dalam satu papan, lalu dihapus (transisi) atau kamera bergeser ke area papan yang masih kosong.
5. **Sederhana dan jelas:** orang lidi, ikon, panah, dan kata kunci pendek. Penjelasan panjang tetap lewat caption.
6. **Adriy tetap Adriy.** Munculkan Adriy lewat `ungkap`, seolah digambar, dengan ciri dan warnanya tetap (§15). Adriy jangan digambar ulang sebagai garis.
7. **Tangan tidak boleh menutup kata kunci terlalu lama.** Tangan hilang sendiri saat tidak ada yang sedang digambar.
8. **Sound design:** bunyi spidol menggores saat ada goresan, ketukan spidol saat menulis titik, dan desir penghapus untuk transisi. Musiknya ringan (ukulele, pizzicato).
9. **Kotak aman:** tulisan dan gambar penting berada di x 60–927 dan y 212–1540. Caption ada di bawah, jadi jangan menggambar hal penting di y > 1250 saat caption tampil.

## Teknis & jebakan

- Buat `WB.rencana` **sekali** per adegan (simpan di cache, seperti contoh). Jangan membuatnya ulang setiap frame, karena berat dan titik acaknya bisa berubah.
- `t0('id')` hanya bisa dipakai setelah timeline dimuat. Karena itu rencana dibungkus fungsi (`R1()`).
- Jangan memakai `Math.random()`. Pakai `WB.R(n)` atau `hash(n)`.
- Jangan menyisipkan komentar `//` di tengah baris kode yang ditulis satu baris (sisa baris ikut jadi komentar).
- Cek dengan `node render.mjs --sheet=...`, lalu uji gerak lewat HyperFrames (`--start A --end B --workers 1`).
- Bisa digabung dengan gaya lain: ungkap grafik `/infografis`, organ `/anatomi-3d`, atau stiker `/mixed-media` di atas papan.
