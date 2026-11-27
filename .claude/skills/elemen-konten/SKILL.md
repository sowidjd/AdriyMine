---
name: elemen-konten
description: >-
  Merencanakan atau menilai video Arfiy World dengan 10 elemen penting pembuatan konten dari pemilik:
  Hook, Storytelling, Pacing, Retention, Curiosity Gap, Structure, Visual Storytelling, Sound Design,
  Emotional Trigger, dan CTA. Pakai saat merencanakan video baru (sebelum menulis naskah), saat menilai
  naskah/video ("cek naskah ini", "kenapa videonya kurang nendang", "nilai videoku"), atau saat pemilik
  menyebut salah satu dari 10 elemen itu.
---

# 10 Elemen Konten

Sepuluh elemen ini daftar dari pemilik. Aturan rinciannya tetap ada di `aturan.md`, yang selalu berlaku. Kalau ada yang bertentangan, ikuti `aturan.md` dan sebutkan bentrokannya ke pemilik.
Gaya bahasa naskah dirapikan dengan skill `/skrip-manusiawi`.

## Dua mode

**A. Rencana (video baru):** sebelum menulis naskah, isi **Kartu Rencana** di bawah untuk ke-10 elemen. Setelah itu tulis naskahnya, lalu jalankan mode B.

**B. Nilai (naskah atau video yang sudah ada):**
1. Baca naskahnya: `NASKAH.md`, `timeline.json` (waktu tiap kalimat), dan `cues.json` (efek suara). Kalau videonya ada, ambil beberapa gambar contoh (`render.mjs --sheet=…` atau `npx hyperframes snapshot`, lihat `projects/hyperframes/README.md`).
2. Nilai tiap elemen dengan angka 1–5 memakai daftar cek di bawah. **Setiap nilai harus disertai bukti**: kutipan kalimat, detik ke berapa, atau nama adegan.
3. Laporkan ke pemilik dalam bahasa Indonesia sederhana:
   - **tabel nilai** (elemen, nilai, bukti singkat),
   - **3 perbaikan terpenting**, diurutkan dari yang paling berpengaruh ke penonton. Tiap perbaikan berisi contoh kalimat atau adegan pengganti yang konkret.
4. Kalau pemilik setuju, terapkan perbaikannya. Fakta dan sumber tidak boleh berubah.

Video dianggap siap kalau **semua elemen bernilai ≥ 4** dan Hook, Retention, serta Curiosity Gap bernilai 5.

## Daftar cek per elemen

### 1. HOOK: menarik perhatian di 1–3 detik pertama (§3)
- Ada 3 versi hook yang ditulis. Yang dipilih memakai salah satu rumus §3: cermin, fakta mengejutkan, tuduhan, angka nyata, atau kebalikan.
- Detik 0 sudah ada gerakan dan suara. Ada twist atau "tapi" di detik 2–3. Teks hook ≤ 7 kata.
- Rumus dan kata pertama hook berbeda dari video sebelumnya (§16, `projects/VARIASI.md`).
- ❌ Dibuka dengan "Halo", perkenalan, "Di video ini…", atau layar diam.

### 2. STORYTELLING: bercerita, bukan membacakan fakta
- Ada **tokoh** (kamu, peneliti, atau hewannya), **situasi**, dan **perubahan** (dari bingung jadi paham).
- Fakta muncul sebagai kejadian ("Peneliti pakai topeng, lalu…"), bukan daftar ("Gagak memiliki 3 kemampuan…").
- Minimal 2 situasi sehari-hari khas Indonesia di bagian Masalah (§12).
- ❌ Paragraf penjelasan tanpa pelaku dan tanpa kejadian.

### 3. PACING: tempo narasi, adegan, dan animasi
- Durasi 2:43–2:57 (§12). Kalimat ≤ 12 kata (§14). Ada jeda napas 0,5–1 detik di setiap pergantian bagian.
- Adegan atau komposisi berganti **sekitar setiap 3–6 detik** (cek dengan `timeline.json`). Tidak ada gambar diam lebih dari 6 detik.
- Bagian Penyebab (paling padat) diberi napas lebih panjang. Hook dan Masalah boleh lebih cepat.
- ❌ Banyak kalimat panjang berderet, atau sebaliknya potongan terlalu cepat sampai teks tidak sempat terbaca.

### 4. RETENTION: penonton bertahan sampai akhir
- Ada **pemicu ulang** sekitar setiap 15–25 detik: pertanyaan baru, angka kejutan, "tapi ada yang lebih aneh…", atau pergantian gaya, cahaya, maupun suasana (§5, §7).
- Informasi makin lama makin seru. Fakta paling mengejutkan **tidak** dibuka di awal, tetapi dijanjikan dulu.
- Pantau detik ±8, ±30, ±60, dan ±50% durasi. Itu titik rawan orang menggeser layar.
- ❌ Bagian tengah datar tanpa kejutan baru lebih dari 25 detik.

### 5. CURIOSITY GAP: beri informasi secukupnya
- Hook **menjanjikan** jawaban tanpa menjelaskannya. Solusi baru muncul di ≥ 55% durasi (§12).
- Setiap bagian ditutup dengan pertanyaan terbuka yang dijawab di bagian berikutnya ("Terus, suara itu dari mana?").
- Momen nama akun (§10) ditaruh tepat sebelum fakta paling mengejutkan, dengan bentuk kalimat yang berbeda dari 3 video terakhir (§16).
- ❌ Jawaban dibocorkan di hook, atau pertanyaan dibuka tapi tidak pernah dijawab.

### 6. STRUCTURE: susunan alur
- Ikuti alur wajib §12: Hook (±5%) → Masalah (±25%) → Dugaan umum (±10%) → Penyebab (±30%, ada momen nama akun) → Solusi (±20%) → Rangkuman + CTA (±10%).
- Hitung porsi tiap bagian dari `timeline.json` dan tampilkan di laporan.
- ❌ Solusi muncul sebelum Masalah dan Penyebab selesai, atau ada bagian yang hilang.

### 7. VISUAL STORYTELLING: visual menjelaskan, bukan hiasan
- Setiap kalimat penting punya gambar yang **menunjukkan** isinya: perumpamaan digambar, proses dianimasikan, angka divisualkan.
- Gaya animasi dipilih lewat 6 langkah §9 (metafora inti + alasan). Minimal 3 latar (§6) dan 2 pergantian cahaya (§7).
- Ekspresi Adriy berubah minimal 5 kali dan sesuai emosi kalimat (§4, §15). Gerakan kamera (dorong pelan, hentakan zoom) dipakai di momen penting.
- Semua teks ada di dalam kotak aman (x 60–927, y 212–1540).
- ❌ Ilustrasi tidak berhubungan dengan narasi, atau teks di layar hanya mengulang narasi kata per kata tanpa gambar.

### 8. SOUND DESIGN: musik, efek suara, suasana
- Musik berganti mengikuti suasana: masalah tegang → penjelasan ringan → solusi berdrum → penutup hangat (§5). Musik mengecil saat narasi bicara. Sumber musik hanya CC0 atau buatan sendiri.
- Ada efek suara untuk setiap kejadian penting (`projects/sfx-saya/` dulu, lalu `repos/sfx-kit`) tanpa menutupi narasi. Ada suara kejutan di detik pertama.
- Bunyi khas nama akun `sting-bright-short` dan bunyi khas penutup selalu sama (§10, §11).
- Pakai **hening sesaat** sebelum fakta besar supaya terasa.
- ❌ Musik datar dari awal sampai akhir, atau efek suara menumpuk sampai narasi tidak jelas.

### 9. EMOTIONAL TRIGGER: kagum, kaget, penasaran, takut ketinggalan, merasa terhubung
- Tentukan **emosi inti** video (§0) dan tulis di laporan. Arahan suara `_(…)_`, ekspresi Adriy, musik, dan warna harus mendukungnya.
- Ada momen "ini aku banget" di bagian Masalah, dan momen "kok bisa?!" atau takjub di bagian Penyebab.
- Rasa takut ketinggalan dipakai secara jujur ("kebanyakan orang salah soal ini"), tanpa menakut-nakuti atau mengarang.
- ❌ Seluruh video bernada sama, atau emosinya dipaksakan dengan klaim berlebihan.

### 10. CTA: ajakan berkomentar, membagikan, atau mengikuti (§11, §13)
- Urutannya: jembatan → pertanyaan yang gampang dijawab plus contoh jawabannya → alasan untuk menjawab → **satu** CTA kedua (bagikan, simpan, *atau* ikuti, dengan alasan yang spesifik) → "Stay Curious, World!".
- **Catatan bentrokan:** daftar pemilik menyebut "berkomentar, menyukai, membagikan, atau mengikuti". `aturan.md` membolehkan **komentar + satu CTA kedua saja**, tanpa "like, comment, share, follow" sekaligus. Pilih satu CTA kedua dan gilir antarvideo.
- Jenis pertanyaan, kata ajakan, alasan menjawab, dan CTA kedua berbeda dari video sebelumnya sesuai `projects/VARIASI.md` (§16).
- ❌ "Jangan lupa like, comment, share, dan follow!", atau menyebut nama akun di akhir video.

## Kartu Rencana (mode A)

```
Judul (≤ 10 kata, §2):
Emosi inti (§0):
1. Hook: 3 versi → yang dipilih + kode rumus (VARIASI.md, beda dari 2 video terakhir), twist di detik 2–3:
2. Storytelling: tokoh / situasi / perubahan:
3. Pacing: target durasi, jumlah adegan (± 1 per 3–6 detik):
4. Retention: daftar pemicu ulang + detiknya:
5. Curiosity gap: pertanyaan terbuka tiap bagian + jawaban fakta paling mengejutkan:
6. Structure: porsi 6 bagian (§12), detik momen nama akun + kode bentuk kalimatnya (N…):
7. Visual: gaya animasi + metafora inti (§9), 3 latar, 2 pergantian cahaya, 5 emosi Adriy:
8. Sound: musik per suasana, efek suara utama, momen hening:
9. Emotional trigger: momen "aku banget" + momen "kok bisa?!":
10. CTA: pertanyaan (Q…) + contoh jawaban + alasan (R…) + 1 CTA kedua (C…), semuanya dicek ke VARIASI.md:
```

## Contoh tabel nilai (mode B)

| # | Elemen | Nilai | Bukti |
|---|---|---|---|
| 1 | Hook | 5 | "Kelas lagi hening…" langsung masuk momen, twist "belum tentu lapar" di 0:03 |
| 4 | Retention | 3 | 0:58–1:30 hanya penjelasan tanpa kejutan baru (32 detik) |
| 10 | CTA | 4 | Pertanyaan jelas, tetapi tidak ada contoh jawaban |

**3 perbaikan terpenting:** 1) Tambah pemicu ulang di 1:10 ("Tapi ada yang lebih aneh…") … 2) … 3) …
