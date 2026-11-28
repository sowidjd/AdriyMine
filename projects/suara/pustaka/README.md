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

## Isi tahap 5: Adriy, sains, situasi, emosi (50 kalimat × 2 suara)

| Kelompok | id → kalimat |
|---|---|
| Adriy | `a-adriy-kaget` Adriy aja sampai lepas kacamata waktu tahu fakta ini. · `a-adriy-tanya` Adriy punya satu pertanyaan buat kamu. · `a-adriy-catat` Adriy udah nyatet poin pentingnya. Ini dia. · `a-adriy-bingung` Bahkan Adriy, si burung hantu paling penasaran, sempat bingung sama yang satu ini. |
| Sains & penjelasan | `s-tubuh` Tubuh kita punya cara kerja yang jauh lebih rumit dari yang kelihatan. · `s-otak-hemat` Otak itu sebenarnya pemalas. Dia selalu cari cara paling hemat tenaga. · `s-evolusi` Dulu, kebiasaan ini membantu nenek moyang kita bertahan hidup. · `s-hormon` Di balik semua ini, ada hormon yang diam-diam bekerja. · `s-bayi` Bahkan bayi pun sudah punya kemampuan ini sejak lahir. · `s-hewan` Dan ternyata, hewan juga ngalamin hal yang mirip. · `s-ukur` Peneliti mengukurnya, dan hasilnya cukup jelas. · `s-belum` Sampai sekarang, ilmuwan masih belum sepenuhnya paham kenapa. · `s-teori` Ada beberapa teori. Tapi yang paling masuk akal begini. · `s-contoh-sehari` Contoh paling gampang ada di kehidupan sehari-hari kita. · `s-bandingkan` Coba bandingkan dua hal ini. · `s-detik` Semua itu terjadi cuma dalam hitungan detik. · `s-tanpa-sadar` Dan semua ini terjadi tanpa kita sadari. · `s-tiap-hari` Ini terjadi ke kita hampir setiap hari. · `s-mitos-salah` Banyak yang percaya ini benar. Padahal, penelitian bilang sebaliknya. · `s-separuh` Hampir separuh orang ternyata ngalamin hal yang sama. |
| Situasi sehari-hari | `w-pagi` Coba ingat-ingat kejadian tadi pagi. · `w-malam` Biasanya, ini paling terasa waktu malam, pas mau tidur. · `w-sekolah` Pasti pernah kejadian waktu di sekolah, kan? · `w-kerja` Di kantor, di sekolah, atau di rumah, semua orang pernah ngalamin. · `w-hp-tangan` Mungkin sekarang pun kamu lagi pegang HP sambil ngalamin ini. · `w-teman` Pasti kamu punya satu teman yang begini banget. · `w-keluarga` Coba tanya orang tuamu. Mereka pasti pernah ngalamin juga. · `w-sendiri` Coba rasain sendiri, pelan-pelan. |
| Emosi & menenangkan | `e-lega` Lega, kan? Ternyata bukan cuma kamu. · `e-seram` Kedengarannya seram. Tapi tenang, ini nggak bahaya. · `e-lucu` Lucu, ya? Tubuh kita kadang ngelawak sendiri. · `e-bangga` Kamu boleh bangga. Tubuhmu ternyata keren. · `e-hati-hati` Tapi hati-hati. Kalau berlebihan, ini bisa jadi masalah. · `e-dokter` Kalau ini sering banget terjadi dan bikin nggak nyaman, coba konsultasi ke dokter. · `e-pelan` Pelan-pelan aja. Nggak perlu langsung sempurna. · `e-mulai-kecil` Mulai dari yang kecil dulu. Satu langkah aja cukup. |
| Rangkuman | `r-kesimpulan1` Jadi, bukan kamu yang aneh. Otakmu cuma sedang bekerja. · `r-kesimpulan2` Yang kelihatan sepele, ternyata ada alasannya. · `r-kesimpulan3` Sekarang kamu bisa jelasin ini ke teman-temanmu. · `r-tiga-poin` Kita rangkum jadi tiga poin, ya. · `r-ingat-satu` Kalau cuma bisa ingat satu hal dari video ini, ingat yang ini. |
| Pertanyaan & ajakan | `x-tanya-pernah` Kamu pernah sadar nggak, kalau ini terjadi? · `x-tanya-kenapa` Pernah kepikiran nggak, kenapa ini bisa terjadi? · `x-tanya-tahu` Kamu udah tahu ini belum? Jujur, ya. · `x-tanya-coba` Berani coba? Lakuin sekarang, terus lihat yang terjadi. · `x-video-lain` Kalau kamu suka yang begini, masih banyak fakta lain di akun ini. · `x-sampai-sini` Kalau kamu nonton sampai sini, kamu keren. · `x-cerita-kamu` Aku pengen dengar cerita kamu. Tulis di komentar, ya. · `x-share` Bagikan ke satu orang yang menurutmu harus tahu ini. · `x-besok` Besok, coba perhatiin. Pasti kamu bakal sadar. |

Kalimat sains (`s-`) bersifat umum: hanya dipakai kalau memang sesuai dengan fakta yang sudah dicek (aturan §5). `s-separuh` ("hampir separuh orang") hanya untuk topik yang datanya benar-benar sekitar 50%.

## Isi tahap 6


### Situasi pembuka

| id | kalimat |
|---|---|
| `o-alarm` | [playful] Alarm bunyi, kamu matiin, terus bilang lima menit lagi. Tahu-tahu, sudah setengah jam lewat. |
| `o-scroll` | [curious] Niatnya cuma buka HP sebentar. Tapi pas sadar, satu jam sudah hilang entah ke mana. |
| `o-lupa` | [curious] Masuk kamar, terus lupa mau ngambil apa. Kok bisa, ya, otak kita tiba-tiba kosong begitu? |
| `o-deg` | [thoughtful] Pernah nggak, jantung berdebar kencang padahal kamu cuma mau ngomong di depan kelas? |
| `o-checkout` | [playful] Keranjang belanja penuh, jari sudah di tombol bayar. Terus kamu mikir, sebenarnya butuh nggak, sih? |
| `o-tidur` | [calmly] Badan sudah capek banget, tapi pas rebahan, otak malah mulai mikirin hal yang nggak penting. |
| `o-notif` | [curious] Satu bunyi notifikasi, dan fokus kamu langsung buyar. Ternyata ada alasan kenapa itu susah dilawan. |
| `o-lapar` | [playful] Baru makan dua jam yang lalu, tapi kok sudah lapar lagi? Ternyata ini bukan cuma soal perut. |
| `o-ngantuk` | [calmly] Jam dua siang, mata rasanya berat banget. Kamu nggak malas, ini memang jamnya tubuh minta istirahat. |
| `o-malu` | [warmly] Kejadiannya sudah lama banget, tapi tiap ingat, mukamu masih panas. Tenang, kamu nggak sendirian. |

### Fakta umum

| id | kalimat |
|---|---|
| `f-hewan` | [amazed] Ada hewan yang kemampuannya jauh melampaui manusia, dan kita jarang banget membicarakannya. |
| `f-angkasa` | [amazed] Kalau kamu lihat bintang malam ini, cahaya yang kamu lihat mungkin sudah berangkat ribuan tahun yang lalu. |
| `f-laut` | [mysterious] Lebih dari separuh dasar laut masih belum dipetakan dengan detail. Dan di sana, banyak hal yang belum kita kenal. |
| `f-tubuh` | [amazed] Jantungmu terus berdetak tanpa disuruh, bahkan waktu kamu tidur nyenyak. |
| `f-sejarah` | [thoughtful] Kebiasaan yang kita anggap biasa hari ini, ternyata punya cerita panjang dari ratusan tahun yang lalu. |
| `f-teknologi` | [curious] Benda kecil di sakumu itu ternyata jauh lebih canggih dari komputer yang dulu dipakai untuk ke bulan. |
| `f-bahasa` | [playful] Ada kata dalam bahasa kita yang ternyata asalnya dari bahasa yang jauh sekali. |
| `f-makanan` | [curious] Makanan yang kamu makan tiap hari ternyata punya rahasia kecil yang jarang orang tahu. |
| `f-cuaca` | [thoughtful] Hujan yang turun hari ini, airnya mungkin sudah berkeliling dunia berkali-kali. |
| `f-warna` | [curious] Warna yang kamu lihat ternyata nggak selalu sama dengan yang dilihat orang lain. |

### Langkah & tips

| id | kalimat |
|---|---|
| `l-pertama` | [confidently] Langkah pertama paling gampang. Kamu cuma perlu sadar kalau ini sedang terjadi. |
| `l-kedua` | [confidently] Langkah kedua, kasih jeda sebentar sebelum kamu bereaksi. |
| `l-ketiga` | [confidently] Dan langkah ketiga, ulangi terus sampai jadi kebiasaan baru. |
| `l-dua-menit` | [upbeat] Coba trik dua menit ini. Kalau sesuatu bisa selesai dalam dua menit, langsung kerjakan sekarang. |
| `l-tarik-napas` | [calmly] Tarik napas pelan-pelan, tahan sebentar, lalu hembuskan lebih lama dari waktu tarik napasnya. |
| `l-catat` | [friendly] Coba catat setiap kali ini terjadi. Dalam seminggu, kamu bakal lihat polanya. |
| `l-jauhkan` | [friendly] Jauhkan HP dari tempat tidur. Hal kecil ini ternyata efeknya besar. |
| `l-air` | [upbeat] Kadang, segelas air putih saja sudah cukup buat bikin badan terasa lebih segar. |
| `l-gerak` | [upbeat] Berdiri, regangkan badan sebentar. Otakmu bakal berterima kasih. |
| `l-tunda` | [thoughtful] Sebelum beli sesuatu, tunggu satu hari. Kalau besok masih mau, baru beli. |

### Twist & kesimpulan

| id | kalimat |
|---|---|
| `k-twist1` | [surprised] Tapi ternyata, yang selama ini kita salahkan justru bukan penyebab utamanya. |
| `k-twist2` | [mysterious] Dan di sinilah ceritanya mulai jadi aneh. |
| `k-twist3` | [excited] Bagian paling gilanya baru datang sekarang. |
| `k-twist4` | [thoughtful] Kedengarannya sepele, tapi efeknya bisa terasa bertahun-tahun. |
| `k-twist5` | [surprised] Yang bikin kaget, ini bukan cuma terjadi di kita. Hampir semua orang di dunia ngalamin. |
| `k-bukti` | [confidently] Dan ini bukan kata orang. Ini hasil penelitian yang bisa kamu cek sendiri. |
| `k-hitung` | [curious] Kalau dihitung, angkanya jauh lebih besar dari yang kamu bayangkan. |
| `k-bayangkan` | [curious] Bayangkan kalau ini terjadi setiap hari, selama setahun penuh. |
| `k-bandingkan` | [playful] Kalau dibandingkan, rasanya kayak membandingkan semut sama gajah. |
| `k-kesimpulan` | [warmly] Jadi, lain kali kamu ngalamin ini, ingat, tubuhmu sebenarnya sedang berusaha melindungi kamu. |

### CTA

| id | kalimat |
|---|---|
| `c-tim` | [playful] Kamu tim yang langsung, atau tim yang nunda dulu? Ketik di komentar, ya. |
| `c-tebak` | [playful] Coba tebak jawabannya sebelum aku kasih tahu. Tulis tebakanmu di komentar. |
| `c-angka2` | [playful] Dari satu sampai sepuluh, seberapa sering kamu ngalamin ini? Ketik angkanya. |
| `c-kirim2` | [playful] Kirim ke teman yang selalu bilang lima menit lagi. Dia pasti tahu maksudnya. |
| `c-simpan2` | [friendly] Simpan video ini. Nanti waktu kamu ngalamin lagi, buka dan coba tipsnya. |
| `c-ikut2` | [warmly] Ikuti Adriy, biar tiap hari ada satu hal baru yang bikin kamu penasaran. |
| `c-cerita2` | [warmly] Punya pengalaman yang lebih aneh dari ini? Ceritain di komentar, aku pengen baca. |
| `c-video2` | [upbeat] Mau aku bahas bagian duanya? Ketik lanjut di komentar. |

### Penutup

| id | kalimat |
|---|---|
| `p-tutup1` | [warmly] Dunia ini penuh hal aneh yang menunggu buat dipahami. Dan kamu baru saja memahami satu lagi. |
| `p-tutup2` | [warmly] Terima kasih sudah penasaran bareng aku hari ini. |

## Isi tahap 7


### Kalimat serbaguna (sambungan, ajakan, penutup)

| id | kalimat |
|---|---|
| `g-kok-bisa` | [curious] Kok bisa, ya? Ternyata jawabannya ada di dalam kepala kita sendiri. |
| `g-jangan-skip` | [playful] Jangan di-skip dulu. Bagian terbaiknya ada di akhir. |
| `g-pernah-ngerasa` | [thoughtful] Pernah ngerasa begini juga? Ternyata ada penjelasan ilmiahnya. |
| `g-ini-normal` | [warmly] Tenang, ini normal banget. Hampir semua orang pernah ngalamin. |
| `g-kebanyakan-orang` | [curious] Kebanyakan orang nggak sadar kalau ini terjadi setiap hari. |
| `g-coba-sekarang` | [upbeat] Coba lakukan sekarang juga. Cuma butuh beberapa detik. |
| `g-rahasianya` | [mysterious] Rahasianya ternyata sederhana, tapi jarang orang tahu. |
| `g-salah-kaprah` | [confidently] Ini salah kaprah yang sudah lama dipercaya banyak orang. |
| `g-tapi-tunggu` | [surprised] Tapi tunggu dulu. Ceritanya belum selesai. |
| `g-masuk-akal` | [thoughtful] Kalau dipikir-pikir, ini sebenarnya masuk akal banget. |
| `g-otak-licik` | [playful] Otak kita ternyata suka cari jalan pintas. |
| `g-bukan-salahmu` | [warmly] Jadi kalau kamu sering begini, itu bukan sepenuhnya salahmu. |
| `g-kecil-besar` | [thoughtful] Perubahan kecil, kalau dilakukan terus, hasilnya bisa besar. |
| `g-lihat-baik` | [curious] Coba lihat baik-baik. Ada yang aneh di sini. |
| `g-satu-hal` | [confidently] Kalau cuma boleh ingat satu hal dari video ini, ingat yang ini. |
| `g-mulai-besok` | [upbeat] Mulai besok, coba perhatikan. Kamu bakal sadar sendiri. |
| `g-pilih-mana` | [playful] Kalau kamu, pilih yang mana? Jawab jujur di komentar. |
| `g-tag-teman` | [playful] Tag satu teman yang paling butuh dengar ini. |
| `g-ulang-tonton` | [friendly] Kalau tadi kelewatan, tonton ulang bagian awalnya. Pasti beda rasanya. |
| `g-pengalamanmu` | [warmly] Kalau kamu punya pengalaman soal ini, aku pengen dengar. |
| `g-sampai-sini` | [friendly] Kalau kamu nonton sampai sini, berarti kamu memang suka penasaran. |
| `g-sampai-jumpa` | [warmly] Sampai jumpa di video berikutnya. |
| `g-jaga-diri` | [warmly] Jaga diri baik-baik, ya. |
| `g-tetap-penasaran` | [upbeat] Tetap penasaran, karena dunia ini masih penuh kejutan. |

## Isi tahap 8


### Sisipan pendek (1–3 detik)

| id | kalimat |
|---|---|
| `g-serius` | [surprised] Serius, ini beneran terjadi. |
| `g-pelan-pelan` | [calmly] Pelan-pelan, kita bahas satu per satu. |
| `g-coba-bayangin` | [curious] Coba bayangin sebentar. |
| `g-ternyata-begini` | [amazed] Ternyata begini cara kerjanya. |
| `g-ini-kuncinya` | [confidently] Nah, ini kuncinya. |
| `g-jangan-panik` | [warmly] Jangan panik dulu. |
| `g-lanjut-lagi` | [upbeat] Oke, kita lanjut lagi. |
| `g-satu-lagi` | [playful] Eh, satu lagi. |
| `g-gimana-menurutmu` | [curious] Gimana menurutmu? |
| `g-keren-kan` | [excited] Keren banget, kan? |
| `g-nggak-nyangka` | [surprised] Aku juga nggak nyangka, sih. |
| `g-mudah-kok` | [friendly] Gampang kok, beneran. |
| `g-coba-ingat` | [thoughtful] Coba ingat-ingat lagi. |
| `g-ini-dia` | [excited] Dan ini dia jawabannya. |
| `g-tahan-dulu` | [playful] Tahan dulu, jangan ditebak dulu. |
| `g-hampir-semua` | [curious] Hampir semua orang salah soal ini. |
| `g-sampai-nanti` | [warmly] Sampai nanti, ya. |

## Isi tahap 9 (300 kalimat × 2 suara)

Daftar lengkap ada di `tahap9.tsv` (`id<TAB>[tag] teks`). Kelompoknya:

| awalan | isi | jumlah |
|---|---|---|
| `ua` | hook "kamu pasti pernah…" | 29 |
| `ub` | transisi & penghubung | 30 |
| `uc` | reaksi singkat | 27 |
| `ud` | penjelasan umum (tubuh, otak, kebiasaan) | 30 |
| `ue` | perbandingan & skala | 27 |
| `uf` | mitos vs fakta | 29 |
| `ug` | tips & langkah | 29 |
| `uh` | kesimpulan | 28 |
| `ui` | pertanyaan untuk komentar | 29 |
| `uj` | alasan berkomentar | 13 |
| `uk` | ajakan simpan/bagikan/ikuti | 14 |
| `ul` | penutup | 15 |

Catatan janji (§16): "Besok kita bongkar rahasia lainnya.", "Ikuti, biar besok dapat fakta baru lagi.", "Besok pagi, langsung praktikkan.", dan "Simpan dulu, siapa tahu besok kamu butuh." hanya dipakai bila memang ada video besok (dua yang terakhir aman, karena "besok" di situ untuk penonton).
Flow: Hasan dan 99 kalimat pertama Amy di `F8praD25GHM8k5DMcT7m`; sisa Amy di flow baru `KFmtWWSgJmmXGahLRIbU` (flow lama penuh, maks 1.000 node). Biaya sekitar 30.800 kredit.

## Isi tahap 10 (sedang berjalan)

Daftar: `tahap10.tsv` (479 kalimat: hook, transisi, reaksi, penjelasan, skala, mitos, tips, kesimpulan, komentar, ajakan, penutup, Adriy, emosi, situasi, sambungan, alam, teknologi, semangat, menunjuk visual, angka, kesehatan, cerita, retoris).

- 28 Nov 2026: **52 kalimat Hasan** selesai (flow `EncQT9vDhgRS1MBDIyp9`), lalu ElevenLabs menolak dengan *daily_generation_limit_reached* (batas jumlah rekaman per hari, bukan kredit).
- Sisa: 427 Hasan + 479 Amy (±37.000 kredit). Lanjutkan besok: `python3 sesi_dari_transkrip.py <transkrip> tahap10.tsv` menunjukkan baris yang belum dibuat; Amy memakai flow baru.

## Alur narasi cepat untuk video baru

1. Tulis `naskah.json` dengan **mengutamakan kalimat pustaka** (aturan.md §17, target ≥ 30%).
2. Jalankan `python3 projects/suara/pustaka/cocokkan.py projects/<video>` (laporan + saran), lalu `--salin` untuk menyalin file pustaka ke `narasi/`.
3. Untuk kalimat lain, buat **satu file per kalimat** lewat ElevenLabs (`creative_generate_speech`, `voice_id` Hasan `AYDmN9T80hHmJLs3rapG`, model `eleven_v4`, `generations_count` 1). Semua kalimat dibuat sekaligus (paralel), lalu diunduh ke `narasi/<id>.mp3`.
4. Jalankan `python3 projects/suara/susun_per_kalimat.py projects/<video> [target-detik]`. Hasilnya `narasi.wav` dan `timeline.json`, tanpa perlu memotong rekaman dengan Whisper.
5. Lanjut seperti biasa: `node render.mjs`, lalu `python3 projects/_bersama/campur.py projects/<video>`.
6. Setelah video jadi: `cocokkan.py projects/<video> --simpan` agar kalimat baru masuk pustaka.

Suara Adriy (tokoh burung hantu) **tidak** dibuat.

## Catatan uji VoxCPM2 (28 Nov 2026)

VoxCPM2 (gratis, CPU) diuji meniru Hasan dengan 3 cara: dari rekaman asli, dari rekaman ElevenLabs pustaka, dan dari rekaman pustaka + teks lanjutan. Menurut pemilik **tidak ada yang bagus**. Jadi narasi video tetap memakai **ElevenLabs + pustaka ini** (aturan §17). VoxCPM2 tidak dipakai untuk narasi kecuali pemilik memintanya.
