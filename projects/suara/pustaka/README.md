# Pustaka Suara Arfiy World

Kalimat yang **selalu dipakai di setiap video**, direkam sekali dengan suara kloning **Hasan** (pemilik) dan **Amy** (adik pemilik).
Tujuannya supaya pembuatan narasi lebih cepat: video baru cukup membuat kalimat isinya saja.

- **Audio tidak diunggah ke GitHub**, karena berisi suara kloning orang sungguhan (aturan.md §8, privasi). Yang disimpan hanya `indeks.json`.
- Audio asli tetap tersimpan di akun ElevenLabs, di flow **"Pustaka Suara Arfiy World"** (`F8praD25GHM8k5DMcT7m`). Kalau mesin dimulai ulang, unduh lagi **tanpa biaya kredit**: ambil tautan baru lewat `creative_get_generations` atau `creative_get_flow_run_status` (flow_id + session_id dari `indeks.json`), lalu simpan ke `pustaka/<suara>/<id>.mp3`.
- Model: `eleven_v4`, 1 take per kalimat. Biaya: tahap 1 sekitar 1.600 kredit, tahap 2 (40 frasa umum × 2 suara) sekitar 2.400 kredit (28 Nov 2026).

## Isi tahap 1 (19 kalimat × 2 suara)

| id | Kalimat | Dipakai untuk |
|---|---|---|
| `penutup` | Stay Curious, World! | Kalimat terakhir setiap video (§11) |
| `nama-n2` … `nama-n11` | "Jujur, kami di Arfiy World…", "Di Arfiy World…", "Kami di Arfiy World…", "Soal ini, tim Arfiy World…", "Ini bagian favorit kami di Arfiy World…", "Buat kamu yang baru mampir ke Arfiy World…", "Fakta inilah yang bikin Arfiy World…", "Yang ini jarang dibahas. Tapi di Arfiy World…" | Bagian pertama momen nama channel (§10, bank N di `projects/VARIASI.md`). Sambungan kalimatnya dibuat per video. |
| `cta-giliran` | Nah, sekarang giliran kamu. | Jembatan CTA (§13) |
| `alasan-r2` … `alasan-r8` | Alasan menjawab (bank R di VARIASI.md) | CTA (§13) |
| `jembatan-inidia`, `jembatan-tunggu`, `jembatan-kenapa` | "Nah, ini dia." / "Tapi tunggu dulu." / "Terus, kenapa bisa begitu?" | Pemicu ulang retensi |

Kolom `cek` di `indeks.json` berisi skor kemiripan ucapan (Whisper). **Perhatian:** ucapan "Arfiy World" ditangkap berbeda-beda ("RV/Arfi/Arvia World"), dan `nama-n3` ("Di Arfiy World…") paling meragukan. Dengarkan dulu sebelum dipakai. Kalau kurang pas, buat ulang dengan ejaan "Arfi World".

## Isi tahap 2: frasa umum (40 kalimat × 2 suara)

Kalimat sambungan yang sering muncul di naskah. Pakai sebagai kalimat sendiri (satu baris di `naskah.json`), jangan dipotong di tengah.

| Kelompok | id → kalimat |
|---|---|
| Kejutan / twist | `twist-ternyata` Tapi ternyata… · `twist-bukanitu` Masalahnya bukan itu. · `twist-kaget` Dan ini yang bikin kaget. · `twist-mitos` Ini bukan mitos. · `twist-aneh` Aneh, tapi nyata. · `lebihgila` Dan yang lebih gila lagi… · `fakta-bonus` Satu fakta bonus. |
| Pembuka / hook kecil | `hook-bayangin` Coba bayangin. · `hook-kokbisa` Kok bisa? · `hook-serius` Serius. · `hook-sendiri` Kamu nggak sendirian. · `hook-dengerin` Dengerin baik-baik. · `tebak` Tebak dulu. · `jawabannya` Jawabannya… |
| Alur cerita | `alur-jadigini` Jadi gini… · `alur-banyak` Banyak yang ngira… · `alur-padahal` Padahal… · `alur-ternyata` Ternyata… · `alur-seru` Nah, di sinilah serunya. · `alur-penting` Sekarang, bagian pentingnya. · `alur-gimana` Terus, harus gimana? · `alur-tigacara` Ada tiga cara gampang. · `contoh` Contohnya gini. · `otak` Ternyata, ini kerjaan otak kita. · `sumber-penelitian` Ini bukan kata aku. Ini kata penelitian. |
| Langkah / daftar | `langkah-1` Pertama, · `langkah-2` Kedua, · `langkah-3` Ketiga, · `langkah-akhir` Terakhir, |
| Penutup bagian | `intinya` Intinya, · `kesimpulan` Jadi, kesimpulannya… · `simpel` Simpel, kan? · `ingat` Ingat, ya. |
| Menenangkan | `bukansalahmu` Tenang, itu bukan salah kamu. · `normal` Itu normal banget. · `pernah` Pernah ngalamin juga? |
| Ajakan | `cobasendiri` Nggak percaya? Coba aja sendiri. · `coba-sekarang` Coba deh sekarang. · `cta-ketik` Ketik jawabanmu di komentar. · `cta-kirimteman` Kirim ke temanmu yang kayak gini. |

Catatan variasi (aturan §16): `cta-ketik` dan `cta-kirimteman` tetap harus bergilir dengan bentuk CTA lain di `projects/VARIASI.md`. Jangan dipakai dua video berturut-turut.

## Isi tahap 3: reaksi, transisi, hook, CTA (50 kalimat × 2 suara)

| Kelompok | id → kalimat |
|---|---|
| Reaksi | `r-wah` Wah, ini keren banget. · `r-waduh` Waduh. · `r-hah` Hah? Serius? · `r-sumpah` Sumpah, ini nyata. · `r-gilasih` Gila sih ini. · `r-tunggu` Eh, tunggu. Ini menarik. · `r-akujuga` Jujur, aku juga pernah. · `r-ngakak` Ini bikin ngakak. · `r-sedih` Sedih, tapi ini kenyataannya. · `r-merinding` Ini bikin merinding. |
| Transisi | `t-sebelumitu` Tapi sebelum itu… · `t-balik` Oke, balik lagi ke tadi. · `t-lanjut` Lanjut. · `t-masihada` Eits, masih ada lagi. · `t-terbaik` Dan ini bagian terbaiknya. · `t-kenapapenting` Kenapa ini penting? · `t-ilmuwan` Para ilmuwan nemu jawabannya. · `t-gampangnya` Gampangnya gini. · `t-bayangkalau` Sekarang, bayangin kalau… · `t-faktanya` Faktanya, · `t-bukancuma` Bukan cuma itu. · `t-sederhana` Jadi, intinya sederhana. · `t-akibatnya` Akibatnya? · `t-hasilnya` Hasilnya bikin kaget. · `t-alasannya` Ini alasannya. |
| Hook | `h-janganskip` Jangan skip dulu. · `h-sampaihabis` Tonton sampai habis, ya. · `h-pastipernah` Kamu pasti pernah ngalamin ini. · `h-perhatiin` Coba deh, perhatiin baik-baik. · `h-satumenit` Kasih aku satu menit. · `h-salah` Ternyata, selama ini kita salah. · `h-jarang` Ini jarang banget dibahas. · `h-rahasia` Mau tahu rahasianya? · `h-otakmu` Otakmu lagi ngerjain kamu. · `h-tubuhmu` Tubuhmu ternyata lebih pintar dari yang kamu kira. |
| CTA & penutup | `c-tulis` Tulis di komentar, ya. · `c-jawab` Jawab di komentar. · `c-spill` Spill di komentar. · `c-pilih` Pilih satu. · `c-simpan` Simpan video ini, biar nggak lupa. · `c-ikuti` Ikuti, biar nggak ketinggalan fakta berikutnya. · `c-kirimgrup` Kirim ke grup keluarga. Pasti ada yang kaget. · `c-pin` Jawaban paling lucu aku pin. · `c-terbanyak` Pilihan terbanyak jadi video berikutnya. · `c-balas` Aku balas satu-satu. · `c-umumin` Hasilnya aku umumin di video berikutnya. · `c-jempol` Jawaban yang benar aku kasih jempol. · `c-sampaijumpa` Sampai jumpa di video berikutnya. · `c-makasih` Makasih udah nonton sampai habis. · `c-tebakvideo` Coba tebak, topik video berikutnya apa? |

Kalimat CTA dan alasan (`c-pin`, `c-terbanyak`, `c-balas`, `c-umumin`, `c-jempol`) mengikuti bank R dan C di VARIASI.md, jadi tetap harus bergilir (§16). `c-umumin` dan `c-terbanyak` hanya dipakai kalau janjinya benar-benar ditepati.

## Isi tahap 4: kalimat panjang siap pakai (50 kalimat × 2 suara)

| Kelompok | id → kalimat |
|---|---|
| Pembuka per kategori topik | `k-otak1` Otak kita ternyata suka ngambil jalan pintas, dan kadang jalan pintas itu bikin kita kelihatan aneh. · `k-otak2` Ini bukan karena kamu aneh. Hampir semua orang ngalamin hal yang sama, cuma jarang ada yang ngaku. · `k-hp1` Coba hitung, berapa kali kamu buka HP hari ini tanpa alasan yang jelas? · `k-hp2` Aplikasi di HP kamu memang dirancang supaya kamu susah berhenti scroll. Dan itu bukan kebetulan. · `k-chat1` Ngetik panjang, dihapus, ngetik lagi, terus akhirnya cuma kirim, wkwk. Kamu juga, kan? · `k-chat2` Di chat, kita nggak bisa lihat wajah atau dengar nada suara. Jadi otak kita sibuk nebak-nebak sendiri. · `k-rasa1` Perasaan ini wajar banget, dan ternyata ada penjelasan ilmiahnya. · `k-rasa2` Otak kita lebih gampang inget hal yang bikin malu, daripada hal yang bikin bangga. · `k-uang1` Pernah ngerasa uang gajian cepet banget habisnya, padahal nggak beli apa-apa yang besar? · `k-uang2` Toko tahu persis cara bikin kita merasa untung, padahal kita lagi ngeluarin uang. · `k-waktu1` Kenapa ya, lima menit nunggu rasanya lama banget, tapi lima menit main HP rasanya sebentar? · `k-waktu2` Menunda itu bukan soal malas. Biasanya itu cara otak kita kabur dari perasaan nggak enak. · `k-fakta1` Ini salah satu fakta paling aneh yang pernah aku tahu. · `k-fakta2` Alam ternyata jauh lebih ajaib dari yang kita pelajari di sekolah. |
| Penjelasan | `j-gampang` Biar gampang, bayangin aja kayak gini. · `j-ibarat` Ibaratnya, otak kita itu kayak HP yang memorinya hampir penuh. · `j-prosesnya` Prosesnya kira-kira begini. Pelan-pelan aja, aku jelasin. · `j-kenapabisa` Terus, kenapa bisa begitu? Jawabannya ternyata sederhana. · `j-penelitian` Para peneliti udah nyobain ini ke banyak orang, dan hasilnya hampir selalu sama. · `j-bukansalah` Jadi kalau kamu sering ngalamin ini, itu bukan salah kamu. Itu cara kerja tubuh kita. · `j-anehnya` Anehnya, makin kita berusaha nahan, malah makin sering kejadian. · `j-kabarbaik` Kabar baiknya, ini bisa diakalin. Caranya juga nggak susah. · `j-kabarburuk` Kabar buruknya, kebanyakan orang nggak sadar ini terjadi setiap hari. · `j-angka` Dan angkanya bikin kaget. · `j-ulang` Biar nggak bingung, aku ulang sekali lagi, ya. · `j-intinyadua` Intinya cuma dua hal. Dan dua-duanya bisa kamu coba mulai hari ini. |
| Ajakan (CTA) panjang | `c-komentar-panjang` Sekarang giliran kamu. Pernah ngalamin juga? Ceritain di komentar, cukup satu kalimat. · `c-pilihdua` Kamu tim yang mana? Pilih satu, terus ketik di komentar. · `c-angka` Jujur aja, berapa kali kamu ngalamin ini minggu ini? Ketik angkanya. · `c-tigakata` Ceritain pengalaman kamu, tapi cuma boleh tiga kata. · `c-usul` Mau aku bahas topik apa lagi? Tulis usulanmu, yang paling banyak aku bikin duluan. · `c-kirim-teman` Kirim video ini ke teman kamu yang paling sering begini. Biar dia sadar. · `c-simpan-panjang` Simpan dulu video ini. Nanti kalau kejadian lagi, kamu udah tahu caranya. · `c-ikuti-panjang` Kalau kamu suka fakta-fakta kayak gini, ikuti aja. Tiap minggu ada yang baru. · `c-coba-lapor` Coba praktikkan besok, terus balik ke sini dan ceritain hasilnya. · `c-emoji` Kasih burung hantu di komentar kalau kamu baru tahu. Kasih kura-kura kalau udah tahu dari dulu. |
| Penutup | `p-penutup1` Jadi lain kali kalau ini terjadi lagi, kamu udah tahu alasannya. · `p-penutup2` Ternyata, hal kecil yang kita alami tiap hari punya cerita yang besar. · `p-penutup3` Kadang yang bikin kita penasaran justru hal paling biasa di sekitar kita. · `p-penutup4` Jangan terlalu keras sama diri sendiri. Otak kita memang begitu cara kerjanya. · `p-penutup5` Sekarang kamu tahu sesuatu yang kebanyakan orang belum tahu. · `p-penutup6` Semoga habis ini kamu lihat hal ini dengan cara yang beda. |
| Jembatan & penahan penonton | `b-tapiitu` Tapi itu belum seberapa. Yang berikutnya lebih bikin kaget. · `b-tungguakhir` Dan tunggu sampai akhir, karena ada satu fakta yang paling aku suka. · `b-pertanyaan` Nah, ini pertanyaan yang sering bikin orang salah jawab. · `b-salahpaham` Di sini banyak orang salah paham. · `b-buktinya` Buktinya ada, dan kamu bisa coba sendiri sekarang juga. · `b-cobasekarang` Coba deh sekarang, tahan sebentar, terus rasain bedanya. · `b-ternyatabukan` Ternyata jawabannya bukan yang kamu kira. · `b-satulagi` Oke, satu lagi, dan ini yang paling seru. |

Kalimat `k-` cocok untuk kategori di `projects/IDE-KONTEN.md` (otak, HP, chat, perasaan, uang, waktu, fakta umum). Isinya umum, jadi tetap cek apakah pas dengan fakta video sebelum dipakai.

## Alur narasi cepat untuk video baru

1. Tulis `naskah.json` seperti biasa (id, text, cap, gap).
2. Untuk kalimat yang ada di pustaka, salin file dari `pustaka/hasan/<id>.mp3` ke `projects/<video>/narasi/<id-kalimat>.mp3`.
3. Untuk kalimat lain, buat **satu file per kalimat** lewat ElevenLabs (`creative_generate_speech`, `voice_id` Hasan `AYDmN9T80hHmJLs3rapG`, model `eleven_v4`, `generations_count` 1). Semua kalimat dibuat sekaligus (paralel), lalu diunduh ke `narasi/<id>.mp3`.
4. Jalankan `python3 projects/suara/susun_per_kalimat.py projects/<video> [target-detik]`. Hasilnya `narasi.wav` dan `timeline.json`, tanpa perlu memotong rekaman dengan Whisper.
5. Lanjut seperti biasa: `node render.mjs`, lalu `python3 projects/_bersama/campur.py projects/<video>`.

Suara Adriy (tokoh burung hantu) **tidak** dibuat.
