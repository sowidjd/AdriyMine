# AdriyTTS — Teks jadi Suara Natural (Gratis, Tanpa Batas)

Aplikasi Android text-to-speech dengan **suara neural AI** yang natural, berekspresi, dan bernada —
bukan suara robot atau suara Google. Bahasa Indonesia jadi prioritas utama.

## Unduh & pasang
- File APK siap pakai: [`release/AdriyTTS.apk`](release/AdriyTTS.apk)
- Atau dari tab **Actions** di GitHub → build terbaru → artifact `AdriyTTS-apk`.

Cara pasang: buka file APK di HP → izinkan "Instal dari sumber tidak dikenal" → Pasang.
Minimal Android 7.0.

## Fitur
- **Studio Pratinjau**: tulis kalimat apa saja, dengarkan, atau bandingkan beberapa suara berurutan; tombol Pratinjau untuk mendengar awal teksmu sebelum membuat audio penuh.
- **20 suara pilihan** untuk bahasa Indonesia:
  - Gadis & Ardi (suara asli Indonesia — ejaan huruf, angka, singkatan sempurna)
  - 12 suara **multibahasa** generasi terbaru (Ava, Andrew, Emma, Brian, Seraphina, Florian, …) — fasih
    bahasa Indonesia dan paling ekspresif
  - Melayu, Jawa, Sunda
  - + 300 suara bahasa lain (menu "Tampilkan semua bahasa")
- **Teks panjang tanpa batas** (diuji 5.700+ kata; 10.000+ kata aman): teks dipecah per paragraf,
  diproses paralel dengan coba-ulang otomatis, lalu digabung jadi satu MP3.
- **Jeda natural**: koma & titik diatur langsung oleh model AI; jeda antar paragraf bisa diatur.
  Jeda disisipkan sebagai frame MP3 hening murni → tanpa klik/noise.
- **Pengucapan Indonesia**: angka → kata (Rp 25.000 → "dua puluh lima ribu rupiah"), tanggal, jam,
  persen, satuan, singkatan (yg, dgn, dll, Jl.), ejaan huruf A–Z ala Indonesia (a, be, ce, … zet) dan
  akronim (KTP → "ka te pe") untuk suara multibahasa.
- **Dengar sambil diproses**: audio mulai diputar begitu bagian pertama jadi.
- Proses tetap jalan saat layar mati (layanan latar depan) dan **bisa dilanjutkan** bila internet putus —
  bagian yang sudah jadi tidak diulang.
- **Unduh/simpan**: otomatis tersimpan di `Download/AdriyTTS/*.mp3`, bisa juga "Simpan ke folder lain…"
  atau dibagikan ke WhatsApp/Drive/dll.
- Pemutar dengan kontrol di notifikasi & layar kunci, kecepatan 0.75×–2×, maju/mundur 10 detik.
- Buka file `.txt`, tempel dari papan klip, atau bagikan teks dari aplikasi lain ke AdriyTTS.

## Peningkatan kualitas suara v1.1 (hasil uji terukur)
| Masalah | Temuan | Perbaikan |
|---|---|---|
| Noise kompresi | MP3 48 kbps, SNR ±22 dB vs 96 kbps | Format 96 kbps |
| Kalimat pendek berlogat asing (suara multibahasa) | "Dia tersenyum." / "Oke, terima kasih." terdeteksi Portugis/Spanyol oleh Whisper | Kalimat ≤3 kata digabung ke kalimat sebelahnya |
| Jeda titik terlalu pendek (multibahasa) | ±385 ms, hampir sama dengan koma | Jeda disisipkan di posisi kata (metadata WordBoundary) — bit-perfect, tanpa merusak bit reservoir MP3 |
| Hening berlebih di sambungan | sampai ±1,6 dtk | Ekor hening dipangkas, jeda sambungan diatur |
| Lama menunggu audio pertama | 30–120 dtk (suara multibahasa lebih lambat dari real-time) | Potongan bertahap 170→240→360→480 karakter, 4 paralel: ±8 dtk, 0 dtk tersendat |
| Suara kadang mati di server | Remy/Florian sempat tidak tersedia | Cek kesehatan + cadangan otomatis ke suara mirip |

Kealamian diukur dengan UTMOS22 & DNSMOS, ketepatan ucapan dengan Whisper. Skor tiap suara ditampilkan di aplikasi.

## Cara kerja (ringkas)
Mesin suaranya adalah layanan neural TTS Microsoft yang dipakai fitur "Read Aloud / Baca Nyaring" di
browser Edge — gratis, tanpa API key, tanpa kuota. Aplikasi meniru protokol resmi browser
(WebSocket + SSML + token `Sec-MS-GEC`), porting dari proyek open-source
[edge-tts](https://github.com/rany2/edge-tts). Butuh internet saat membuat audio; hasilnya bisa diputar offline.

Jika suatu saat semua suara gagal dengan pesan "Server menolak (403)", Microsoft mengubah syarat versi
browser: perbarui angka di **Atur → Lanjutan → Versi Chromium** (lihat nilai `CHROMIUM_FULL_VERSION`
terbaru di repo edge-tts), tanpa perlu instal ulang.

## Build sendiri
```bash
./gradlew testDebugUnitTest assembleRelease
# hasil: app/build/outputs/apk/release/app-release.apk
```
APK ditandatangani dengan kunci tetap (`app/adriytts-release.jks`) agar versi baru bisa langsung
meng-update versi lama tanpa uninstall.
