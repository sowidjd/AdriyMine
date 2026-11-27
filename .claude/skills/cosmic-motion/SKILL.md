---
name: cosmic-motion
description: >-
  Membuat adegan luar angkasa 3D sinematik untuk video Arfiy World: bintang berkelip, nebula, planet bertekstur
  (bumi berawan, bulan, mars, jupiter, saturnus bercincin, planet es/lava), matahari bercahaya, tata surya & orbit,
  sabuk asteroid, komet, galaksi spiral, lubang hitam, lompatan warp, kamera melayang mulus, dan label. Memakai
  projects/_bersama/kosmik3d.js (Three.js). Pakai saat video bertema luar angkasa/astronomi/fisika semesta, saat
  pemilik minta "cosmic motion", "animasi luar angkasa", "planet 3D", "galaksi", atau gaya §9 yang dipilih kosmik.
---

# Cosmic Motion

Adegan antariksa 3D digambar ke kanvas 2D video kita. Caption, Adriy, stempel nama akun, kartu penutup, dan semua aturan `aturan.md` tetap berlaku.
Semua gerak adalah **fungsi waktu `t`**, jadi aman dirender dengan `render.mjs` maupun HyperFrames (`projects/hyperframes/README.md`).

**Contoh lengkap:** `projects/cosmic-motion-contoh/`. Isinya bintang + nebula, Bumi + Bulan, tata surya, Saturnus, galaksi Bima Sakti, lubang hitam, dan warp.

## Memasang

```html
<script src="../_bersama/lib/three-0.159.min.js"></script>
<script src="../_bersama/dasar.js"></script>
<script src="../_bersama/kosmik3d.js"></script>
<script>
const K = Kosmik3D();
const bintang = K.bintang({ jumlah: 9000 }), nebula = K.nebula({ jarak: 55, terang: .75 });
K.cahayaMatahari([-6, 2, 5], 3.2);                       // cahaya untuk adegan satu planet
const bumi = K.planet('bumi', { radius: 1.6 }); K.scene.add(bumi);
S.adegan = t => { bumi.putar(t, 30); K.kamera(t, KUNCI); K.gambar(ctx, t); K.label(ctx, bumi, undefined, 'Bumi', { k }); };
</script>
```

## Isi pustaka

| Fungsi | Hasil | Gerak / pilihan |
|---|---|---|
| `K.bintang({jumlah, radius, putar})` | Bola bintang berkelip, warna suhu beragam | Berkelip dan berputar sendiri |
| `K.nebula({warna, jumlah, terang, jarak})` | Awan warna lembut (aditif) | Berputar pelan |
| `K.planet(jenis, {radius, benih, awan, cincin, atmosfer, resolusi})` | Jenis: `bumi` (awan + atmosfer), `bulan`, `mars`, `jupiter` (bintik merah), `saturnus` (cincin), `es`, `lava`, `matahari` (cahaya + glow) | `.putar(t, detikPerPutaran)` |
| `K.cahayaMatahari(arah, kuat)` | Cahaya terarah dan lampu isi biru | – |
| `K.garisOrbit(r)` + `K.diOrbit(obj, r, t, periode, fase)` | Garis orbit dan posisi benda di orbit | – |
| `K.asteroid({r0, r1, jumlah})` | Sabuk asteroid batu (instanced) | Otomatis |
| `K.komet()` | Kepala bercahaya dan ekor partikel | `.perbarui(t, arahEkor)`: ekor selalu menjauhi Matahari |
| `K.galaksi({jumlah, radius, lengan: 2})` | Galaksi spiral 2 lengan, inti, dan cakram | `.perbarui(t)`: berputar pelan |
| `K.lubangHitam({radius, miring})` | Piringan akresi berputar dan cincin cahaya | `.perbarui(t)` |
| `K.warp()` | Garis bintang melesat (lompatan) | `.perbarui(t, k)` dengan `k` 0..1 |
| `K.kamera(t, kunci)` | Kamera mulus lewat spline (sama dengan anatomi-3d) | – |
| `K.label(...)` / `K.keLayar(...)` | Label 2D menempel ke benda 3D | Label tidak digambar kalau titiknya di luar layar |

Planet dengan `benih` berbeda punya pola permukaan yang berbeda. Untuk planet kecil di tata surya, pakai `resolusi: 256` supaya ringan.

## Supaya sinematik & mulus (wajib)

1. **Kamera tidak pernah diam.** Tiap adegan punya 2–3 kunci kamera: mendekat pelan, melayang ke samping, atau turun dari atas. Gerakan besar (menyelam, warp) hanya di momen penting.
2. **Satu bintang utama per adegan.** Contohnya satu planet, satu galaksi, atau satu lubang hitam. Latar bintang dan nebula hanya sebagai suasana.
3. **Skala sebagai kejutan:** mulai dekat lalu tarik mundur ("Bumi → tata surya → galaksi"), atau sebaliknya pakai warp. Pola ini cocok untuk elemen Retention dan Curiosity Gap.
4. **Cahaya:** satu sumber utama (Matahari) dan sisi gelap planet tetap gelap. Glow hanya untuk benda yang memang bercahaya.
5. **Pergantian adegan:** larut halus, atau warp (`k` naik 0→1 di akhir adegan lama).
6. **Label dan judul** muncul tepat saat kata diucapkan. Maksimal 2 label, dan semua teks ada di kotak aman.
7. **Sound design:** desis lembut atau dengung (drone) untuk ruang angkasa, "whoosh" saat warp, dan hening sesaat sebelum fakta besar.

## Fakta & kejujuran visual

- Ukuran dan jarak di tata surya mini **tidak sesuai skala**. Kalau penting untuk cerita, sebutkan di narasi ("kalau digambar sesuai skala, Bumi cuma setitik debu").
- Angka (jumlah bintang, jarak, umur) **wajib dicek ke sumber** (aturan §1). Visual tidak boleh menyiratkan fakta yang salah, misalnya ekor komet harus selalu menjauhi Matahari.
- Galaksi memakai 2 lengan yang lebar. **Jangan** membuat bentuk 4 lengan bersudut tajam, karena bisa terlihat seperti simbol yang tidak pantas.

## Teknis

- Jangan memakai `Math.random()`, `Date.now()`, atau `requestAnimationFrame`. Pakai `K.hs(n)` untuk acak berbenih.
- **Shader GLSL** di `kosmik3d.js` ditulis satu baris. Jangan menyelipkan komentar `//` di dalamnya, karena sisa baris ikut jadi komentar dan objeknya hilang dari layar.
- Tekstur planet dibuat sekali saat halaman dimuat dan disimpan di cache. Untuk banyak planet, kecilkan `resolusi`.
- Mengecek hasil: `node render.mjs --sheet=...` untuk gambar contoh. Untuk uji gerak, render potongan pendek lewat HyperFrames: `--start A --end B --workers 1`.
- Butuh tokoh? Adriy 2D (`adriy(x, y, u, {...})` dari `dasar.js`) bisa ditaruh di atas adegan 3D. Posisinya bisa diambil dari `K.keLayar()` supaya Adriy tampak berdiri di samping planet.
