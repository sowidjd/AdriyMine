---
name: anatomi-3d
description: >-
  Membuat adegan anatomi tubuh 3D yang mulus dan menarik (jantung berdetak, paru bernapas, lambung & usus
  bergerak, otak, aliran darah/udara/makanan, belahan, sinar-X, label) untuk video Arfiy World, memakai
  projects/_bersama/anatomi3d.js (Three.js). Pakai saat video membahas tubuh manusia / organ / kesehatan,
  saat pemilik minta "anatomi 3D", "organ 3D", "animasi 3D tubuh", atau gaya animasi §9 yang dipilih adalah 3D anatomi.
---

# Anatomi 3D

Adegan 3D digambar ke kanvas 2D video kita. Caption, Adriy, stempel nama akun, kartu penutup, dan aturan `aturan.md` tetap berjalan seperti biasa.
Semua gerak adalah **fungsi waktu `t`**, jadi hasilnya aman dirender dengan `render.mjs` maupun HyperFrames (`projects/hyperframes/README.md`).

**Contoh lengkap:** `projects/anatomi-3d-contoh/` berisi jantung dan aliran darah, jantung dibelah, paru-paru dengan bronkus sinar-X, lambung dan usus, serta otak.
Salin pola dari sana.

## Memasang

```html
<script src="../_bersama/lib/three-0.159.min.js"></script>   <!-- Three.js r159, MIT, sudah ada di repo -->
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/anatomi3d.js"></script>
<script>
const A3 = Anatomi3D({ gaya: 'basah' });            // 'basah' (mengkilap) | 'clay' (matte pastel) | 'kaca' (tembus)
const jantung = A3.jantung(); A3.scene.add(jantung);
S.adegan = t => { jantung.detak(t); A3.kamera(t, KUNCI); A3.gambar(ctx, t); A3.label(ctx, jantung, jantung.titik.aorta, 'Aorta', { k }); };
</script>
```

Latar video digambar di `GAYA.bg`. Kanvas 3D transparan dan ditumpuk di atasnya.

## Isi pustaka

| Organ | Gerak | Titik label (`.titik`) |
|---|---|---|
| `A3.jantung()` | `.detak(t, bpm)` irama lub-dub | aorta, bilikKiri, serambiKanan, venaKava, arteriParu, apeks |
| `A3.paru()` + pohon bronkus | `.napas(A3.napas(t, perMenit))`, `.tembus(k)` | trakea, paruKanan, paruKiri, bronkus |
| `A3.lambung()` + kerongkongan | `.gerak(t)` gelombang peristaltik | kerongkongan, fundus, pilorus, badan |
| `A3.usus()` halus + besar | `.gerak(t)` | ususHalus, ususBesar, usus12 |
| `A3.otak()` + otak kecil + batang | putar dengan `rotation` | depan, belakang, otakKecil, batang, atas |

**Alat bantu:**
- `A3.aliran(kurva, {jenis: 'darah'|'udara'|'makanan', jumlah, laju, sebar})`: partikel yang mengalir di sepanjang kurva. Tambahkan sebagai anak organ.
- `A3.potong(grup, k)`: belahan. Bidang potong bergerak dari depan dengan `k` 0..1.
- `A3.tembus(grup atau mesh, k)`: efek sinar-X. Pakai pada pembuluh atau lambung supaya aliran di dalamnya terlihat.
- `A3.urai(grup, k)`: tampilan terurai (bagian-bagian bergeser menjauh).
- `A3.sorot(grup, mesh, k)`: satu bagian menyala, bagian lain meredup.
- `A3.kamera(t, [[detik, {pos, lihat, fov}], …])`: kamera bergerak mulus lewat spline. Gerakannya menyambung tanpa berhenti-mulai, dan halus di awal dan akhir.
- `A3.label(ctx, obj, titik, 'Teks', {k, x, y})`: label 2D dengan garis penunjuk ke titik 3D. Posisinya otomatis dijaga di dalam kotak aman.
- `A3.keLayar(obj, titik)`: titik 3D diubah jadi piksel. Gunanya untuk menaruh Adriy atau tag `dasar.js` tepat di samping organ.
- `A3.bayangan(y, r, a)`: bayangan kontak lembut di bawah organ.
- `A3.WARNA`: warna baku organ. Pakai warna yang sama di semua video: arteri merah, vena biru, paru merah muda.

## Supaya mulus & menarik (wajib)

1. **Satu organ utama per adegan.** Lebih baik menyelam ke dalam satu organ daripada memutar banyak organ.
2. **Kamera selalu bergerak pelan** dengan 2–3 kunci per adegan: dorong masuk, geser, atau naik. Gerakan besar hanya di momen penting. Jangan berputar-putar tanpa tujuan.
3. **Organ "hidup" sejak frame pertama:** jantung berdetak, paru bernapas, usus bergelombang, dan organ bergoyang pelan (`rotation.y = a * Math.sin(t * .4)`).
4. **Visual menjelaskan isi narasi** (elemen 7): saat narasi menyebut "aorta", aorta dibuat tembus dan darahnya terlihat mengalir. Saat narasi menyebut "dibelah", pakai `potong`.
5. **Label muncul tepat saat kata diucapkan.** Pakai `k = seg(t, t0('id') + jeda, …)`. Maksimal 2 label sekaligus, dan teksnya ≤ 2 kata.
6. **Pergantian adegan:** larut halus (`GAYA.trans`), atau kamera menyelam lalu adegan baru dimulai dari jauh.
7. **Cahaya:** lampu utama hangat dari kiri atas dan lampu tepi dingin dari belakang (sudah bawaan). Latar gelap hangat membuat organ menonjol.
8. **Kotak aman:** organ utama berada di y ±300–1400, dan judul atau caption tidak menutupi bagian penting.

## Larangan

- Tidak boleh gore atau darah berlebihan. Gaya yang dipakai: edukatif, bersih, dan ramah anak muda.
- Bentuk organ tidak boleh dikarang demi gaya kalau bertentangan dengan fakta. Arteri merah, vena biru, dan arteri paru boleh biru (sesuai konvensi buku anatomi).
- Jangan memakai `Math.random()`, `Date.now()`, atau `requestAnimationFrame` di adegan. Pakai `A3.hs(n)` untuk acak berbenih.
- Jangan memakai model 3D unduhan dengan lisensi tidak jelas. Organ di pustaka ini dibuat dari kode, jadi milik kita sepenuhnya.

## Menambah organ baru

Tulis fungsi `A.namaOrgan = (o) => { … return grup; }` di `anatomi3d.js`. Ada dua cara membentuknya:
- `bolaBentuk(f)`: bola yang dibentuk ulang. Cocok untuk organ padat seperti ginjal, hati, atau bola mata.
- `tabung(kurva, radius(s, t))`: tabung yang jari-jarinya bisa berubah dan dianimasikan. Cocok untuk pembuluh, saluran, atau tulang panjang.

Lengkapi organ baru dengan `.titik` (untuk label) dan fungsi geraknya. Setelah itu tambahkan adegan ujinya di `projects/anatomi-3d-contoh/`.

## Cek hasil

1. `node render.mjs --sheet=2,5,8,…` lalu lihat gambar contohnya. Periksa framing, label, dan pastikan tidak ada bagian yang mencuat.
2. Uji kelancaran gerak dengan render potongan pendek lewat HyperFrames: `--start 1 --end 6 --workers 1`. Render penuh memakai WebGL cukup berat, jadi render per bagian atau dengan satu worker.
3. Jalankan checklist `aturan.md` dan nilai video dengan `/elemen-konten`.
