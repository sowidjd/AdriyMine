# Aturan Konten

Aturan ini wajib diikuti untuk setiap video konten (TikTok 9:16, tokoh Adriy, narasi suara pemilik akun).
Sebelum membuat naskah, baca file ini. Setelah video jadi, cek ulang dengan **Checklist** di bagian akhir.

---

## 0. Tiga Tips Memilih Topik (dari pemilik, wajib diterapkan)

Sebelum menulis atau menerima skrip, periksa topiknya terhadap tiga tips ini. Tujuannya satu: **penonton bertahan sampai habis dan ingin membagikannya.**

1. **Bikin orang merasakan sesuatu.** Topik harus memancing emosi: takjub, kaget, ngakak, gembira, sedih, dan sejenisnya. Emosi seperti itu membuat orang bertahan menonton dan ingin share. Tag emosi di skrip, gaya karakter, dan efek suara harus mengikuti **emosi inti** topiknya.
2. **Bantah hal yang selama ini dikira benar.** Fakta yang berbeda dari dugaan orang membuat penasaran, dan saat penonton membagikannya mereka merasa pintar. Buka video dengan dugaan umum, lalu patahkan.
3. **Jawab pertanyaan yang diam-diam sudah ada di kepala mereka.** Contoh: *"kenapa sih kita selalu iri sama hidup orang lain?"* Kalau penonton sampai berpikir "ini gue banget", mereka akan mengirimnya ke teman.

**Cara memakai:**
- **Saat menerima skrip:** Claude menyebut dalam laporan tips mana (1, 2, 3) yang dipenuhi skrip itu dan emosi intinya, **tanpa mengubah kata skrip** (skrip adalah teks final).
- **Saat pemilik meminta usulan topik:** setiap usulan harus memenuhi minimal satu tips, ditulis di sebelahnya, dan sebaiknya dua atau tiga.
- **Fakta yang membantah dugaan umum** tetap berasal dari skrip pemilik atau sumber yang disebut. Claude **tidak mengarang fakta** demi "bantahan".

**Contoh penilaian (video yang sudah dibuat):**
| Video | Tips terpenuhi | Emosi inti |
|---|---|---|
| Alarm bunyi 7 kali, tetep telat | 1, 2 ("bukan karena kamu malas"), 3 ("ini gue banget") | Ngakak → lega |
| Burung seberat sebungkus beras ini lebih cepat dari Whoosh | 1 (takjub), 2 ("320 itu BUKAN rekornya") | Takjub |

## 1. Tema harus selang-seling

Penonton bosan kalau tiga video berturut-turut membahas hal yang mirip. Ganti **kategori** setiap video.

**Kategori** (lihat `projects/IDE-KONTEN.md`):
🧠 Otak & kebiasaan · 📱 HP & fokus · 💬 Chat & sosial · 😳 Perasaan & pikiran · 💸 Uang & belanja · ⏰ Waktu & produktivitas · 🌍 Tema umum (alam & hewan, tubuh & kesehatan, sains sehari-hari, sejarah & asal-usul, teknologi)

**Aturan:**
- Dua video berturut-turut **tidak boleh** dari kategori yang sama.
- Dalam 5 video terakhir, minimal ada **4 kategori berbeda**.
- Selang-seling juga **suasananya**: setelah video yang berat/emosional (😳), video berikutnya ringan/lucu (🧠 atau 💸).
- Selang-seling **warna dominan & waktu kejadian**: kalau video sebelumnya malam/gelap, video berikutnya siang/terang.
- **Selipkan tema umum (🌍) setiap 2–3 video**, supaya akun tidak hanya berisi masalah sehari-hari, tapi juga fakta yang membuat penonton kagum dan ingin membagikan.
- Tema umum tetap wajib **dikaitkan ke kehidupan penonton** ("…lebih cepat dari motor yang kamu naiki tiap hari") dan tetap mengikuti aturan judul & hook.
- **Fakta harus benar:** angka dan klaim di tema umum wajib dicek ke sumber terpercaya sebelum dibuat; sebutkan sumbernya di caption.
- Catat setiap video yang sudah dibuat di **Riwayat** di bawah, lengkap dengan kategorinya.
- **Jangan mengusulkan judul/topik yang sudah dibuat pemilik:** cek `projects/SUDAH-DIBUAT.md` (35 judul) sebelum mengusulkan ide. Topik dengan fakta inti yang sama dianggap sama walau judulnya diganti.

### Daftar 12 tema & urutan selang-seling (wajib diikuti)

Tema disusun dari koleksi efek suara pemilik (`projects/sfx-saya/`, §8). Urutan di bawah **sudah selang-seling**: nomor ganjil = masalah sehari-hari (penonton merasa "ini gue banget"), nomor genap = pengetahuan umum (penonton kagum). Buat video **berurutan dari atas ke bawah**; setelah nomor 12, kembali ke nomor 1.

| Urutan | Tema | Jenis | Kategori lama | Efek suara | Gaya animasi yang cocok (§9) |
|---|---|---|---|---|---|
| 1 | 📱 Kehidupan digital (HP, chat, media sosial) | Sehari-hari | 📱 / 💬 | ⭐⭐⭐ | Mascot Screencast, Sci-fi HUD, Manga Panels |
| 2 | 🌊 Dunia laut | Umum | 🌍 Alam & hewan | ⭐⭐⭐ | Watercolor, Ukiyo-e |
| 3 | 🧠 Kebiasaan sehari-hari yang lucu | Sehari-hari | 🧠 | ⭐⭐⭐ | Sketchbook, Whiteboard Explainer |
| 4 | 🫀 Tubuh manusia | Umum | 🌍 Tubuh & kesehatan | ⭐⭐⭐ | Isometric Infographic, Line-art Cutaway |
| 5 | 🎮 Uang & belanja ala game | Sehari-hari | 💸 | ⭐⭐ | Microgame Frenzy, Pop Art |
| 6 | 🐾 Hewan & alam liar | Umum | 🌍 Alam & hewan | ⭐⭐⭐ | Watercolor, Woodcut |
| 7 | 😳 Perasaan & pikiran | Sehari-hari | 😳 | ⭐ (perlu `soft piano`, `room tone`) | Paper-cut, Watercolor |
| 8 | 🤖 Teknologi & internet | Umum | 🌍 Teknologi | ⭐⭐ | Dark Tech, Circuit Board, CRT ASCII |
| 9 | ⏰ Waktu & produktivitas | Sehari-hari | ⏰ | ⭐⭐ | Live Countdown, Swiss Motion |
| 10 | 🚀 Luar angkasa | Umum | 🌍 Sains | ⭐ | Blueprint, Scale Zoom Explainer |
| 11 | 🚆 Kendaraan & kota | Sehari-hari | 🌍 Sains sehari-hari | ⭐⭐ | Flat Vector, Isometric |
| 12 | 📜 Sejarah & asal-usul | Umum | 🌍 Sejarah | ⭐ (perlu `typewriter`, `old radio`) | 1920s Newsreel, Vintage Engraving |

⭐⭐⭐ = efek suara lengkap · ⭐⭐ = cukup · ⭐ = cari tambahan efek dulu (Pixabay) sebelum membuat video.

**Cara memakai:**
- Lihat kolom **Tema** di Riwayat; video berikutnya = **urutan sesudah** tema terakhir.
- Boleh **melompat 1 nomor** hanya bila efek suara tema itu masih ⭐ dan belum ditambah, atau pemilik meminta tema lain. Tema yang dilompati dikerjakan berikutnya.
- Dua video berturut-turut **tidak boleh** sama-sama "Umum" atau sama-sama "Sehari-hari".
- Gaya animasi tetap dipilih lewat 6 langkah §9; tabel di atas hanya pilihan awal. Gaya tidak boleh sama dengan video sebelumnya.
- **Video berikutnya: urutan 7 (😳 Perasaan & pikiran).** Tambah efek `soft piano` & `room tone` dulu (tema ini masih ⭐).

## 2. Judul tidak boleh umum, harus menarik perhatian

Judul = momen spesifik yang membuat penonton berpikir **"kok tau sih, ini gue banget"**.

| ❌ Umum (dilarang) | ✅ Menarik |
|---|---|
| Tips hemat uang | Belanja 200 ribu biar dapet gratis ongkir 10 ribu |
| Cara bangun pagi | Alarm bunyi 7 kali, tetep telat |
| Cara fokus belajar | Buka buku, 10 menit kemudian udah di TikTok |
| Kenapa kita lupa | Masuk kamar, lupa mau ngapain. Ternyata salah pintunya |
| Fakta burung tercepat | Burung seukuran ayam ini nukik 320 km/jam, hampir secepat mobil F1 |
| Fakta tubuh manusia | Kamu lebih tinggi 1 cm pas bangun tidur |
| Mengatasi overthinking | Dibales "oke" doang, langsung mikir 3 jam |

**Rumus judul (pilih salah satu):**
- **Momen spesifik + angka:** "Ngetik 3 paragraf, dihapus, kirim 'wkwk'"
- **Momen + plot twist:** "Kamu nggak pelupa. Pintunya yang salah."
- **Tuduhan lembut:** "Kamu pasti pernah bilang 'otw' padahal masih mandi"
- **Pertanyaan yang mengganggu:** "Kenapa kamu inget kejadian malu 5 tahun lalu, tapi lupa tadi makan apa?"

**Larangan judul:**
- Tidak boleh diawali "Tips…", "Cara…", "Pentingnya…", "Manfaat…".
- Maksimal 10 kata, bahasa santai (aku/kamu/gue), bukan bahasa baku.
- Tidak boleh *clickbait* bohong: janji di judul harus dibayar di video.

## 3. Hook (3 detik pertama) harus yang paling bagus

Hook menentukan penonton lanjut atau *scroll*. Buat **minimal 3 versi hook**, lalu pilih yang terbaik.

**Hook wajib:**
- **Detik 0 sudah ada gerakan & suara.** Tidak boleh dibuka dengan layar diam, logo, atau "Halo guys".
- **Langsung masuk momennya.** Penonton harus melihat dirinya sendiri dalam 1 detik pertama.
- **Ada "tapi"/twist di detik 2–3** yang membuat penasaran: *"…dan ternyata bukan salahmu."*
- **Teks hook besar di tengah layar**, maksimal 7 kata, kata kunci berwarna (kuning).
- **Suara/efek kejutan** di detik pertama (alarm, notifikasi, *boing*, dentuman).

**Rumus hook (pilih salah satu):**
1. **Cermin:** tunjukkan momennya persis → *"Kamu masuk dapur… terus bengong."*
2. **Fakta mengejutkan:** *"Pintu bisa menghapus ingatanmu. Serius."*
3. **Tuduhan:** *"Kamu nonton ini jam 1 pagi, kan?"*
4. **Angka nyata:** *"Rata-rata orang buka kulkas 7 kali sehari tanpa ambil apa-apa."* (angka harus benar & ada sumbernya)
5. **Kebalikan:** *"Masalahnya BUKAN karena kamu malas."*

**Variasi (§16):** rumus hook tidak boleh sama dengan 2 video terakhir, dan kata pertamanya tidak boleh sama dengan video sebelumnya. Bank lengkap ada di `projects/VARIASI.md` (13 rumus).

**Larangan hook:** pembukaan lambat, perkenalan diri, "Di video ini aku akan…", musik tanpa visual.

## 4. Ekspresi

Adriy harus **berakting**, bukan hanya berdiri.
- Setiap adegan punya **emosi yang jelas** dan berubah mengikuti cerita (bosan → kaget → bingung → sedih → semangat → bahagia).
- **Perubahan emosi selalu dengan "take"** (badan menyusut lalu memantul), tidak boleh berganti wajah secara tiba-tiba.
- **Sebab dulu, baru reaksi:** penonton harus melihat penyebabnya dulu, baru ekspresi Adriy.
- Pakai tanda emosi bergambar (!, ?, keringat, awan hujan, hati, lampu ide), **bukan tulisan**.
- **Narasi ikut berekspresi:** setiap kalimat diberi arahan emosi (panik, berbisik ngantuk, semangat, sedih). Tidak boleh datar dari awal sampai akhir.
- Minimal **5 emosi berbeda** dalam satu video.

## 5. Suasana

- Setiap bagian video punya **suasana** yang dibangun bersama-sama oleh warna, musik, dan suara:
  - **Masalah:** tegang/kacau → warna redup, musik minor atau sepi, efek suara mengganggu.
  - **Penjelasan:** penasaran → warna netral/terang, musik ringan.
  - **Solusi/trik:** semangat → warna cerah, musik berdrum.
  - **Hasil/penutup:** hangat/lega → warna hangat (oranye/kuning), musik manis.
- **Musik berganti mengikuti suasana**, dan otomatis mengecil saat narasi bicara.
- **Musik wajib bebas hak cipta.** Hanya dua sumber yang boleh:
  1. **Katalog CC0** `repos/video-background-music` (334 lagu loop, semua CC0-1.0, ada label suasana/tempo/energi). Ambil dengan `projects/musik/ambil_musik.py cari <suasana>` lalu `ambil <id>`.
  2. **Musik buatan kode sendiri** (seperti `projects/bangun-pagi/audio.py`): milik kita sepenuhnya.
- **Dilarang:** lagu populer/viral (walau hanya 5 detik), YouTube Audio Library & Pixabay (lisensinya membatasi), musik buatan AI seperti Suno/Udio (status hak ciptanya belum jelas), dan lagu CC-BY tanpa mencantumkan kredit.
- Catat judul lagu, sumber & lisensinya di naskah video. Kalau TikTok/YouTube memberi klaim hak cipta pada lagu CC0, ajukan banding dengan menyebut lisensi CC0 dan sumbernya.
- **Efek suara** untuk setiap kejadian penting (jatuh, notifikasi, pintu, lampu menyala), tapi tidak menutupi narasi.

## 6. Latar

- **Latar harus menceritakan konteks**: kamar, dapur, kantor, angkot, warung, kasir minimarket. Pilih tempat yang **dekat dengan kehidupan penonton Indonesia**.
- **Detail kecil yang relatable** membuat penonton merasa "itu kamar gue": charger kusut, gelas kopi sisa, tumpukan baju di kursi, kipas angin, rice cooker, sandal jepit.
- **Minimal 3 latar/komposisi berbeda** dalam satu video (misalnya kamar → grafik penjelasan → kartu judul trik), supaya tidak monoton.
- Latar tidak boleh mengalahkan tokoh: Adriy harus selalu kontras dan mudah dilihat.
- **Area aman (kanvas 1080×1920)**, diambil dari angka terketat `repos/shorts-kit` (diukur dari layar TikTok & Reels) dan `repos/vertical-video-kit`:
  - **Atas:** teks penting mulai dari **y ≥ 212** (status bar & tab "Following / For You").
  - **Kanan:** mulai **y ≥ 803**, teks/objek penting harus di **x < 927** (kolom tombol like/komentar/share).
  - **Bawah:** teks penting di **y ≤ 1540** (sekitar 380 px bawah tertutup keterangan, nama akun & musik).
  - Jadi **kotak aman teks: x 60–927, y 212–1540**. Caption narasi paling aman di sekitar y 1300–1500.
  - Ukuran teks: judul/hook ≥ 80 px tebal; teks isi ≥ 40 px (di bawah itu tidak terbaca di feed).

## 7. Pergantian cahaya

Cahaya adalah alat bercerita, bukan hiasan.
- **Cahaya mengikuti perjalanan emosi:** gelap/dingin saat masalah → terang/hangat saat solusi berhasil.
- **Cahaya menunjukkan waktu:** malam (biru tua, bulan, lampu tidur) → subuh (ungu) → pagi (kuning keemasan) → siang (terang).
- **Perubahan cahaya harus bertahap** (memudar 0,5–2 detik), kecuali untuk kejutan (lampu tiba-tiba menyala, kilat, layar HP menyala di kamar gelap).
- **Sumber cahaya harus jelas:** jendela, lampu, layar HP, matahari. Bayangan & sinar mengikuti arah sumbernya.
- Minimal **2 pergantian cahaya** dalam satu video, dan **momen paling penting diberi cahaya paling terang/kontras**.

## 8. Teknis yang sudah terbukti

- **Contoh suara utama (sejak 17 Nov 2026):** `projects/suara/ref5.wav` = 19 detik paling stabil dari rekaman pemilik (detik 48–67), dipilih pemilik karena nadanya tidak naik-turun dan ucapannya lebih jelas. File ini **tidak diunggah** ke GitHub. Mode "lanjutan" (prompt teks + audio) tidak dipakai: potongan rekaman ikut terbawa ke suara.
- **Ucapan narasi:** pakai `projects/suara/ucapan.py` (kamus ejaan bantu: alarm, snooze, singkatan HP/TV/AI, dan lain-lain), lalu cek dengan `cek_ucapan.py` dan perbaiki dengan `perbaiki_ucapan.py`.
- **Huruf/angka yang diucapkan sendirian:** gunakan gaya "tegas dan jelas", jangan "teriak".
- **Gerakan & gaya:** `repos/animate` punya aturan tempo, potongan yang jatuh di ketukan musik, dan pemeriksaan storyboard; pakai sebagai rujukan kualitas gerakan.
- **Efek suara milik pemilik diutamakan:** `projects/sfx-saya/` (59 efek ElevenLabs + 736 efek Mixkit di `mixkit/`, katalog di `KATALOG.md`, pakai versi rapi di `normal/`). File Mixkit **tidak boleh diunggah ke repo publik** (lisensinya melarang menyebarkan file mentah). Pakai hanya bila status lisensinya sudah dikonfirmasi pemilik (paket berbayar = boleh komersial). Kalau tidak ada yang cocok, baru ambil dari sfx-kit.
- **Efek suara cadangan:** `repos/sfx-kit` (320 SFX, CC0, bebas komersial). Ikuti `repos/sfx-kit/GUIDE.md` untuk memilih & menaruh suara di momen yang tepat. Efek suara buatan kode hanya kalau tidak ada yang cocok.
- **Rujukan aturan lengkap:** `repos/shorts-kit/SOUL.md` (aturan channel yang sudah teruji, 20 pola alur cerita di `docs/flows/`, cek fakta di `docs/facts/`) dan `repos/vertical-video-kit` (caption kata per kata, perapian teks untuk suara AI). Kalau ada yang bertentangan dengan aturan.md, **aturan.md yang dipakai**.
- **Privasi:** file berisi tiruan suara pemilik akun **tidak diunggah ke GitHub**.

---

## 9. Penentuan gaya animasi: harus sesuai tema & judul, tidak boleh asal

Gaya animasi bukan hiasan: **gaya harus ikut bercerita**. Penonton harus bisa "menangkap" masalahnya dari gambarnya saja, bahkan sebelum membaca teks. Gaya yang dipilih karena "keren" tapi tidak nyambung dengan judul **dilarang**.

### Langkah wajib (tulis jawabannya di naskah sebelum membuat animasi)
1. **Cari metafora inti judul.** Judul itu "seperti apa" kalau digambar?
   *Contoh: "Gajian tgl 25, tgl 5 bokek" → uang = nyawa di game yang terus berkurang.*
2. **Pilih gaya yang bahasa visualnya = metafora itu.**
   *→ Microgame Frenzy (bar nyawa, "GAME OVER").*
3. **Tulis 1 kalimat alasan:** "Gaya X dipilih karena ___ di judul terlihat sebagai ___."
   Kalau kalimat ini tidak bisa ditulis dengan jelas, gayanya **salah**: pilih ulang.
4. **Cek suasana:** gaya harus cocok dengan emosi utama video (lucu, tegang, haru, kagum).
   Gaya seram tidak untuk tema lucu; gaya imut tidak untuk tema yang menyentuh.
5. **Cek selang-seling:** gaya tidak boleh sama dengan video sebelumnya (catat di Riwayat).
6. **Cek kelayakan teknis:** server tanpa GPU. Gaya penuh tekstur/efek cahaya berat dicoba dulu 3 frame; kalau render > 2 detik per frame, sederhanakan efeknya, jangan ganti ke gaya yang tidak nyambung.

### Gaya yang cocok per kategori (pilihan utama, bukan satu-satunya)
Nama gaya mengacu ke repo `repos/lemo-opuscar/styles/` dan `repos/mg-styles-15/`.

| Kategori | Gaya yang cocok | Alasan |
|---|---|---|
| 🧠 Otak & kebiasaan | Whiteboard Explainer, Sketchnote, Flat Vector, Isometric Infographic | Menjelaskan "isi kepala" dengan gambar sederhana & jelas |
| 📱 HP & fokus | Sci-fi HUD, Liminal/Backrooms, CRT ASCII, Mascot Screencast | Dunia layar: notifikasi, feed tanpa ujung, terjebak di dalam HP |
| 💬 Chat & sosial | Stick-figure Explainer, Manga Panels, Mid-century Cartoon | Situasi antarmanusia, ekspresi & dialog visual, gampang membayangkan diri sendiri |
| 😳 Perasaan & pikiran | Paper-cut Lightbox, Watercolor, Crayon Picture Book, Double Exposure | Lembut & emosional; pikiran jadi bayangan/warna |
| 💸 Uang & belanja | Microgame Frenzy, Pop Art, Spreadsheet Film, Rhythm Game Show | Angka, skor, diskon yang "teriak", saldo yang berkurang |
| ⏰ Waktu & produktivitas | Live Countdown Split-screen, Flat cartoon (gaya video #1), Swiss Motion | Jam, deadline, timer, ritme harian |
| 🌍 Alam & hewan | Watercolor, Colored-pencil Science, Ukiyo-e, Woodcut | Terasa seperti buku alam/dokumenter |
| 🌍 Tubuh & kesehatan | Colored-pencil Science, Isometric Infographic, Line-art Cutaway | Bagian tubuh "dibedah" dengan jelas |
| 🌍 Sains sehari-hari | Exploded Teardown, Blueprint, Scale Zoom Explainer | Membongkar cara kerja benda di sekitar kita |
| 🌍 Sejarah & asal-usul | 1920s Newsreel, Halftone Dossier, Vintage Engraving Collage | Terasa "zaman dulu" dan seperti arsip |
| 🌍 Teknologi & internet | Dark Tech Keynote, Circuit Board, CRT ASCII | Dunia digital & mesin |

Gaya tambahan dari `repos/animate` (berbasis Canvas seperti video kita, punya pemeriksa cerita & storyboard):
| Gaya `animate` | Cocok untuk |
|---|---|
| cut paper (kertas sobek, tokoh berwajah) | 😳 perasaan, 💬 sosial, cerita yang hangat |
| crosshatch (tinta arsir yang "mendidih") | 🧠 isi kepala, 🌍 "di dalam mesin/tubuh" |
| riso (cetak risograf 3 tinta) | 💸 uang & belanja, 🌍 sejarah, poster yang mencolok |
| sketchbook (pensil + 1 warna aksen) | 🧠 kebiasaan, ⏰ produktivitas, catatan pribadi |
| math (gaya penjelas grafik) | 🌍 sains, angka & statistik |
| pixel (zaman game lama) | 📱 HP & internet, nostalgia |
| isometric (garis isometrik rapi) | 🌍 cara kerja benda, tubuh sebagai "pabrik"

### Gaya yang dilarang untuk tema tertentu
- **Gaya seram/gelap** (Backrooms, Scratch Film) → tidak untuk tema lucu ringan atau anak-anak.
- **Gaya imut/anak** (Crayon, Picture Book) → tidak untuk tema uang serius atau fakta teknis.
- **Gaya "zaman dulu"** (Newsreel, Engraving) → tidak untuk tema HP/internet, kecuali sengaja dijadikan lelucon dan alasannya ditulis.
- **Gaya teknis/dingin** (Blueprint, HUD) → tidak untuk tema perasaan.
- **Gaya dengan banyak teks** (Text Flash Cuts, Caption News) → hati-hati menumpuk dengan teks narasi; teks tetap harus terbaca.

### Contoh penentuan yang benar
| Judul | Metafora inti | Gaya | Alasan 1 kalimat |
|---|---|---|---|
| Alarm bunyi 7 kali, tetep telat | Pagi yang berulang & kacau | Flat cartoon + line boil | Kamar & alarm yang sederhana membuat penonton langsung melihat dirinya sendiri |
| Masuk kamar, lupa mau ngapain | Pintu "menghapus" isi kepala | Whiteboard Explainer | Isi kepala Adriy digambar lalu benar-benar terhapus penghapus saat melewati pintu |
| Belanja 200rb biar gratis ongkir 10rb | Diskon yang menjebak | Pop Art | Tulisan "GRATIS ONGKIR!" berteriak seperti iklan, kontras dengan struk yang membengkak |
| Ngetik panjang, kirim "wkwk" | Kata-kata yang ditelan | Manga Panels | Panel demi panel ekspresi ragu, gelembung teks yang dihapus satu per satu |
| Scroll 5 menit jadi jam 2 pagi | Feed = lorong tanpa ujung | Liminal/Backrooms | Lorong yang tak berujung terasa seperti feed yang tidak pernah habis |
| Burung seukuran ayam nukik 320 km/jam | Kecepatan alam yang luar biasa | Watercolor (dokumenter alam) | Terasa seperti buku alam; garis kecepatan cat air menunjukkan tukikan |

## 10. Menyebut nama akun: Arfiy World

> Mulai 27 Nov 2026 nama akun (TikTok & YouTube) = **Arfiy World**, menggantikan Adriy.Project. Video lama tetap memakai nama lama; semua video baru memakai Arfiy World (tagar `#ArfiyWorld`). Tokoh tetap **Adriy** (§15).

Nama akun **Arfiy World** disebut di dalam narasi supaya penonton **ingat**, jadi harus terasa sebagai **sebuah momen**, bukan lewat begitu saja seperti angin, tapi juga tidak seperti iklan.

**Jumlah & posisi:**
- **1 kali per video** (maksimal 2 kali kalau videonya lebih dari 2 menit, dengan jarak jauh).
- **Dilarang di awal** (hook, 10 detik pertama) dan **dilarang di akhir** (penutup/ajakan komentar).
- **Di tengah, sekitar 30–70% durasi**, di momen transisi: sesudah penjelasan dan sebelum fakta paling mengejutkan atau trik utama.

**Supaya terasa (wajib ketiganya):**
1. **Kalimat khusus untuk nama.** Nama tidak boleh terselip di tengah kalimat panjang. Bentuk kalimatnya **berganti setiap video** (§16, bank di `projects/VARIASI.md`). Contohnya: "kami di Arfiy World…", "Jujur, kami di Arfiy World…", "Ini bagian favorit kami di Arfiy World…". Sesudah nama, kalimat dipotong atau diberi **jeda 0,5–0,9 detik** sesudah nama. Arahan suara: *lebih pelan, hangat, bangga, penekanan jelas pada nama*.
2. **Stempel visual.** Lencana "Arfiy World" dengan desain yang sama di setiap video, ukuran teks ≥ 70 px, di tengah-atas kotak aman, muncul seperti dicap (memantul), bertahan **≥ 2 detik**, dengan sorotan cahaya hangat di belakangnya. **Adriy bereaksi** (menunjuk lencana, mengangguk bangga). Lencana tidak menutupi tokoh atau teks penting lain.
3. **Logo suara.** Setiap kali nama disebut, bunyi khas yang **selalu sama**: `repos/sfx-kit/sounds/logo-stings/sting-bright-short.wav`, jatuh di jeda sesudah nama. Musik turun sedikit di saat itu supaya bunyi khasnya terdengar.

**Lain-lain:**
- Bagian kalimat sesudah nama **disesuaikan dengan tema**, jangan sama persis di setiap video. Bentuk kalimat dan kata kerjanya tidak boleh sama dengan 3 video terakhir (§16). Yang tetap sama hanya stempel visual dan bunyi khasnya.
- **Cara baca:** "Arfi Werld" (diubah otomatis oleh `projects/suara/ucapan.py`).
- Caption narasi juga menampilkan nama.

**Contoh kalimat yang benar (disesuaikan tema):**
| Tema | Kalimat (di tengah video) |
|---|---|
| 🌍 Peregrine Falcon | "Waktu kami di Arfiy World ngecek rekor resminya…" *(jeda, stempel, bunyi khas)* "…kami langsung melongo." |
| ⏰ Bangun pagi | "Kami di Arfiy World nyobain caranya selama seminggu…" *(jeda)* "…dan ternyata berhasil." |
| 🧠 Lupa pas masuk ruangan | "Kami di Arfiy World baca penelitiannya…" *(jeda)* "…ternyata pintunya yang bikin lupa." |
| 💸 Gratis ongkir | "Kami di Arfiy World hitung pakai kalkulator…" *(jeda)* "…hasilnya bikin nyesek." |

**Contoh yang salah:**
- ❌ "…yang bikin kita di Arfiy World melongo." (nama terselip, langsung lewat)
- ❌ "Halo, selamat datang di Arfiy World!" (di awal)
- ❌ "Follow Arfiy World buat konten lainnya!" (di akhir dan seperti iklan)
- ❌ Disebut 3 kali dalam video 1 menit, atau tanpa stempel dan bunyi khas

## 11. CTA (ajakan) di skrip & penutup "Stay Curious, World!"

> Mulai 27 Nov 2026 slogan penutup = **"Stay Curious, World!"** (dipilih pemilik), menggantikan "Explore More, Know More" yang dipakai video lama.

Setiap skrip **wajib** punya CTA dan **wajib** ditutup dengan kalimat khas **"Stay Curious, World!"**.

**Urutan bagian akhir video (wajib):**
1. **Kesimpulan singkat**: 1–2 kalimat yang mengaitkan isi video ke kehidupan penonton.
2. **CTA komentar (utama)**: pertanyaan yang **memancing jawaban**, bukan sekadar "komen ya".
   - Bentuk yang dipakai: pilihan ("pilih yang mana: A, B, atau C?"), pengakuan ("kamu pernah juga? tulis 'gue banget'"), atau tebakan ("menurutmu kenapa…?").
   - Teks di layar menampilkan pilihannya, Adriy menunjuk ke arah kolom komentar (kanan bawah, tetap di kotak aman).
3. **CTA kedua (pilih 1, singkat, ≤ 1 kalimat)**: ajak **simpan** ("Simpan biar nggak lupa"), **bagikan** ("Kirim ke teman yang suka begini"), atau **ikuti** ("Ikuti buat fakta kayak gini lagi"). Ganti-ganti tiap video; **tanpa menyebut nama akun** (nama akun hanya di tengah, §10).
4. **Penutup "Stay Curious, World!"**: kalimat **terakhir** video, selalu sama persis.

**Aturan "Stay Curious, World!":**
- **Diucapkan** di narasi sebagai kalimat terakhir, dengan jeda ±0,4 detik sebelumnya. Arahan suara: *hangat, yakin, tersenyum, tempo sedang*. Cara baca: "stei kyurius, werld"; lolos cek ucapan (`cek_ucapan.py`) sebelum dipakai.
- **Ditampilkan** sebagai kartu penutup: teks **"Stay Curious, World!"** di tengah kotak aman, ukuran ≥ 80 px, desain & warna sama di setiap video, muncul halus (fade + sedikit membesar), bertahan **≥ 1,5 detik**. Adriy melambai atau memberi hormat kecil di sampingnya.
- **Bunyi khas penutup** selalu sama (pilih 1 sekali, lalu dipakai terus; berbeda dari bunyi khas nama akun §10). Musik mengecil lalu selesai bersama kartu.
- Tidak dihitung sebagai penyebutan nama akun; nama "Arfiy World" tetap **tidak** muncul di akhir.
- Teks dan cara ucapnya **tidak boleh diubah** (tanpa terjemahan, tanpa tambahan kata).

**Contoh bagian akhir yang benar:**
> "Jadi kalau lain kali kamu lihat burung kecil di atas gedung, jangan diremehin." → "Kalau kamu bisa punya satu kemampuan falcon: badan peluru, hidung jet, atau kacamata bawaan, pilih yang mana? Tulis di komentar!" → "Simpan biar kamu bisa pamer fakta ini ke teman." → *(jeda)* "Stay Curious, World!"

**Contoh yang salah:**
- ❌ "Jangan lupa like, comment, share, dan follow ya!" (CTA umum, tidak memancing jawaban, terlalu banyak permintaan)
- ❌ Lebih dari 2 CTA, atau CTA di tengah video yang memotong cerita
- ❌ "Stay Curious, World!" diucapkan lalu masih ada kalimat lain sesudahnya
- ❌ "Stay Curious, Arfiy World!" (menambah kata & menyebut nama akun di akhir; "World" di slogan bukan nama akun)

## 12. Durasi & alur: masalah dibahas tuntas dulu, baru solusi (dari pemilik)

Masukan pemilik: video terlalu cepat melompat ke penyelesaian, padahal pembahasan masalahnya belum selesai. Penonton butuh waktu untuk **mencerna** dulu.

**Durasi: minimal 2 menit 43 detik (163 detik), MAKSIMAL 2 menit 57 detik (177 detik)** (batas 3 menit dari pemilik). Kalau naskah kepanjangan: percepat suara sedikit (tempo maks. 1,1×, nada tetap), perpendek jeda (skala_jeda), lalu buang kalimat pelengkap (`"lewati": true` di naskah.json) dan laporkan ke pemilik kalimat mana yang dibuang. Durasi panjang diisi dengan **pembahasan yang lebih dalam**, bukan kalimat yang diulang-ulang atau jeda kosong.

**Alur wajib & pembagian waktu (perkiraan):**
| Bagian | Isi | Porsi |
|---|---|---|
| 1. Hook | 0–8 detik, aturan §3 | ± 5% |
| 2. Masalah | Ceritakan masalahnya lewat **contoh nyata sehari-hari** (minimal 2 situasi berbeda), rasa yang muncul ("kok gini ya?"), dan **kenapa ini mengganggu**. Penonton harus mengangguk "iya, gue banget" | ± 25% |
| 3. Dugaan umum | Apa yang biasanya orang kira / lakukan, dan **kenapa itu tidak berhasil** | ± 10% |
| 4. Penyebab | Penjelasan ilmiah **langkah demi langkah**, satu ide per adegan, pakai perumpamaan sehari-hari. Bukti/penelitian disebut di sini. Momen "Arfiy World" (§10) masuk di bagian ini | ± 30% |
| 5. Solusi | Baru di sini trik/jawaban. Jelaskan **cara melakukannya** (langkah 1-2-3) dan contoh penerapannya | ± 20% |
| 6. Rangkuman + CTA | Ulang inti dalam 1 kalimat, lalu CTA (§11) dan "Stay Curious, World!" | ± 10% |

**Larangan:**
- Solusi/trik **tidak boleh** muncul sebelum bagian Masalah dan Penyebab selesai (paling cepat di **55–60% durasi**). Hook boleh *menjanjikan* jawaban, tapi tidak *menjelaskannya*.
- Setiap bagian diberi **jeda napas** (0,5–1 detik) dan adegan berganti, supaya penonton sempat mencerna.
- Satu kalimat = satu ide. Kalimat panjang dipecah.

## 13. CTA yang bagus (ajakan di akhir, dari pemilik)

CTA harus terasa seperti **ajakan ngobrol**, bukan perintah. Susunan (melengkapi §11):
1. **Jembatan:** hubungkan isi video ke penonton secara pribadi ("Nah, sekarang giliran kamu.").
2. **Pertanyaan yang gampang dijawab** dalam 1–3 kata atau angka, dan **memancing cerita** ("Kamu tim A atau tim B? Tulis A atau B di komentar!", "Berapa kali hari ini? Tulis angkanya!"). Beri **contoh jawaban** supaya penonton tidak ragu.
3. **Alasan untuk menjawab:** "Aku penasaran siapa yang paling parah," "Jawaban paling lucu aku balas."
4. **CTA kedua** (pilih satu): kirim ke teman yang **spesifik** ("teman yang paling sering…"), atau simpan **dengan alasan** ("simpan buat dicoba besok pagi"), atau ikuti **dengan janji** ("masih ada fakta aneh soal tubuhmu minggu depan").
5. "Stay Curious, World!"

Contoh benar: "Nah, sekarang giliran kamu. Kamu tim ngapus chat, atau tim langsung kirim? Tulis 'hapus' atau 'kirim' di komentar. Aku penasaran mana yang lebih banyak. Terus, kirim video ini ke teman yang paling sering bales 'wkwk' doang."
Contoh salah: "Tulis di komentar ya!" (tidak jelas apa yang ditulis); tiga perintah sekaligus.

## 14. Ejaan untuk suara (supaya tidak salah ucap)

Model suara bukan model khusus bahasa Indonesia, jadi beberapa tulisan salah dibaca. Aturan saat menulis naskah:
- **Huruf "c"** sering dibaca "k" (cara → kara, chat → ket). Ikuti hasil tes di `projects/suara/ucapan.py` (kamus otomatis), dan sebisa mungkin pilih kata tanpa "c" yang rawan ("pesan" daripada "chat", "jalan" daripada "cara" bila maknanya sama).
- **Singkatan & bahasa gaul ketik** ("wkwk", "otw", "btw") **tidak dibacakan apa adanya**. Tulis bentuk ucapannya ("ketawa ngakak", "we-ka-we-ka") atau tampilkan hanya sebagai teks di layar.
- **Hindari kalimat yang bikin lidah belibet:** banyak konsonan berdekatan, kata asing berderet, atau kata mirip berulang ("cek chat", "ngunyah, nyanyi"). Ganti dengan kata yang lebih mudah diucapkan.
- Kalimat maksimal **± 12 kata**. Kalimat panjang dipecah dua.
- Setiap kalimat punya **kata kunci** yang wajib terdengar jelas (dicek otomatis dengan Whisper). Kalau gagal 4 kali, **ganti katanya**, jangan dipaksakan.

## 15. Tokoh: ADRIY (burung hantu Arfiy World)

Mulai sekarang semua video memakai tokoh sendiri: **Adriy**, burung hantu kecil yang penasaran (dipilih pemilik). Tokoh lama (Clawd) **tidak dipakai lagi**: ia maskot milik perusahaan lain, sedangkan Adriy milik Arfiy World.

- **Lembar karakter resmi:** `projects/karakter/adriy-lembar-karakter.png` (sumber: `adriy.html`). Fungsi gambar: `adriy()` di `projects/_bersama/dasar.js` (nama lama `clawd()` masih jalan).
- **Ciri wajib (tidak boleh diubah):** kacamata bulat besar, syal merah dengan ekor di kanan, jambul telinga, perut krem, paruh & kaki oranye.
- **Warna tetap:** badan `#A9714B`, sayap `#8A5A3C`, perut `#F1DCC0`, paruh/kaki `#F2A23B`, syal `#D9534F`. Gaya animasi hanya mengubah cara goresan (tinta manga, cat air, pensil), bukan bentuk & warna.
- **Ekspresi lewat mata di balik kacamata** (senang, ketawa, penasaran, kaget, bingung, sedih, kesal, ngantuk, takjub) + tanda bergambar (!, ?, keringat, awan, lampu ide).
- **Gerak:** sayap = tangan (melambai, menunjuk); berkedip & bernapas otomatis.
- **Lencana Arfiy World** memakai wajah Adriy (kacamata + paruh + syal).
- Tokoh pendamping (teman, orang lain) boleh beda warna, tapi tidak boleh memakai kacamata bulat + syal merah (itu ciri khas Adriy).
- Nama "Adriy" tidak perlu disebut di narasi; penyebutan nama akun tetap mengikuti §10.

## 16. Variasi antarvideo: hook, nama channel, dan CTA tidak boleh itu-itu terus (dari pemilik)

Penonton yang setia akan bosan kalau setiap video dibuka, menyebut channel, dan ditutup dengan kalimat yang sama.
**Bank pilihan dan catatan pemakaian ada di `projects/VARIASI.md`.** Baca file itu sebelum menulis naskah, dan tambahkan satu baris di sana setelah video jadi.

| Bagian | Yang berganti | Jarak minimal sebelum boleh dipakai lagi |
|---|---|---|
| Hook (§3) | Rumus hook | Beda dari **2 video terakhir** |
| Hook | Kata pertama | Beda dari video sebelumnya |
| Nama channel (§10) | Bentuk kalimat & kata kerja sesudah nama | Beda dari **3 video terakhir** |
| CTA komentar (§13) | Jenis pertanyaan (pilih tim, angka, isi titik-titik, emoji, dll.) | Beda dari **2 video terakhir** |
| CTA komentar | Kata ajakan (tulis / ketik / jawab / pilih / kasih tahu aku) | Beda dari video sebelumnya |
| CTA komentar | Alasan untuk menjawab | Beda dari **3 video terakhir** |
| CTA kedua (§11) | Kirim / simpan / ikuti / grup / seri / coba lalu kembali | Beda dari video sebelumnya |

**Yang sengaja tetap sama** (ciri khas akun): stempel visual dan bunyi khas nama channel, slogan penutup "Stay Curious, World!" beserta kartu dan bunyinya, serta tokoh Adriy.

**Larangan:**
- Menyalin kalimat contoh dari bank apa adanya. Bank hanya pola; isinya ditulis ulang sesuai tema.
- Mengarang pengalaman demi variasi ("kami nyobain seminggu" padahal tidak).
- Mengorbankan aturan lain demi beda: posisi nama channel tetap di 30–70% durasi dengan jeda, CTA tetap satu pertanyaan ditambah satu CTA kedua.

## Checklist sebelum video dianggap selesai

- [ ] Topik memenuhi minimal 1 dari Tiga Tips (§0); tips yang dipenuhi & emosi inti disebut di laporan; tag emosi, gaya karakter & efek suara mengikuti emosi inti

- [ ] Tokoh = Adriy sesuai lembar karakter (§15), ciri & warna tidak berubah
- [ ] Topik tidak ada di `projects/SUDAH-DIBUAT.md`
- [ ] Durasi 2:43–2:57 (maks. 2:57); alur §12 (masalah ± 25% → dugaan → penyebab → solusi baru di ≥ 55% durasi → rangkuman); setiap bagian ada jeda napas
- [ ] CTA sesuai §13 (jembatan, pertanyaan mudah + contoh jawaban, alasan menjawab, CTA kedua yang spesifik)
- [ ] Ejaan untuk suara sesuai §14 (huruf c, bahasa gaul, kalimat ≤ 12 kata, tidak belibet)
- [ ] Tema sesuai urutan selang-seling §1 (urutan sesudah tema terakhir di Riwayat); jenis "Umum"/"Sehari-hari" berbeda dari video sebelumnya
- [ ] Untuk tema umum: semua fakta & angka sudah dicek ke sumber
- [ ] Judul spesifik, ≤ 10 kata, bukan "Tips/Cara…"
- [ ] 3 versi hook ditulis, yang terbaik dipilih; detik 0 sudah bergerak & bersuara
- [ ] Twist/penasaran di detik 2–3
- [ ] Minimal 5 emosi Adriy, semua perubahan pakai "take"
- [ ] Narasi berekspresi (tidak datar), ucapan lolos `cek_ucapan.py`
- [ ] Suasana berubah: masalah → penjelasan → solusi → penutup
- [ ] Minimal 3 latar/komposisi, dengan detail kehidupan Indonesia
- [ ] Minimal 2 pergantian cahaya, momen terpenting paling terang
- [ ] Gaya animasi dipilih lewat 6 langkah §9: metafora inti + alasan 1 kalimat ditulis, tidak termasuk gaya yang dilarang, beda dari video sebelumnya
- [ ] Semua teks di kotak aman x 60–927, y 212–1540 (cek dengan garis bantu area aman)
- [ ] "Arfiy World" disebut 1 kali (maks. 2 untuk video > 2 menit), di tengah (30–70% durasi), tidak di awal/akhir, dengan kalimat khusus + jeda, stempel visual ≥ 2 detik + reaksi Adriy, dan bunyi khas sting-bright-short
- [ ] Bagian akhir sesuai §11: kesimpulan → CTA komentar yang memancing jawaban → 1 CTA kedua (simpan/bagikan/ikuti, tanpa nama akun) → "Stay Curious, World!" sebagai kalimat terakhir (diucapkan + kartu penutup ≥ 1,5 detik + bunyi khas penutup)
- [ ] Variasi §16: hook, bentuk nama channel, dan CTA berbeda dari video-video sebelumnya sesuai `projects/VARIASI.md`, dan barisnya sudah ditambahkan di sana

## Riwayat video

| # | Judul | Tema (urutan §1) | Kategori | Gaya animasi | Suasana dominan | Waktu/cahaya |
|---|---|---|---|---|---|---|
| 1 | Alarm bunyi 7 kali, tetep telat | 9. ⏰ Waktu & produktivitas | ⏰ Waktu & produktivitas | Flat cartoon + line boil | Lucu → semangat | Malam → pagi |
| 2 | Burung seberat sebungkus beras ini lebih cepat dari Whoosh | 6. 🐾 Hewan & alam liar | 🌍 Alam & hewan | Pensil warna (colored-pencil science) | Kagum → tegang → takjub | Subuh → siang → keemasan |
| 3 | Ngetik 3 paragraf, dihapus, kirim "wkwk" | 1. 📱 Kehidupan digital | 💬 Chat & sosial | Manga Panels | Malu-lucu → lega | Malam (cahaya HP) → panggung gelap → siang → keemasan |
| 4 | Jantung paus biru cuma berdetak 2 kali semenit | 2. 🌊 Dunia laut | 🌍 Alam & hewan | Cat air (watercolor) | Takjub → tenang | Laut dalam gelap → permukaan terang → gelap → terang |
| 5 | Lagu nyangkut dari bangun tidur, padahal kamu nggak suka | 3. 🧠 Kebiasaan sehari-hari | 🧠 Otak & kebiasaan | Sketchbook (pensil + 1 aksen oranye) | Kesal-lucu → lega | Pagi muram → terang → hangat |
| 6 | Perut bunyi pas kelas hening? Itu bukan tanda lapar (skrip pemilik) | 4. 🫀 Tubuh manusia | 🌍 Tubuh & kesehatan | Line-art Cutaway | Malu-lucu → lega | Kelas hening → terang |
| 7 | Belanja 200 ribu biar dapet gratis ongkir 10 ribu (skrip pemilik) | 5. 🎮 Uang & belanja | 💸 Uang & belanja | Microgame Frenzy | Ngakak → sadar | Ungu malam (game) |
| 8 | Burung gagak bisa ingat wajahmu, dan dendamnya diwariskan (skrip pemilik) | 6. 🐾 Hewan & alam liar | 🌍 Alam & hewan | Cukil kayu (woodcut) | Merinding → kagum | Kertas krem, aksen merah |
