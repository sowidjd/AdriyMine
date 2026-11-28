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

## Alur narasi cepat untuk video baru

1. Tulis `naskah.json` seperti biasa (id, text, cap, gap).
2. Untuk kalimat yang ada di pustaka, salin file dari `pustaka/hasan/<id>.mp3` ke `projects/<video>/narasi/<id-kalimat>.mp3`.
3. Untuk kalimat lain, buat **satu file per kalimat** lewat ElevenLabs (`creative_generate_speech`, `voice_id` Hasan `AYDmN9T80hHmJLs3rapG`, model `eleven_v4`, `generations_count` 1). Semua kalimat dibuat sekaligus (paralel), lalu diunduh ke `narasi/<id>.mp3`.
4. Jalankan `python3 projects/suara/susun_per_kalimat.py projects/<video> [target-detik]`. Hasilnya `narasi.wav` dan `timeline.json`, tanpa perlu memotong rekaman dengan Whisper.
5. Lanjut seperti biasa: `node render.mjs`, lalu `python3 projects/_bersama/campur.py projects/<video>`.

Suara Adriy (tokoh burung hantu) **tidak** dibuat.
