---
name: papercut
description: >-
  Membuat video Arfiy World bergaya PAPERCUT (kertas berlapis / shadow box / diorama kertas / pop-up book):
  lapisan kertas berwarna dengan bayangan jatuh, tekstur serat, kedalaman berparalaks, bukit, ombak, awan, gunung,
  pohon, kota, matahari bersinar, bintang, bingkai berlubang, teks kertas berlapis, Adriy jadi potongan kertas, dan
  animasi naik / pop-up / goyang. Memakai projects/_bersama/papercut.js. Pakai saat pemilik minta "papercut",
  "paper cut", "kertas berlapis", "diorama", "pop-up", atau gaya §9 yang dipilih papercut.
---

# Papercut

Gaya **diorama kertas**: setiap bagian adegan adalah selembar kertas berwarna yang dipotong. Lembaran-lembaran itu disusun dari belakang ke depan, dan setiap lembar menjatuhkan bayangan lembut ke lembar di belakangnya.
Beda dengan `/mixed-media` (kolase acak berbagai bahan): papercut itu **rapi, satu bahan, berlapis-lapis, dan terasa dalam**.
Semua aturan `aturan.md` tetap berlaku: caption, kotak aman, nama channel, penutup, dan variasi §16.

**Contoh lengkap:** `projects/papercut-contoh/`. Isinya senja dengan bukit berlapis dan matahari terbit, laut dengan ombak dan perahu, kota malam di bingkai lengkung, dan buku pop-up dengan Adriy.

## Memasang

```html
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/papercut.js"></script>
<script>
const GAYA = PC.gaya({ palet: 'senja' });          // senja | laut | hutan | malam | permen  (atau objek palet sendiri)
S.adegan = t => { PC.langit(); const L = PC.palet().lapis, kam = { x: 30 * t, zoom: 1 + .03 * t };
  L.forEach((c, i) => PC.lapisan((i + 1) / L.length, kam, () => PC.potong(PC.bukit(930 + i * 120, 90, 1, i), c, { dalam: (i + 1) / L.length }))); };
</script>
```

## Isi pustaka (`PC.*`)

| Fungsi | Untuk |
|---|---|
| `PC.potong(path, warna, {dalam, cahaya, evenodd, tepi})` | **Inti gaya ini.** Mengisi bentuk sebagai kertas: bayangan jatuh (makin depan, makin jauh bayangannya), serat, gradasi tipis, dan tepi terang. |
| `PC.bukit`, `PC.ombak(t)`, `PC.gunung`, `PC.awan`, `PC.pohon('cemara'/'bulat')`, `PC.kota`, `PC.lingkaran`, `PC.bintang`, `PC.sinar`, `PC.perahu` | Bentuk siap pakai (hasilnya `Path2D`). Bisa juga `new Path2D('M …')` untuk bentuk sendiri. |
| `PC.bingkai('lingkaran'/'lengkung'/'kotak')` + `{evenodd: true}` | Bingkai shadow box: lembar depan berlubang, adegan terlihat dari baliknya |
| `PC.langit()` | Lapisan paling belakang, bergradasi dari palet |
| `PC.lapisan(dalam, kam, fn)` | Paralaks: lapisan depan bergeser dan membesar lebih banyak saat kamera bergerak (`kam = {x, y, zoom}`) |
| `PC.naik(k, jarak)` | Lapisan muncul dari bawah dengan pantulan kecil. Beri jeda antarlapisan, dari belakang ke depan. |
| `PC.popup(k, yEngsel, fn)` | Buku pop-up: lembar berdiri dari engsel |
| `PC.teks(teks, x, y, ukuran, {k, lapis})` | Judul dari kertas berlapis dua warna, huruf muncul berurutan |
| `PC.tokoh(fn, {dalam})` | Adriy (atau gambar lain) jadi potongan kertas berbayang |
| `PC.gaya({palet})` | GAYA siap pakai: bentuk = kertas tanpa garis tinta, latar langit, transisi adegan lama jatuh ke bawah |

## Resep supaya bagus (wajib)

1. **4–6 lapisan per adegan.** Warna lapisan berurutan dari belakang (terang, pudar seperti kabut) ke depan (gelap, jenuh). Palet bawaan sudah disusun begitu (`PC.palet().lapis`), jadi jangan mengacak urutannya.
2. **Satu arah cahaya untuk semua lapisan** (bawaan: dari kiri atas, bayangan jatuh ke kanan bawah). Lapisan depan menjatuhkan bayangan lebih jauh, dan itulah yang membuat diorama terasa dalam.
3. **Tanpa garis tinta.** Bentuk dibedakan oleh warna dan bayangan saja. Garis tipis hanya untuk detail kecil, misalnya garis ombak.
4. **Selalu ada yang bergerak pelan.** Kamera bergeser atau zoom sedikit (paralaks), awan melayang, ombak berjalan, matahari naik. Gerakan besar hanya saat lapisan masuk (`naik`, `popup`).
5. **Masuk dari belakang ke depan** dengan jeda 0,1–0,2 detik per lapisan. Untuk penutup adegan, lapisan bisa jatuh atau turun berurutan.
6. **Bingkai shadow box** (lingkaran atau lengkung) cocok untuk momen penting atau "jendela ke dunia lain".
7. **Bentuk sederhana dan bulat.** Papercut terlihat mahal karena bentuknya bersih, bukan karena detailnya banyak.
8. **Sound design:** gemerisik kertas saat lapisan masuk, "pop" untuk pop-up, dan musik lembut (kotak musik, ukulele, piano).
9. **Kotak aman:** judul `PC.teks` di y ≈ 300–400, dan caption tidak menutupi tokoh atau objek utama.

## Teknis & jebakan

- Jangan memakai `Math.random()`. Pakai `PC.R(n)`. Semua gerak harus fungsi `t`.
- **Kode yang ditulis satu baris:** jangan menyisipkan komentar `//` di tengah baris. Sisa baris akan ikut jadi komentar dan halaman gagal dimuat. Taruh komentar di akhir baris atau di baris sendiri.
- Bentuk gabungan, seperti awan yang terdiri dari banyak lingkaran, jangan diberi tepi terang (`tanpaTepi` sudah otomatis untuk `PC.awan`). Kalau diberi tepi, sambungan antarlingkaran akan terlihat.
- Isi pop-up yang menjulur ke bawah engsel otomatis dipotong. Tutup pangkalnya dengan "bibir" halaman buku yang digambar paling akhir.
- Cek dengan `node render.mjs --sheet=...` dan uji gerak lewat HyperFrames (`--start A --end B --workers 1`).
- Bisa digabung dengan gaya lain. Contohnya: angka `IG.angka` di atas langit kertas (`/infografis`), atau organ dari `/anatomi-3d` dalam bingkai shadow box.
