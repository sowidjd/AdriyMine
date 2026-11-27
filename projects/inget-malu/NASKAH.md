# Naskah: "Lagi seneng, tiba-tiba inget kejadian malu 5 tahun lalu"

- **Status:** video jadi (2:56.9). Narasi: ElevenLabs (suara "Marto", model v4), dibuat pemilik dari `NASKAH-ELEVENLABS.txt`, lalu dipotong per kalimat dengan waktu kata Whisper dan disusun ulang (`susun_narasi.py`): jeda di dalam kalimat dipadatkan (maks. 0,14 detik), tempo 1,1× (nada tetap, batas §12).
- **Catatan durasi:** target awal 2:49 tidak tercapai karena suara ElevenLabs lebih lambat (isi suara 3:03 sebelum dipercepat). Pemilik memilih jeda wajar, jadi durasi akhir 2:57 (batas maksimal §12).
- **Cek ucapan (Whisper, 65 kalimat):** semua lolos ≥ 0,85 setelah perbaikan potongan ("Tiba-tiba", "Serius"). Hasil per kalimat ada di `cek_ucapan_hasil.txt`.
- **Catatan aturan:** §8 mewajibkan suara tiruan pemilik. Video ini memakai suara ElevenLabs "Marto" atas pilihan pemilik.
- **Tema (§1):** 7. 😳 Perasaan & pikiran (Sehari-hari). Video sebelumnya (#8 Gagak) bertema Umum ✓. Kategori berbeda dari #7 dan #8 ✓.
- **Ide:** `IDE-KONTEN.md` no. 19 ⭐. **Tidak ada di `SUDAH-DIBUAT.md`** ✓. Topik ini berbeda dari "Merasa diperhatikan saat sendirian" dan "Gampang iri". Video #3 (wkwk) memakai *spotlight effect*, jadi efek itu sengaja **tidak** dipakai lagi.
- **Tiga Tips (§0):**
  - 3: "ini gue banget", tiba-tiba ingat kejadian malu saat sedang santai.
  - 2: membantah "aku lebay / ada yang salah sama aku". Ternyata ini cara kerja otak yang normal.
  - 1: malu-lucu, lalu lega.
  - **Emosi inti:** malu-lucu → lega.
- **Durasi target awal:** **± 2:49 (169 detik)**, permintaan pemilik. Naskah 422 kata dalam 65 kalimat. Perkiraan durasi **2:49.0**, dihitung dari rata-rata 3 video terakhir (0.401 detik per kata, sudah termasuk jeda dan kartu penutup). Setelah narasi jadi, durasi dikunci ke 2:49 lewat `skala_jeda` (dan tempo maks. 1,1× bila perlu, §12).

## Gaya animasi (§9, 6 langkah)
1. **Metafora inti:** ingatan = tumpukan lembar kertas di dalam kepala. Momen malu adalah satu lembar yang tiba-tiba **"pop-up"** ke depan tanpa diminta, seperti buku pop-up.
2. **Gaya:** **Papercut** (skill `/papercut`, `projects/_bersama/papercut.js`), dibantu kinetic typography (`/kinetic-typography`) hanya untuk hook dan rangkuman.
3. **Alasan 1 kalimat:** Gaya papercut dipilih karena kenangan malu di judul terlihat sebagai lembar kertas lama yang tiba-tiba berdiri dari tumpukan, persis seperti ingatan yang muncul sendiri.
4. **Suasana:** gaya kertas lembut cocok untuk tema perasaan yang malu-lucu (§9 menyarankan Paper-cut untuk 😳) ✓.
5. **Selang-seling:** video sebelumnya memakai woodcut ✓.
6. **Teknis:** Canvas 2D ringan, tanpa WebGL.
- **Cahaya (§7):** kamar malam dengan lampu tidur (palet `malam`) → penjelasan di "dalam kepala" (`permen`, terang) → solusi pagi (`senja` hangat). Video sebelumnya berwarna kertas krem terang, jadi video ini dibuka gelap ✓.
- **Latar (§6):** kamar kos (kasur, kipas angin, HP menyala), kamar mandi (gayung, keramik), "dalam kepala" (rak kertas kenangan), meja belajar pagi.

## Variasi (§16, `projects/VARIASI.md`)
| Bagian | Pilihan | Cek |
|---|---|---|
| Hook | **H1 Cermin**, dengan twist H5 Kebalikan | Bukan H3/H6 ✓. Kata pertama "Lagi", bukan "Jangan" ✓ |
| Nama channel | **N6 Bagian favorit**: "Ini bagian favorit kami di Arfiy World…" | Bukan N1 ✓. Tidak ada kata kerja baca/mempelajari ✓ |
| Pertanyaan CTA | **Q9 Tiga kata** | Bukan Q4/Q1 ✓. Kata ajakan "Ceritain", bukan "Tulis" ✓ |
| Alasan menjawab | **R2** "Jawaban paling lucu aku pin." | Bukan R1/R7 ✓ |
| CTA kedua | **C1 Kirim ke teman yang spesifik** | Bukan C3 ✓ |

## Hook (3 versi, §3)
1. ✅ **Dipilih (Cermin + Kebalikan):** "Lagi rebahan, senyum-senyum sendiri. Tiba-tiba, inget kejadian memalukan lima tahun lalu." → twist: "Tenang. Kamu bukan lebay."
2. Fakta mengejutkan: "Otakmu nyimpen momen paling malumu. Dan dia suka muter ulang tanpa izin."
3. Kebalikan: "Kamu bukan lebay. Otakmu memang sengaja nyimpen momen malu itu."
- **Alasan memilih versi 1:** penonton langsung melihat dirinya di detik 0 (rebahan, senyum). Twist "bukan lebay" di detik 3 membantah dugaan bahwa dirinya aneh.
- **Teks hook di layar (≤ 7 kata):** "Lagi seneng… tiba-tiba INGET INI" (kata kunci kuning). **Efek suara detik 0:** notifikasi HP lalu "boing" kertas pop-up.

## Cek fakta
| Klaim di naskah | Sumber |
|---|---|
| Kebanyakan orang mengalami ingatan yang muncul sendiri (tanpa sengaja diingat) **beberapa kali sehari** | Berntsen, *Involuntary Autobiographical Memories* (Cambridge Univ. Press, 2009), ringkasan studi buku harian; Schlagman & Kvavilashvili: rata-rata 17 per minggu (± 2–3 per hari). Di naskah ditulis "beberapa kali sehari", tanpa angka pasti. |
| Ingatan seperti itu biasanya dipicu "kunci" kecil di sekitar (lagu, bau, kata, tempat yang mirip) | Berntsen (wawancara, dikutip NBC News "Why memory lane is such a mortifying stroll"); kajian ingatan tak sengaja (Memory & Cognition) |
| Paling sering muncul saat pikiran santai: kegiatan rutin, mandi, rebahan, menjelang tidur | Kajian ingatan tak sengaja (perhatian "menyebar" saat kegiatan rutin); Berntsen via NBC News |
| Ingatan yang muncul sendiri lebih "kena" ke perasaan dibanding yang sengaja diingat | Kajian ingatan tak sengaja (lebih berdampak pada suasana hati); D. Hallford (psikolog klinis) via Medical Xpress 2022 |
| Momen yang bikin emosi naik disimpan lebih kuat. Amigdala dan hormon stres (seperti adrenalin) membantu "mengunci" ingatan | McGaugh, *Annual Review of Neuroscience* 2004 (hipotesis modulasi memori); Cahill & McGaugh |
| Salah satu penjelasan: otak lebih waspada pada hal buruk supaya kita belajar dan tidak mengulanginya | Penjelasan para peneliti, dikutip Medical Xpress 2022 dan Discover Magazine. Di naskah ditulis sebagai **"salah satu penjelasan"**. |
| Rasa tidak enak dari kenangan buruk biasanya memudar lebih cepat daripada rasa senang dari kenangan baik (*fading affect bias*) | Walker, Skowronski & Thompson 2003 (*Review of General Psychology*); disebut juga di Medical Xpress 2022 |
| Pikiran yang ditekan atau diusir paksa justru lebih sering muncul (percobaan "beruang putih") | Wegner, Schneider, Carter & White 1987, *Journal of Personality and Social Psychology* |
| Memberi nama perasaan ("ini rasa malu") meredam aktivitas amigdala | Lieberman dkk. 2007, *Psychological Science* 18(5), "Putting feelings into words" |
| Berbicara pada diri sendiri pakai nama sendiri (bukan "aku") mengurangi reaksi emosi saat mengingat pengalaman buruk | Kross dkk. 2014, *JPSP* 106; Orvell dkk. 2020, *Clinical Psychological Science* |

## Naskah

**HOOK**
- Lagi rebahan, senyum-senyum sendiri.  _(warm, relaxed, smiling)_
- Tiba-tiba, inget kejadian memalukan lima tahun lalu.  _(sudden shock, comedic)_
- Tenang. Kamu bukan lebay.  _(firm, reassuring)_
- Otakmu memang lagi ngelakuin sesuatu.  _(mysterious, curious)_

**MASALAH**
- Kamu pasti pernah ngalamin ini.  _(friendly storytelling)_
- Lagi mandi, nyiram air, pikiran kosong.  _(calm, storytelling)_
- Terus muncul momen itu.  _(slower, tense)_
- Salah panggil guru jadi "Mama".  _(embarrassed, comedic)_
- Atau lambai balik, padahal orangnya nyapa orang di belakangmu.  _(comedic, cringing)_
- Mukamu panas sendiri, di kamar mandi.  _(comedic, embarrassed)_
- Pengen ngilang aja rasanya.  _(whispering, comedic)_
- Malam juga sama.  _(soft, tired)_
- Udah matiin lampu, udah siap tidur.  _(sleepy, calm)_
- Eh, yang muncul malah chat salah kirim zaman SMP.  _(sudden, comedic panic)_
- Kamu langsung tutup muka pakai bantal.  _(comedic, groaning)_
- Padahal kejadiannya udah bertahun-tahun.  _(puzzled)_
- Padahal orang lain kayaknya udah lupa.  _(puzzled, slower)_
- Yang bikin kesal, kenangan senangnya jarang muncul begini.  _(annoyed, comedic)_
- Kenapa yang diputar ulang malah yang paling malu?  _(curious, slower)_

**DUGAAN UMUM**
- Banyak yang ngira, ini tanda ada yang salah.  _(thoughtful)_
- "Aku kok baperan banget, ya?"  _(self-mocking)_
- Terus kita maksa ngusir pikirannya.  _(light, comedic)_
- Geleng-geleng kepala, sambil bilang, "Udah, lupain!"  _(comedic, frustrated)_
- Hasilnya? Malah makin kebayang.  _(deadpan, comedic)_

**PENYEBAB**
- Ternyata, ini kerja otak yang normal banget.  _(clear explainer, reassuring)_
- Namanya ingatan yang muncul sendiri, tanpa kamu panggil.  _(clear explainer, intrigued)_
- Penelitian buku harian menemukan, ini terjadi beberapa kali sehari.  _(clear explainer)_
- Ke semua orang, bukan ke kamu doang.  _(warm, reassuring)_
- Ingatan ini butuh "kunci" kecil buat kebuka.  _(playful explainer)_
- Bisa lagu, bau, satu kata, atau tempat yang mirip.  _(clear explainer)_
- Dan paling gampang muncul pas pikiranmu lagi santai.  _(clear explainer)_
- Kayak pas mandi, rebahan, atau mau tidur.  _(light, knowing)_

**MOMEN ARFIY WORLD**
- Ini bagian favorit kami di Arfiy World...  _(warm, proud, slower, clear emphasis on the channel name)_
- kenapa yang nongol justru momen malu?  _(curious, leaning in)_

**PENYEBAB (lanjutan)**
- Waktu kamu malu, jantungmu deg-degan, mukamu panas.  _(vivid, slightly tense)_
- Di saat itu, bagian otak bernama amigdala ikut sibuk.  _(clear explainer, intrigued)_
- Dibantu hormon stres, dia "mengunci" momen itu lebih kuat.  _(clear explainer, emphasis)_
- Makanya kejadian malu terasa jelas banget, bertahun-tahun kemudian.  _(clear explainer)_
- Salah satu penjelasannya, otak lebih waspada sama hal buruk.  _(thoughtful)_
- Dia pengen kamu belajar, biar nggak ngulang lagi.  _(warm, understanding)_
- Jadi, otakmu bukan jahat. Dia lagi jagain kamu.  _(warm, clear payoff)_
- Serius.  _(soft, sincere, short pause after)_
- Dan kabar baiknya, rasa malu memudar lebih cepat.  _(relieved, hopeful)_
- Lebih cepat daripada rasa senang dari kenangan indah.  _(warm, hopeful)_

**SOLUSI**
- Terus, pas momen itu nongol lagi, harus ngapain?  _(curious, upbeat)_
- Pertama, jangan diusir paksa.  _(confident, clear)_
- Ada percobaan terkenal: orang disuruh jangan mikirin beruang putih.  _(playful explainer)_
- Hasilnya, beruang putihnya malah makin sering muncul.  _(comedic, amused)_
- Jadi biarkan aja dia lewat.  _(calm, gentle)_
- Kayak awan lewat di langit.  _(dreamy, soft)_
- Kedua, kasih nama perasaannya.  _(confident, clear)_
- Bilang dalam hati, "Oh, ini rasa malu."  _(gentle, demonstrative)_
- Peneliti menemukan, menamai perasaan bikin amigdala lebih tenang.  _(clear explainer)_
- Ketiga, ngomong ke dirimu pakai namamu sendiri.  _(confident, warm)_
- Misalnya, "Rina, itu lima tahun lalu. Kamu udah beda."  _(gentle, demonstrative)_
- Bicara begini bikin kamu lihat dari jauh, dan rasanya lebih ringan.  _(warm, reassuring)_
- Tiga langkah. Gampang, kan?  _(upbeat, playful)_

**RANGKUMAN + CTA**
- Jadi, momen malu itu bukan tanda kamu aneh.  _(warm, conclusive)_
- Itu tanda otakmu peduli sama kamu.  _(warm, smiling)_
- Nah, sekarang giliran kamu.  _(cheerful, inviting)_
- Ceritain momen paling malumu, cukup tiga kata.  _(playful, teasing)_
- Misalnya, "panggil guru Mama."  _(comedic, light)_
- Jawaban paling lucu aku pin.  _(cheerful, teasing)_
- Terus, kirim ke teman yang dulu ada di momen itu.  _(friendly, playful)_
- Stay Curious, World!  _(warm, confident, gentle smile in the voice, medium tempo)_

## Judul, caption & tagar
- **Judul (≤ 10 kata):** Lagi seneng, tiba-tiba inget kejadian malu 5 tahun lalu
- **Caption:** Kenapa otak suka muter ulang momen paling malu, pas kita lagi santai? Ternyata ini cara otak jagain kita 🦉 Sumber: Berntsen (ingatan tak sengaja), McGaugh 2004, Wegner 1987, Lieberman 2007, Kross 2014.
- **Tagar:** #ArfiyWorld #StayCuriousWorld #faktapsikologi #malu #overthinking #ingatan #relate #edukasi #faktaunik #fyp

## Yang perlu disiapkan sebelum produksi
- Efek suara tema 7 masih ⭐: tambah **soft piano** dan **room tone** (aturan §1). Efek lain: notifikasi HP, "boing" kertas pop-up, gemerisik kertas, bantal, guyuran air.
- **Musik CC0** (Tallbeard Studios Music Loop Bundle, CC0-1.0, lewat `projects/musik/ambil_musik.py`): *Sketchbook 2024-02-28_01* (playful) untuk hook–dugaan, *Sketchbook 2023-11-29* (dreamy) untuk penyebab, *LD 06* (`ludum-dare-30-06`, uplifting) untuk solusi–akhir.
- **Efek suara:** soft piano & room tone dari koleksi ElevenLabs pemilik (`musik_piano_arpeggio_lembut`, `suasana_malam_sepi`) ✓, sfx-kit (CC0), dan bunyi kertas buatan kode.
- Ejaan suara (§14): cek "amigdala", "Arfiy World" ("Arfi Werld"), dan "Stay Curious, World!" dengan `cek_ucapan.py`.
