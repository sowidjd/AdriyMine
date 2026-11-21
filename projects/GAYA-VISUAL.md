# Gaya Visual Adriy Project (acuan animasi)

Ringkasan gaya & aturan visual untuk video TikTok Adriy Project. Bisa diberikan ke AI lain atau editor sebagai acuan membuat animasi (Remotion/Canvas).
Sumber: `aturan.md` §4–§9, §15, ditambah tata letak yang terbukti di video *Magnet Bedah*.

---

## 1. Kanvas & teknis

- Ukuran **1080 × 1920** (vertikal), **30 fps**.
- Durasi standar **2:34–2:56**; 1 kalimat narasi ≈ 4–6 detik; visual berganti tiap **2–4 detik**.
- Render di server tanpa GPU: hindari efek berat (blur besar, ratusan partikel). Uji 3 frame dulu; kalau > 2 detik/frame, sederhanakan.

## 2. Area aman (wajib)

| Bagian | Aturan |
|---|---|
| Atas | teks penting mulai **y ≥ 212** |
| Kanan | mulai y ≥ 803, teks/objek penting di **x < 927** (tombol like/komentar) |
| Bawah | teks penting di **y ≤ 1540** |
| **Kotak aman teks** | **x 60–927, y 212–1540** |
| Caption narasi | paling aman di **y 1300–1500** |

- Judul/hook **≥ 80 px tebal**; teks isi **≥ 40 px**.

## 3. Tipografi & teks

- Huruf tebal sans-serif (contoh: Arial/Inter/Montserrat, weight 800–900).
- Judul adegan: 2–3 baris pendek, **satu kata kunci diberi warna aksen** (contoh: KENAPA / **MAGNET** / BISA MENARIK?).
- Subtitle: putih, 40–44 px, tebal 800, di atas **pita gelap transparan** (`rgba(2,8,20,.72)`, sudut membulat 28 px), supaya tetap terbaca walau menimpa tokoh.
- Nama akun di layar ditulis **ADRIY.PROJECT**; di narasi diucapkan "Adriy Project".
- Teks tidak boleh menumpuk dengan teks lain; gaya yang banyak teks dipakai hati-hati.

## 4. Tokoh ADRIY

- Pemuda semi-realistis: **rambut hitam ikal pendek, kacamata hitam persegi, tulisan ADRIY di baju, jam tangan hitam.** Ciri ini tidak boleh diubah, wajah tidak boleh dibuat ulang dengan AI.
- Pakai **PNG pose apa adanya** (latar transparan) dari repo privat aset; boleh digeser, diperbesar, diberi bayangan, dibalik kiri-kanan bila tulisan ADRIY tidak terbaca terbalik.
- **Outfit sesuai topik** (satu per video):

| Outfit | Topik |
|---|---|
| Santai | kebiasaan sehari-hari, digital, psikologi, waktu (default) |
| Travel | perjalanan, tempat, budaya |
| Arkeolog | sejarah, alam liar, ekspedisi |
| Formal | uang, ekonomi, bisnis |
| Astronot | luar angkasa |
| Penyelam | laut & hewan laut |
| Jas lab | sains, kimia, biologi, tubuh |

- **Ukuran & posisi (pose seluruh badan):** tinggi **± 760 px**, kaki di dasar layar (`bottom: 0`), di sisi kiri atau kanan (jarak 10 px dari tepi). Jangan pakai `width: 650` untuk pose seluruh badan: tokoh jadi ±1.350 px dan menutupi judul & benda utama.
- Benda utama (magnet, grafik, kotak penjelasan) di area **y 560–1200**, supaya tidak tertutup tokoh.
- Gerak tokoh: masuk dengan pegas (spring, damping 15), lalu melayang pelan (±8 px).

## 5. Ekspresi & akting

- ADRIY **berakting**, bukan berdiri diam: setiap adegan punya emosi jelas, minimal **5 emosi berbeda** per video.
- Pergantian emosi dengan "take" (badan menyusut lalu memantul), bukan ganti wajah tiba-tiba.
- **Sebab dulu, baru reaksi.**
- Tanda emosi bergambar (!, ?, keringat, lampu ide, hati), bukan tulisan.
- Pilihan pose: pikir/bingung (penasaran), tangan terbuka (menjelaskan), tunjuk (menunjukkan), kaget, jempol/eureka (penutup, yakin).

## 6. Suasana, warna & cahaya

| Bagian video | Suasana | Warna | Musik |
|---|---|---|---|
| Masalah | tegang/kacau | redup, dingin | minor/sepi |
| Penjelasan | penasaran | netral/terang | ringan |
| Solusi/trik | semangat | cerah | berdrum |
| Penutup | hangat, lega | oranye/kuning | manis |

- Cahaya mengikuti emosi: gelap/dingin saat masalah → terang/hangat saat solusi.
- Perubahan cahaya bertahap (0,5–2 detik), kecuali kejutan (kilat, lampu menyala).
- Sumber cahaya jelas (jendela, lampu, layar HP). Minimal **2 pergantian cahaya** per video; momen terpenting paling terang/kontras.
- Contoh palet sains (Magnet Bedah): latar radial `#17345c → #07111f → #02050c`, aksen biru `#60a5fa`, merah `#dc2626`, partikel `#93c5fd`.

## 7. Latar

- Latar menceritakan konteks yang dekat dengan penonton Indonesia (kamar, dapur, warung, angkot, kasir minimarket).
- Detail kecil yang relatable: charger kusut, gelas kopi, kipas angin, rice cooker, sandal jepit.
- Minimal **3 latar/komposisi berbeda** per video.
- Latar tidak boleh mengalahkan tokoh: ADRIY selalu kontras.

## 8. Memilih gaya animasi

Gaya harus **ikut bercerita**, bukan sekadar keren.
1. Cari **metafora inti** judul ("kalau digambar, seperti apa?").
2. Pilih gaya yang bahasa visualnya = metafora itu.
3. Tulis 1 kalimat: *"Gaya X dipilih karena ___ di judul terlihat sebagai ___."* Kalau tidak bisa, gayanya salah.
4. Cocokkan dengan emosi utama; jangan sama dengan video sebelumnya.

| Kategori | Gaya yang cocok |
|---|---|
| Otak & kebiasaan | Whiteboard, Sketchnote, Flat Vector, Isometric |
| HP & fokus | Sci-fi HUD, Liminal/Backrooms, CRT ASCII |
| Chat & sosial | Stick-figure, Manga Panels, Mid-century Cartoon |
| Perasaan & pikiran | Paper-cut, Watercolor, Crayon, Double Exposure |
| Uang & belanja | Microgame, Pop Art, Spreadsheet Film |
| Waktu & produktivitas | Countdown Split-screen, Flat cartoon, Swiss Motion |
| Alam & hewan | Watercolor, Colored-pencil, Ukiyo-e, Woodcut |
| Tubuh & kesehatan | Colored-pencil Science, Isometric, Line-art Cutaway |
| Sains sehari-hari | **Exploded Teardown**, Blueprint, Scale Zoom |
| Sejarah | 1920s Newsreel, Halftone Dossier, Vintage Engraving |
| Teknologi | Dark Tech Keynote, Circuit Board, CRT ASCII |

**Dilarang:** gaya seram untuk tema lucu/anak; gaya imut untuk uang serius/fakta teknis; gaya "zaman dulu" untuk HP/internet (kecuali sengaja lucu); gaya teknis dingin (Blueprint, HUD) untuk tema perasaan.

## 9. Benda & efek suara

- Benda: gambar PNG transparan dari `aset/objek/benda/` (537 benda, cari lewat kata di `objek/katalog.json`).
- Efek suara di setiap kejadian penting, tidak menutupi narasi.
- Musik hanya **CC0** (`repos/video-background-music`) atau buatan sendiri; tidak boleh lagu populer, Suno/Udio, atau CC-BY tanpa kredit.

## 10. Struktur video (dari skill skrip)

Hook (kalimat pertama, tanpa salam) → pengenalan akun ("Di Adriy Project, …") → isi (Relate → Patahkan → Bawa kembali) → ajakan di tengah (simpan/komentar) → penutup → **CTA: "Follow Adriy Project, …"** → "Explore More, Know More."

## Checklist cepat

- [ ] 1080×1920, teks di kotak aman x 60–927, y 212–1540
- [ ] ADRIY asli, outfit sesuai topik, tinggi ±760 px, tidak menutupi benda utama
- [ ] ≥ 5 emosi, ≥ 3 latar, ≥ 2 pergantian cahaya
- [ ] Gaya animasi punya alasan 1 kalimat & cocok dengan emosi
- [ ] Subtitle terbaca (pita gelap), judul ≥ 80 px, isi ≥ 40 px
- [ ] Musik CC0/buatan sendiri, SFX di momen penting
