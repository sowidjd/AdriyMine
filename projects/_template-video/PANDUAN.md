# Template Video Adriy Project

Template Remotion siap pakai. Yang sudah otomatis:
- kanvas 1080×1920, 30 fps
- waktu adegan mengikuti narasi
- subtitle kata per kata (kata aktif berwarna amber)
- ADRIY masuk dengan pegas lalu melayang pelan
- narasi, musik CC0 (bisa ganti di tengah video), dan SFX
- volume disamakan untuk TikTok

**Yang perlu diisi hanya 2 file:** `naskah.txt` dan `src/Video.tsx`, yaitu bagian bertanda ✏️.

## Alur (perintah dijalankan Claude)

```bash
bash projects/_template-video/video.sh baru   judul-video        # 1. salin template
#    isi naskah.txt (1 baris = 1 kalimat) dan src/Video.tsx
bash projects/_template-video/video.sh suara  judul-video hasan  # 2. narasi (adriy/hasan/mia/ongky), dikirim dulu ke pemilik
bash projects/_template-video/video.sh musik  judul-video sketchbook-2024-03-30_02            # 3. musik CC0 (opsional)
bash projects/_template-video/video.sh aset   judul-video lab    # 4. salin pose/benda/SFX yang dipakai
bash projects/_template-video/video.sh cek    judul-video        # 5. 8 gambar contoh → out/cek.png
bash projects/_template-video/video.sh render judul-video        # 6. video jadi → out/judul-video.mp4
```

## Mengisi `src/Video.tsx` (untuk pemilik atau AI lain)

1. **ADEGAN.** Buat satu komponen per adegan, lalu daftarkan di `ADEGAN` sebagai `[kalimat awal, kalimat akhir, Komponen]`.
   - Setiap komponen menerima `d` (panjang adegan dalam frame) dan `t(n)` (frame mulai kalimat ke-n di dalam adegan itu).
   - Waktu cukup ditulis per kalimat. Detik pastinya mengikuti suara.
2. **SFX.** Formatnya `[kalimat, geser detik, nama file, volume]`. Daftar nama ada di `projects/DAFTAR-SFX.md` bagian 1, yaitu file di `sfx-saya/normal`.
3. **MUSIK.** Formatnya `[file, mulai kalimat ke-, volume]`.

### Bahan yang tersedia (dari `src/lib.tsx`)

| Komponen | Kegunaan |
|---|---|
| `<Kertas malam={0..1} hangat={0..1}/>` | Latar kertas gaya pensil (krem → biru tua, cahaya hangat) |
| `<Latar atas="#.." bawah="#.." titik/>` | Latar gradien polos (gaya teknologi/gelap) |
| `<Adriy pose="nama_pose" sisi="kiri/kanan" tinggi={520} at={frame}/>` | ADRIY. Nama pose sama dengan nama file di `karakter/aset/<outfit>/pose/` (tanpa .png) |
| `<Benda nama="termos" x y tinggi at goyang/>` | Gambar benda dari `objek/katalog.json` (537 benda) |
| `<Judul at top warna size>teks</Judul>` | Judul tulisan tangan besar |
| `<Label at x y warna size>teks</Label>` | Label kecil yang muncul |
| `<Muncul at style>…</Muncul>` | Membuat apa saja muncul dengan pegas |
| `<Kamera d dari ke x y>…</Kamera>` | Gerak kamera pelan (zoom/geser) |
| `filter: "url(#pensil)"` pada SVG | Garis gaya pensil yang bergetar (colored-pencil) |

### Aturan tata letak (dari `GAYA-VISUAL.md`)

- **Teks penting:** di area x 60–927, y 212–1540. Judul minimal 80 px, isi minimal 40 px.
- **Benda utama:** di area y 300–1120.
- **ADRIY:** di bawah kiri atau kanan. Tinggi ±520 untuk pose setengah badan (`setengah_*`), ±560 untuk pose seluruh badan (lebih tinggi dari itu, wajahnya tertutup subtitle).
- **Subtitle:** otomatis di y 1170–1330. Jangan taruh teks atau benda lain di area itu; teks lain maksimal sampai y 1120.
- **Ganti visual:** tiap 2–4 detik, minimal 5 emosi/pose ADRIY per video.

Contoh lengkap yang sudah jadi ada di `projects/merinding-lagu/src/` (13 adegan, gaya colored-pencil).
