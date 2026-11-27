---
name: infografis
description: >-
  Membuat motion graphic INFOGRAFIS untuk video Arfiy World: angka besar yang menghitung naik, grafik batang yang tumbuh,
  donat, grafik garis yang tergambar, piktogram "3 dari 10 orang", cincin & batang progres, perbandingan ukuran,
  garis waktu, diagram alur, ikon vektor, kata kunci, dan sumber data. Memakai projects/_bersama/infografis.js dengan
  palet yang sudah lolos uji buta warna. Pakai saat naskah berisi angka/statistik/perbandingan/proses, saat pemilik minta
  "infografis", "motion graphic data", "grafik", "chart animasi", atau gaya §9 yang dipilih infografis.
---

# Infografis (Motion Graphic Data)

Tujuannya: **satu angka atau satu perbandingan langsung dimengerti dalam 2 detik.**
Grafik ikut bercerita: grafik muncul tepat saat angkanya diucapkan, lalu bagian yang penting disorot.
Aturan `aturan.md` tetap berlaku: caption, kotak aman, nama channel, penutup, dan variasi §16. Yang paling penting di sini adalah **angka wajib bersumber (§1)**.

**Contoh lengkap:** `projects/infografis-contoh/`. Isinya angka besar, batang, donat, garis, piktogram, dan diagram alur.
**Semua angka di contoh itu data contoh, bukan fakta.** Jangan disalin ke video sungguhan.

## Memasang

```html
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/infografis.js"></script>
<script>
const GAYA = IG.gaya({ tema: 'gelap' }), WR = IG.warna();      // 'gelap' (#141B2D) | 'terang' (#FBF7EE)
const k = (id, a = 0, b = 1.4) => seg(T, t0(id) + a, t0(id) + b);  // animasi mengikuti kalimat narasi
S.adegan = t => { IG.judul('Waktu layar', 'jam per hari', { k: k('b1', -.3, .3) });
  IG.batang(DATA, { k: k('b1', .1, 1.8), satuan: ' jam', sorot: 0 }); IG.sumber('BPS 2024', { k: k('b1', .5, 1) }); };
</script>
```

Nama `C` sudah dipakai oleh `dasar.js`, jadi warna tema disimpan dengan nama lain, misalnya `WR`.
Kalau gaya video bukan infografis, cukup panggil `IG.pakai('terang')` dan pakai fungsi `IG.*` di atas GAYA video itu.

## Isi pustaka (`IG.*`)

| Fungsi | Untuk | Catatan |
|---|---|---|
| `IG.angka(nilai, x, y, ukuran, {k, label, awalan, akhiran, desimal})` | Satu angka penting | Menghitung naik, format Indonesia (12.345,6), lalu "pop" kecil di akhir |
| `IG.batang(data, {k, sorot, satuan, vertikal})` | Membandingkan jumlah | Horizontal (bawaan) paling enak dibaca di HP. `sorot` membuat batang lain redup. |
| `IG.donat(data, {k, tengah, sub})` | Bagian dari keseluruhan | **Maksimal 4 bagian.** Lebih dari itu, pakai batang. |
| `IG.garis(seri, {k, kotak, yMin, yMax, labelX, sorot})` | Perubahan dari waktu ke waktu | Garis tergambar, label di ujung garis, **satu sumbu Y saja** |
| `IG.piktogram(total, isi, {ikon, k, label})` | "3 dari 10 orang" | Paling mudah dirasakan penonton |
| `IG.cincin(persen)`, `IG.progres(persen)` | Persentase tunggal | – |
| `IG.perbandingan(data, {satuan})` | Ukuran relatif | **Luas** lingkaran sebanding nilai (bukan jari-jarinya) |
| `IG.lini(peristiwa)` | Garis waktu / sejarah | – |
| `IG.alur(simpul, sisi)` | Proses / sebab-akibat | Kotak muncul, panah tergambar |
| `IG.ikon(nama, x, y, ukuran, warna)` | Ikon vektor | orang, jam, koin, hati, air, hp, bumi, petir, piring, buku, centang, silang |
| `IG.kataKunci(teks, x, y, ukuran)` | Menekankan satu kata | Teks meluncur masuk dengan garis aksen |
| `IG.judul(judul, sub)` / `IG.sumber(teks)` | Judul + satuan / sumber data | **Wajib** di setiap grafik |

## Aturan grafik (dari skill dataviz, wajib)

1. **Pilih bentuk sesuai tugas data.** Satu angka → `angka` atau `cincin`. Perbandingan → `batang`. Bagian dari keseluruhan → `donat` atau `piktogram`. Perubahan waktu → `garis`. Proses → `alur`. Kadang jawabannya **bukan grafik**, cukup satu angka besar.
2. **Warna mengikuti identitas data, bukan peringkat.** Pakai urutan tetap palet `WR.seri[0..]`, jangan diacak. Palet ini sudah divalidasi (buta warna dan kontras) untuk kedua tema. Kalau mengganti warna, uji ulang dengan validator skill dataviz.
3. **Sorot satu hal saja.** Warnai data yang dibahas, dan redupkan sisanya (`sorot`). Yang lain berwarna abu-abu `WR.redup`.
4. **Label langsung pada data** (nilai di ujung batang atau di ujung garis), bukan legenda yang jauh. Teks memakai warna teks, bukan warna seri.
5. **Satu sumbu Y saja.** Jangan pernah membuat grafik dua sumbu. Dua ukuran berbeda → dua grafik.
6. **Batang selalu mulai dari nol.** Jangan memotong sumbu supaya perbedaannya terlihat dramatis.
7. **Judul + satuan + sumber** selalu tampil. Contoh: "Waktu layar", "jam per hari", "Sumber: …".
8. **Garis tipis, ujung batang membulat, grid samar.** Data yang menonjol, bukan hiasannya.

## Supaya enak ditonton (motion)

- **Satu grafik per kalimat narasi.** Grafik mulai muncul ±0,1 detik setelah kalimat dimulai, dan selesai sebelum kalimat berakhir.
- **Urutan munculnya:** judul → grafik tumbuh (± 1,5–2,5 detik, `ease`) → sorotan atau kata kunci → sumber.
- **Angka menghitung naik** untuk kejutan, lalu kalimat berikutnya memberi makna ("itu sama dengan …").
- **Bandingkan dengan hal sehari-hari** dengan cara gabungkan piktogram atau ikon dengan angka. Contoh: "sama dengan 3 kali nonton film".
- **Maksimal 5 batang dan 4 bagian donat** dalam satu layar HP. Selebihnya digabung jadi "Lainnya".
- **Sound design:** "tik-tik" saat angka menghitung, "whoosh" kecil saat batang tumbuh, dan "ding" saat sorotan muncul.
- Grafik bisa digabung dengan gaya lain. Contohnya grafik di atas kertas kolase (`/mixed-media`), atau angka di samping organ 3D (`/anatomi-3d`).

## Larangan

- **Angka karangan.** Semua angka di video sungguhan harus dicek ke sumber terpercaya, dan sumbernya ditulis di layar dan di `NASKAH.md`.
- Memakai data contoh dari `projects/infografis-contoh/` untuk video sungguhan.
- Grafik 3D miring, pie dengan lebih dari 4 bagian, dua sumbu Y, sumbu yang dipotong, dan warna pelangi.
- Teks di luar kotak aman (x 60–927, y 212–1540).

## Cek hasil

1. Ambil gambar contoh dengan `node render.mjs --sheet=...`. Periksa label tidak bertabrakan, teks tidak keluar kotak aman, dan angka sumbu tepat.
2. Uji gerak dengan potongan pendek lewat HyperFrames (`projects/hyperframes/README.md`).
3. Nilai dengan `/elemen-konten`, terutama elemen 5 (curiosity gap: tunda angka besarnya) dan elemen 7 (visual menjelaskan).
