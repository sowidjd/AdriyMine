---
name: skrip-manusiawi
description: >-
  Membuat naskah video Arfiy World terdengar seperti orang sungguhan bercerita, bukan kaku seperti robot atau tulisan AI.
  Pakai saat pemilik minta "humanise", "biar nggak kayak AI", "kurang natural", "kaku", "terlalu formal",
  atau setiap kali selesai menulis naskah baru (sebelum narasi dibuat). Masukan: file NASKAH.md, blok naskah, atau teks yang ditempel.
---

# Skrip Manusiawi

Tujuannya: penonton merasa **diajak ngobrol teman yang kebetulan tahu banyak**, bukan dibacakan artikel.
Fakta, alur §12, CTA §11/§13 dan ejaan suara §14 di `aturan.md` **tetap berlaku**. Skill ini hanya mengubah *cara bertutur*, bukan isi atau urutan.

## Langkah

1. **Baca** `aturan.md` §11–§14 dan `.claude/youtube-agent/voice-adriy.md` (gaya bicara akun).
2. **Pindai otomatis:**
   `python3 .claude/skills/skrip-manusiawi/cek_ai.py <file-naskah>`
   Hasilnya: frasa khas AI per baris, kalimat > 12 kata, dan irama yang terlalu seragam.
3. **Diagnosis manual** dengan daftar "Ciri AI" di bawah. Tandai tiap baris yang kena, sebutkan cirinya.
4. **Tulis ulang** hanya baris yang kena, pakai "Ciri manusia". Baris yang sudah enak jangan diutak-atik.
5. **Baca keras-keras dalam kepala.** Setiap kalimat harus bisa diucapkan sekali napas oleh orang Indonesia umur 20-an ke temannya. Kalau terdengar seperti presenter berita atau buku pelajaran, tulis ulang.
6. **Jalankan pindai lagi** sampai bersih (atau sisa temuan memang disengaja, beri alasannya).
7. **Laporkan** ke pemilik dalam bahasa Indonesia sederhana: tabel *sebelum → sesudah* untuk baris yang diubah, plus skor (lihat Skor).
   Fakta, angka, sumber, momen nama akun dan penutup "Stay Curious, World!" **tidak boleh berubah maknanya**.

## Ciri AI (hindari)

**Frasa pembuka & penghubung klise**
- "Pernahkah kamu bertanya-tanya…", "Tahukah kamu…", "Mari kita…", "Yuk, simak…", "Di era (digital/modern) ini…"
- "Faktanya,", "Menariknya,", "Uniknya,", "Selain itu,", "Oleh karena itu,", "Dengan demikian,", "Pada akhirnya,", "Namun,"
- "Bukan hanya X, tetapi juga Y", "Lebih dari sekadar…", "Ini bukan sekadar…, ini adalah…"
- "fenomena menarik", "menyelami", "mengungkap rahasia", "dunia … yang menakjubkan", "tak terduga", "luar biasa" berulang
- Penutup bagian berupa pelajaran moral: "Jadi, ingatlah bahwa…", "Hal ini menunjukkan bahwa…"

**Kata baku yang bikin kaku** → ganti
| Kaku | Ngobrol |
|---|---|
| tidak | nggak |
| sangat | banget (di belakang kata) |
| dapat | bisa |
| hal ini / hal tersebut | ini / itu / sebut bendanya |
| merupakan / adalah (di tengah kalimat) | hapus, atau "itu" |
| sebuah / seorang | biasanya hapus saja |
| oleh karena itu | makanya / jadi |
| namun | tapi / padahal |
| Anda | kamu |
| melakukan (sesuatu) | langsung kata kerjanya ("melakukan pengecekan" → "ngecek") |

**Pola struktur**
- Semua kalimat panjangnya mirip (irama datar seperti metronom).
- Selalu tiga hal berderet ("cepat, kuat, dan cerdas") di hampir setiap bagian.
- Pertanyaan retoris beruntun ("Kenapa? Bagaimana bisa? Apa artinya?").
- Contoh umum tanpa detail ("saat kamu sedang beraktivitas").
- Setiap bagian ditutup kesimpulan rapi. Manusia sering langsung lompat.
- Tanda pisah panjang (—) dan titik koma (;): suara AI membacanya aneh, dan orang tidak bicara begitu.
- Terlalu sopan & netral, tanpa reaksi atau pendapat.

## Ciri manusia (pakai)

- **Detail sehari-hari Indonesia yang spesifik:** grup WA keluarga, antre di Indomaret, angkot ngetem, upacara Senin, nasi padang bungkus. Bukan "suatu tempat" atau "aktivitas sehari-hari".
- **Reaksi kecil:** "Eh, serius.", "Lho, kok bisa?", "Nah, ini dia.", "Aneh, kan?" (secukupnya, ± 1 per bagian, jangan tiap kalimat).
- **Irama naik-turun:** kalimat sedang, lalu satu kalimat super pendek ("Dua kali. Semenit."), lalu sedang lagi.
- **Pengakuan / sudut pandang:** "Aku juga dulu ngira gitu." "Jujur, ini bikin kami melongo." (tetap tanpa "gue/lo").
- **Bicara ke satu orang:** "kamu", bukan "kita semua" atau "para penonton".
- **Perumpamaan dari dunia penonton**, bukan perumpamaan buku ("kayak petugas kebersihan yang nyapu", bukan "berfungsi sebagai mekanisme pembersihan").
- **Angka diucapkan seperti orang ngobrol:** "sekitar dua jam", "satu setengah", bukan "120 menit" kecuali memang angka kejutnya.
- **Sedikit humor / jahil** di bagian masalah (sesuai nada akun: hangat, sedikit jahil, kagum bersama).
- **Callback:** ulang satu gambaran dari hook di rangkuman ("Jadi lain kali perutmu bunyi pas ujian…").

## Batas yang tidak boleh dilanggar

- Kalimat **≤ ± 12 kata** (§14), kata rawan "c" dan singkatan ketik tetap diganti sesuai §14.
- Jangan menambah fakta, angka, atau klaim baru demi terdengar seru.
- Jangan pakai "gue/lo", kata kasar, atau slang yang cepat basi.
- Reaksi & humor tidak boleh menenggelamkan penjelasan. Bagian penyebab tetap jelas, satu ide per kalimat.
- Arahan suara dalam kurung `_(…)_` tetap dalam bahasa Inggris dan disesuaikan dengan emosi kalimat yang baru.

## Contoh

| Sebelum (kaku / AI) | Sesudah (manusia) | Ciri yang dibuang |
|---|---|---|
| Pernahkah kamu bertanya-tanya mengapa perut berbunyi? | Kelas lagi hening. Tiba-tiba, perutmu bunyi. | pembuka klise, pertanyaan umum |
| Faktanya, burung gagak merupakan hewan yang sangat cerdas. | Gagak itu pinter. Pinter banget, malah. | "faktanya", "merupakan", "sangat" |
| Hal ini menunjukkan bahwa usus selalu bekerja. | Jadi ususmu itu nggak pernah libur. | moral rapi, "hal ini" |
| Fenomena ini tidak hanya menarik, tetapi juga penting untuk dipahami. | (hapus, langsung ke penjelasan) | "bukan hanya… tetapi juga", basa-basi |
| Paus biru memiliki jantung yang berdetak sangat lambat, cepat dan kuat. | Jantung paus biru cuma berdetak dua kali. Semenit. | daftar tiga, irama datar |

## Skor (laporkan di akhir)

Beri nilai 1–5 untuk tiap poin, sebelum dan sesudah:
1. **Ngobrol:** terdengar seperti bicara ke teman, bukan membaca.
2. **Spesifik:** ada detail Indonesia yang nyata, bukan contoh umum.
3. **Irama:** panjang kalimat bervariasi, ada kalimat pendek yang "nendang".
4. **Bebas klise:** tidak ada frasa di daftar Ciri AI (atau ada alasan kuat).
5. **Tetap patuh aturan:** ≤ 12 kata, ejaan §14, fakta tidak berubah.

Naskah siap dipakai bila semua poin ≥ 4.
