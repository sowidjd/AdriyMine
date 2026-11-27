---
name: documentary
description: >-
  Membuat video Arfiy World bergaya DOKUMENTER: geser & zoom pelan pada gambar (Ken Burns), tampilan film arsip
  (sepia, butiran, goresan, debu, kedip, goyang proyektor), letterbox sinematik, lower third (nama & keterangan),
  kartu tanggal & tempat, teks mesin ketik, kartu bab, kartu kutipan bersumber, dokumen dengan sorotan, peta ilustrasi
  dengan pin & rute, cahaya bocor, dan label ILUSTRASI/REKONSTRUKSI. Memakai projects/_bersama/dokumenter.js. Pakai
  untuk kisah sejarah, penemuan, tokoh, peristiwa nyata, misteri, atau saat pemilik minta "documentary", "dokumenter",
  "gaya film sejarah", atau gaya §9 yang dipilih dokumenter.
---

# Documentary

Gaya **dokumenter**: tenang, berwibawa, dan terasa nyata. Kekuatannya ada di **cerita yang berlapis**: kapan, di mana, siapa, lalu apa yang terjadi dan kenapa itu penting.
Gaya ini **paling menuntut kejujuran.** Penonton percaya bahwa yang ditampilkan itu nyata, jadi jangan pernah menipu mereka.
Semua aturan `aturan.md` tetap berlaku: cek fakta §1, caption, kotak aman, nama channel, penutup, variasi §16, dan Adriy §15.

**Contoh lengkap:** `projects/documentary-contoh/`. Isinya kisah penemuan penisilin: Ken Burns pada ilustrasi laboratorium, kartu "1928 · London", lower third "Alexander Fleming", cawan berjamur, kartu bab, dan kutipan.

## Memasang

```html
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/dokumenter.js"></script>
<script>
const GAYA = DOK.gaya({ nada: 'arsip' });              // 'arsip' (film lama) | 'modern' (gelap sinematik); letterbox otomatis
const LAB = () => DOK.gambar('lab', 1600, 2600, (w, h) => { /* gambar ilustrasi sekali */ });
S.adegan = t => { ctx.save(); DOK.goyangGerbang(t);
  DOK.kenBurns(LAB(), [0, 0, 1600, 2600], [500, 900, 1000, 1500], seg(t, 0, t1('b2')));
  DOK.filmLama(t); ctx.restore();                      // sepia & goresan HANYA untuk gambar, sebelum Adriy & caption
  DOK.label('ILUSTRASI'); DOK.kartuTanggal(1928, 'London, Inggris', { k }); };
</script>
```

## Isi pustaka (`DOK.*`)

| Fungsi | Untuk |
|---|---|
| `DOK.kenBurns(gambar, kotakAwal, kotakAkhir, k)` | Gerak khas dokumenter: zoom dan geser pelan pada gambar diam |
| `DOK.gambar(kunci, w, h, fn)` | Ilustrasi buatan kode, dibuat sekali lalu disimpan di cache |
| `DOK.foto(src)` + `await DOK.siap()` | Foto **milik pemilik sendiri / CC0 / domain publik** (catat sumbernya) |
| `DOK.filmLama(t, {kuat, sepia})`, `DOK.goyangGerbang(t)` | Tampilan film arsip: sepia, butiran, goresan, debu, kedip, dan goyang proyektor |
| `DOK.letterbox`, `DOK.cahayaBocor` | Bingkai sinematik dan cahaya hangat yang bocor |
| `DOK.kartuTanggal(tahun, tempat, {k})` | Membuka cerita: "1928" besar dengan tempat diketik |
| `DOK.lowerThird(nama, keterangan, {k, keluar})` | Memperkenalkan tokoh, tempat, atau benda |
| `DOK.ketik(teks, x, y, ukuran, k)` | Teks mesin ketik dengan kursor berkedip |
| `DOK.babak(nomor, judul, {k, keluar})` | Kartu bab, untuk membagi cerita panjang |
| `DOK.kutipan(teks, sumber, {k})` | Kartu kutipan. **Tidak bisa dipakai tanpa sumber.** |
| `DOK.dokumen(x, y, w, h, {judul, sorot, cap})` | Kertas dokumen dengan baris yang disorot. Barisnya hanya garis samar, bukan tulisan asli. |
| `DOK.peta(x, y, w, h, {titik, rute, daratan})` | Peta **ilustrasi** (skematis) dengan pin jatuh dan rute putus-putus. Labelnya otomatis "peta ilustrasi, bukan skala". |
| `DOK.label('ILUSTRASI' / 'REKONSTRUKSI' / 'ARSIP: sumber')` | Label kejujuran visual |

## Kejujuran (wajib, tanpa kecuali)

1. **Semua gambar buatan sendiri diberi label `ILUSTRASI` atau `REKONSTRUKSI`.** Efek film lama tidak boleh membuat ilustrasi tampak seperti foto arsip asli.
2. **Foto atau video arsip asli** hanya boleh dipakai kalau memang **domain publik, CC0, atau milik pemilik**. Tampilkan `DOK.label('ARSIP: <sumber>')` dan catat sumbernya di `NASKAH.md`. Kalau ragu soal hak ciptanya, pakai ilustrasi.
3. **Jangan pernah mengarang kutipan tokoh nyata.** Kutipan harus bisa ditelusuri (buku, arsip, wawancara) dan sumbernya ditulis. Kutipan yang sering beredar tapi tidak jelas asalnya jangan dipakai. Kalau perlu kalimat penutup, tulis dengan suara kita sendiri, misalnya "— Arfiy World".
4. **Tanggal, tempat, nama, dan jabatan dicek ke minimal 2 sumber** (aturan §1). Lower third harus tepat.
5. **Peta:** untuk tempat nyata, pakai gambar peta berlisensi lewat `DOK.foto` dengan atribusi (misalnya OpenStreetMap: "© kontributor OpenStreetMap"). `DOK.peta` hanya untuk peta skematis, dan labelnya jangan dihapus.
6. **Rekonstruksi peristiwa** (misalnya Adriy memerankan ulang) harus jelas terlihat sebagai rekonstruksi. Jangan mencampurnya dengan arsip tanpa label.

## Resep supaya terasa dokumenter

1. **Struktur cerita:** kartu tanggal dan tempat → perkenalan tokoh (lower third) → momen kejutan → dampak hingga hari ini. Cerita tetap mengikuti alur §12: masalah dan pertanyaan dulu, baru jawaban.
2. **Ken Burns yang pelan dan terarah.** Zoom 10–35% selama 3–6 detik menuju detail yang sedang dibicarakan, misalnya wajah, benda, atau tulisan. Satu gambar untuk satu kalimat.
3. **Tempo tenang.** Narasi lebih lambat (*calm, measured, documentary narrator*), dengan jeda sebelum fakta besar dan musik rendah (piano, strings, drone).
4. **Warna:** sepia atau hitam-putih untuk masa lalu, warna penuh untuk masa kini. Pergantian dari sepia ke warna adalah momen "sampai hari ini".
5. **Adriy tetap berwarna penuh** dan tidak boleh disepia (§15). Panggil `DOK.filmLama` sebelum Adriy dan caption digambar. Peran Adriy di sini adalah "penonton yang ikut kagum": kecil, di pojok, dan bereaksi.
6. **Teks:** tahun dan judul memakai serif, keterangan memakai Fredoka. Maksimal satu lower third sekaligus, dan lower third hilang setelah 2–3 detik.
7. **Sound design:** desis proyektor film, ketukan mesin ketik, "boom" rendah untuk kartu tanggal, dan suasana tempat (hujan, kota, laboratorium).

## Teknis

- Gambar ilustrasi dibuat sekali (`DOK.gambar`, cache). Ken Burns hanya memotong dan menskalakan gambar itu, jadi ringan.
- Fade-out elemen memakai `keluar: k('id', a, b)` (0..1), bukan memotong `k`.
- Jangan memakai `Math.random()`. Pakai `DOK.R(n)` atau `hash(n)`.
- Jangan menyisipkan komentar `//` di tengah baris kode satu baris.
- Cek dengan `node render.mjs --sheet=...` dan uji gerak lewat HyperFrames (`--start A --end B --workers 1`).
- Bisa digabung dengan gaya lain: angka sejarah dengan `/infografis`, luar angkasa dengan `/cosmic-motion`, organ dengan `/anatomi-3d`, diberi bingkai film dokumenter.
