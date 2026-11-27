---
name: mixed-media
description: >-
  Membuat video Arfiy World bergaya MIXED MEDIA / kolase: kertas bertekstur & robek (kraft, koran, buku kotak, bergaris),
  selotip, stiker bertepi putih (bisa membungkus Adriy atau objek 3D dari anatomi-3d / cosmic-motion), coretan spidol yang
  tergambar, huruf guntingan ala surat kaleng, halftone, kliping koran, polaroid, cap stempel, gerak stop-motion, butiran
  film, dan transisi kertas disobek. Memakai projects/_bersama/campuran.js. Pakai saat pemilik minta "mixed media",
  "kolase", "scrapbook", "gaya guntingan", atau gaya §9 yang dipilih kolase/mixed media.
---

# Mixed Media

Gaya **kolase di atas meja**: potongan kertas, foto atau stiker, dan coretan tangan bertumpuk seperti scrapbook yang hidup.
Kekuatannya adalah **mencampur bahan yang berbeda**. Gambar datar Adriy, objek 3D yang mengkilap, cetakan halftone, dan coretan spidol tampil bersama di satu layar.
Semua aturan `aturan.md` tetap berlaku: caption, kotak aman, nama channel, penutup "Stay Curious, World!", dan variasi §16.

**Contoh lengkap:** `projects/mixed-media-contoh/`. Isinya judul guntingan, jantung 3D yang jadi stiker, lingkaran dan panah coretan, kliping koran dengan cap "SALAH!", polaroid, kertas buku kotak-kotak, jantung halftone, dan petir coretan.

## Memasang

```html
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/campuran.js"></script>
<!-- opsional, untuk stiker 3D: -->
<script src="../_bersama/lib/three-0.159.min.js"></script> <script src="../_bersama/anatomi3d.js"></script>
<script>
const GAYA = MM.gaya({ latar: 'kraft', aksen: MM.PALET.kuning });   // latar meja, bentuk = potongan kertas, transisi sobek, butiran film
S.adegan = t => { MM.guntingan('KOK BISA?', 540, 330, 92, { k: seg(t, .1, 1.2) }); MM.coret(MM.lingkaran(540, 900, 300, 300, 4), { k }); };
</script>
```

`three-0.159.min.js` dimuat **sebelum** `dasar.js`, sedangkan `campuran.js` dan `anatomi3d.js` dimuat **sesudahnya**.

## Isi pustaka (`MM.*`)

| Fungsi | Untuk |
|---|---|
| `MM.gaya({latar, aksen, butiran})` | GAYA siap pakai untuk `dasar.js`. Bentuk = potongan kertas berbayang dan berserat. |
| `MM.kertas(x, y, w, h, id, {jenis, rot, sisi, k, isi})` | Potongan kertas: `kraft`, `putih`, `koran`, `kotak`, `garis`, atau warna `#hex`. Tepi robek dengan inti putih. `isi(w, h)` menggambar di atas kertas. |
| `MM.selotip(x, y, panjang, rot, id)` | Selotip kertas transparan |
| `MM.stiker(fn, x, y, {area, skala, rot, k})` | Apa pun yang digambar `fn` (Adriy, `A3.gambar`, `K.gambar`, tag) diberi tepi putih dan bayangan, lalu ditempel |
| `MM.coret(titik, {k, warna, lebar, id})` | Coretan spidol yang tergambar sepanjang `k` dan bergetar tiap bingkai |
| `MM.lingkaran`, `MM.panah`, `MM.garisBawah`, `MM.bintang`, `MM.zigzag` | Bentuk coretan siap pakai (menghasilkan titik untuk `MM.coret`) |
| `MM.guntingan(teks, x, y, ukuran, {k, id, maks})` | Huruf guntingan ala surat kaleng, muncul berurutan, otomatis muat di kotak aman |
| `MM.isiHalftone(path, kotak, warna, warnaTitik)`, `MM.bolaHalftone`, `MM.hati`, `MM.halftone` | Efek cetak titik-titik dengan arah cahaya |
| `MM.kliping(x, y, w, h, judul, id)` | Potongan koran dengan judul tebal dan kolom teks |
| `MM.polaroid(x, y, w, h, id, {isi, tulisan})` | Foto polaroid, isinya digambar sendiri, dan tulisan tangan di bawahnya |
| `MM.cap(teks, x, y, {k, warna})` | Cap stempel karet yang dihentakkan |
| `MM.langkah(t, fps)` / `MM.goyang(id, t, amp)` | Waktu dan getaran stop-motion |
| `MM.latar(jenis)`, `MM.butiran(t)`, `MM.transSobek(k, fn)` | Latar meja, butiran film dan vinyet, transisi kertas disobek |
| `MM.keKanvas(kanvas, fn)` | Menggambar ke kanvas lain (dipakai stiker) |

## Resep supaya bagus (wajib)

1. **Satu meja, banyak lapisan.** Susunan dari bawah ke atas: latar (kraft, kayu, atau kotak) → kertas besar → foto, stiker, atau kliping → selotip → coretan → teks guntingan. Bayangan membuat setiap lapisan terasa nyata.
2. **Campur bahan dengan sengaja.** Dalam satu adegan, maksimal 3 bahan: misalnya 3D + kertas + coretan, atau halftone + kliping + cap. Terlalu banyak bahan membuat layar ramai dan pesannya hilang.
3. **Stop-motion untuk kertas, mulus untuk isinya.** Kertas dan stiker bergetar sedikit (`MM.goyang(id, T, .01–.02)` untuk rotasi, 1–3 px untuk posisi). Objek 3D dan coretan tetap mulus. Kontras gerak inilah ciri khas mixed media.
4. **Coretan menjelaskan.** Lingkaran, panah, dan garis bawah muncul tepat saat kata kuncinya diucapkan. Satu coretan untuk satu ide. Pakai warna aksen yang konsisten: merah untuk penting, kuning untuk energi, biru untuk catatan.
5. **Huruf guntingan hanya untuk judul atau kata kejutan** (≤ 3 kata per baris). Penjelasan tetap memakai caption biasa supaya mudah dibaca.
6. **Pergantian adegan pakai sobekan kertas** (sudah bawaan `MM.gaya`), atau kertas baru ditempel di atas yang lama.
7. **Sound design:** bunyi kertas disobek, selotip ditarik, spidol menggores, cap dihentak, dan klik kamera polaroid (cari di `projects/sfx-saya/`, lalu `repos/sfx-kit`).
8. **Kotak aman:** judul guntingan dan teks penting berada di x 60–927 dan y 212–1540. `MM.guntingan` mengecilkan dirinya otomatis kalau terlalu lebar.

## Larangan

- **Jangan memakai foto, potongan koran, logo, atau gambar milik orang lain.** Semua tekstur di pustaka ini dibuat dari kode. Kalau ingin memakai foto asli, pakai hanya foto milik pemilik sendiri atau CC0, lalu catat sumbernya.
- Kliping koran adalah **hiasan**: jangan menulis judul yang meniru berita nyata atau mengutip media tertentu. Judulnya harus pertanyaan atau pernyataan dari naskah sendiri.
- Jangan memakai `Math.random()`. Pakai `MM.R(n)` atau `hash(n)`.

## Cek hasil

- Ambil gambar contoh dengan `node render.mjs --sheet=...`. Periksa bahwa judul tidak keluar layar, stiker tidak terpotong (atur `area` dan `skala`), dan caption tidak menutupi bagian penting.
- Uji gerak dengan potongan pendek lewat HyperFrames: `--start A --end B --workers 1` (lihat `projects/hyperframes/README.md`).
- Nilai dengan `/elemen-konten`, terutama elemen 7 (visual storytelling): setiap bahan dan coretan harus punya alasan.
