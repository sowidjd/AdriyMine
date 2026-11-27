---
name: kinetic-typography
description: >-
  Membuat video Arfiy World bergaya KINETIC TYPOGRAPHY: kata-kata narasi muncul dan bergerak mengikuti irama suara,
  kata penting dibuat besar, kapital, berwarna, disorot dan bergetar; gaya masuk bergilir (pop, naik, tumbuk, putar,
  geser, ketik, lebar); mode satu kalimat per layar atau kalimat menumpuk dengan kamera mengikuti. Memakai
  projects/_bersama/kinetik.js. Pakai saat pemilik minta "kinetic typography", "teks bergerak", "tipografi animasi",
  "lyric style", atau gaya §9 yang dipilih tipografi; juga untuk hook dan kalimat kejutan di gaya lain.
---

# Kinetic Typography

Gaya **kata-kata yang menari mengikuti suara**. Narasi tampil di layar kata demi kata, tepat saat diucapkan, dengan ukuran, warna, dan gerak yang menunjukkan **mana yang penting**.
Penonton tetap paham walau suara HP dimatikan. Karena itu gaya ini kuat untuk hook, pernyataan mengejutkan, dan kesimpulan.
Semua aturan `aturan.md` tetap berlaku: kotak aman, nama channel, penutup, variasi §16, dan ejaan §14.

**Contoh lengkap:** `projects/kinetic-typography-contoh/`. Isinya mode `ganti` dengan gaya masuk bergilir, lalu mode `tumpuk`.

## Memasang

```html
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/kinetik.js"></script>
<script>
const GAYA = KT.gaya();               // latar gradasi bergerak; caption bawaan DIMATIKAN (teks sudah tampil besar)
GROUPS = [['buka', ['h1', 'h2']], ...];
S.buka = t => KT.jalankan(['h1', 'h2'], t, { mode: 'ganti', gaya: ['pop', 'naik'] });
</script>
```

Kata yang ditekankan ditandai di `timeline.json` dengan tanda bintang, sama seperti caption biasa: `"Jantungmu berdetak *seratus ribu* kali."`

## Isi pustaka (`KT.*`)

| Fungsi | Untuk |
|---|---|
| `KT.jalankan(ids, t, {mode, gaya, ukuran, masukTekan, tahan})` | **Pengatur utama.** Mode `'ganti'`: satu kalimat per layar, kalimat lama terbang ke atas. Mode `'tumpuk'`: kalimat menumpuk ke bawah, kamera mengikuti, kalimat lama meredup. |
| `KT.kalimat(id, t, {x, y, ukuran, masuk, keluar})` | Satu kalimat sebagai blok (untuk adegan campuran, misalnya hook di atas gambar 3D) |
| `KT.kataBaris(id)` | Waktu tiap kata. Kalau `timeline.json` punya `kata: [{w, t0, t1}]` (misalnya dari Whisper), dipakai apa adanya. Kalau tidak ada, diperkirakan dari jumlah suku kata dan tanda baca. |
| `KT.MASUK` | Daftar gaya masuk: `pop`, `naik`, `tumbuk`, `putar`, `geser`, `ketik`, `lebar` |
| `KT.tema({...})` / `KT.gaya({tema, caption})` | Warna: latar, teks, aksen, dan sorotan. `caption: true` kalau caption bawaan tetap mau ditampilkan. |

Kata yang ditekankan otomatis jadi **kapital, lebih besar, berwarna aksen, dengan kotak sorotan dan getaran kecil**, dan masuk dengan gaya `tumbuk` (atur dengan `masukTekan`).

## Resep supaya bagus (wajib)

1. **Tekankan 1–2 kata per kalimat.** Kalau semua ditekankan, tidak ada yang terasa penting. Pilih kata yang membawa emosi, angka, atau kejutan.
2. **Gilir gaya masuk antarkalimat** (`gaya: ['pop', 'naik', 'geser', ...]`) supaya tidak monoton. Tetap satu gaya per kalimat.
3. **Kalimat pendek** (≤ 12 kata, §14) akan menjadi 2–4 baris besar. Kalimat panjang terlihat seperti paragraf, jadi pecah di naskah.
4. **Sinkron dengan suara.** Hasil terbaik didapat dengan waktu per kata dari Whisper, karena `projects/suara` sudah memakai ASR. Perkiraan suku kata cukup untuk draf. Cek dengan gambar contoh di tengah kalimat.
5. **Ritme visual:** mode `ganti` untuk hook dan kalimat kejutan (cepat dan tegas), mode `tumpuk` untuk daftar atau rangkuman (membangun).
6. **Jangan semua video penuh teks.** Untuk video 3 menit, pakai kinetic typography di hook, momen kejutan, dan rangkuman, lalu gabungkan dengan gaya visual lain (§9). Adriy tetap muncul dan bereaksi (§15).
7. **Kotak aman:** blok teks di y ±300–1300 dan x 90–990 (lebar maksimal 900). Adriy dan objek lain jangan menutupi teks.
8. **Sound design:** "pop" atau "tick" halus per kata yang ditekankan (jangan setiap kata), "whoosh" saat kalimat berganti, dan "boom" kecil saat kata `tumbuk` mendarat.

## Teknis

- Hasil tata letak dan waktu kata disimpan di cache per kalimat (ringan). Kalau `timeline.json` berubah, muat ulang halaman.
- `KT.gaya()` menyalakan `window.TANPA_CAPTION` supaya caption bawaan `dasar.js` tidak dobel. Kalau kinetic typography hanya dipakai di sebagian adegan, jangan pakai `KT.gaya`. Panggil `KT.kalimat` di adegan itu dan atur `window.TANPA_CAPTION` sesuai kebutuhan.
- Jangan memakai `Math.random()`. Pakai `KT.R(n)`.
- Jangan menyisipkan komentar `//` di tengah baris kode satu baris.
- Cek dengan `node render.mjs --sheet=...`, lalu uji gerak lewat HyperFrames (`--start A --end B --workers 1`).
