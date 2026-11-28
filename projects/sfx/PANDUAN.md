# Panduan memilih SFX (untuk AI & pemilik)

Semua SFX proyek kini **satu pintu**: `projects/sfx/katalog.json` (3.828 efek dari 5 sumber).
File asli **tidak dipindah**, karena path lama dipakai skrip lain. Katalog ini hanya menunjuk ke file-file tersebut.

```bash
python3 projects/sfx/cari.py <kata>            # cari dengan kata Indonesia atau Inggris
python3 projects/sfx/cari.py --kategori        # daftar kategori + jumlahnya
python3 projects/sfx/cari.py -k transisi -n 30 # isi satu kategori
python3 projects/sfx/bangun_katalog.py         # bangun ulang katalog bila ada SFX baru
```

Opsi `cari.py`:
- `--pendek`: kurang dari 1,5 detik.
- `--loop`: untuk suara latar.
- `--tanpa-kredit`: buang SFX yang wajib diberi kredit.
- `--orang`: ikutkan suara orang.
- `--semua`: ikutkan Mixkit dan SFX sensitif.
- `--json`: keluaran berupa JSON.

## 1. Urutan sumber (prioritas)

| Prioritas | Sumber | Isi | Lisensi | Catatan |
|---|---|---|---|---|
| 1 | `projects/sfx-saya/normal/` | 59 efek ElevenLabs milik pemilik | milik pemilik | Diutamakan. Pakai versi `normal/` yang sudah dirapikan. |
| 1 | `projects/_bersama/sfx/` | 6 efek (kertas, perut) | milik proyek | |
| 2 | `repos/sfx-kit/sounds/` | 320 efek, data paling lengkap | CC0 | Ada titik sinkron dan penurunan volume di bawah narasi. Ikuti `repos/sfx-kit/GUIDE.md`. |
| 3 | `projects/sfx-bebas/` (CC0/PD) | ±2.160 efek | CC0 / Public Domain | Bebas dipakai tanpa kredit. |
| 4 | `projects/sfx-bebas/` (CC BY) | 545 efek SoundBible | CC BY 3.0 | **Wajib kredit** di deskripsi video. Teks kreditnya ada di field `kredit`. |
| 5 | Mixkit (`projects/sfx-saya/mixkit/`) | 736 efek, hanya katalog | Mixkit License | **File tidak ada di container** dan **dilarang diunggah ke repo publik**. Pakai hanya bila pemilik sudah mengonfirmasi dan menyediakan filenya. |

`cari.py` sudah mengurutkan hasil berdasarkan jumlah kata yang cocok, lalu prioritas di atas. Ambil hasil teratas kecuali ada alasan kuat memilih yang lain.

Efek suara buatan kode (`projects/_bersama/sfx_buatan.py`) hanya dipakai kalau tidak ada yang cocok. **Jangan membuat (generate) SFX baru di ElevenLabs tanpa bertanya ke pemilik dulu.**

## 2. Momen di video → kategori → kata cari

| Momen di naskah | Kategori | Contoh kata cari |
|---|---|---|
| Pindah adegan, kamera bergeser cepat | `transisi` | whoosh, swish, riser, reverse |
| Teks atau ikon muncul, gelembung, sesuatu hilang | `muncul-hilang` | pop, muncul, poof, plop |
| Jatuh, menabrak, kejutan keras | `benturan` | jatuh, pukul, boom, gedebuk |
| Ketik, klik, menu HP | `ui-klik` | klik, ketik, tombol |
| Jawaban benar/salah, ide muncul, pesan masuk | `notifikasi` | ting, benar, salah, ide, notifikasi |
| Konyol, lucu, gerakan memantul | `lucu-kartun` | kartun, boing, lucu |
| Fakta mengerikan, misteri, ketegangan | `tegang` | tegang, drumroll, detak jantung |
| Fakta menakjubkan, kilau, "wow" | `ajaib` | kilau, sihir, shimmer, chime |
| Latar tempat (kota, hutan, malam) | `suasana` | `--loop` + kota / hutan / malam |
| Hewan | `hewan` | burung, kucing, auman |
| Perut, napas, jantung, langkah, menguap | `tubuh` | perut, jantung, langkah |
| Air, hujan, api, angin, ombak | `alam-air` | hujan, ombak, api |
| Benda sehari-hari (pintu, kertas, dapur, HP) | `alat-benda` | pintu, kertas, kulkas |
| Kendaraan dan sirene | `kendaraan` | mobil, kereta, sirene |
| Teknologi, luar angkasa, sains | `scifi-digital` | laser, robot, radar, data |
| Jingle, nada, sting | `musik-sting` | jingle, sting, nada |
| Game, koin, naik level | `game-retro` | koin, level up, 8 bit |
| Menang, tepuk tangan, kembang api | `perayaan` | tepuk, sorak, menang |
| Uang dan harga | `uang` | uang, koin, kasir |
| Jam, deadline, alarm | `waktu` | jam, alarm, detik |

Satu SFX bisa masuk lebih dari satu kategori. Kategori `lain` berisi file tanpa keterangan jelas (misalnya "misc 05"). Jangan pakai file dari kategori ini tanpa mendengarkannya dulu.

## 3. Aturan wajib

1. **Bunyi khas nama channel (§10)** selalu memakai `repos/sfx-kit/sounds/logo-stings/sting-bright-short.wav`. Jangan diganti.
2. **Narasi nomor satu.** Di bawah narasi pakai varian `soft`/`subtle`. Untuk sfx-kit, mulai efek di *momen − `sync_at`* dan turunkan volume sebesar `turun_di_narasi_db` selama efek bertabrakan dengan suara. Jangan pakai efek yang `hindari`-nya berisi "On top of speech" saat narasi sedang berjalan.
3. **Suara orang** (kategori `suara-orang`, misalnya Voiceover Pack berbahasa Inggris) **disembunyikan secara bawaan**. Jangan ditaruh di bawah narasi.
4. **SFX sensitif** (senjata, gore, kekerasan: 88 file) disembunyikan secara bawaan. Konten kita edukasi, jadi hindari.
5. **Kredit:** kalau memakai SFX yang `kredit_wajib: true`, salin field `kredit` ke deskripsi video dan catat di laporan video.
6. **Jangan berlebihan:** satu efek untuk setiap kejadian penting (§9: jatuh, notifikasi, pintu, lampu). Efek harus mengikuti **emosi inti** video (§0).
7. **Jangan unggah Mixkit** ke GitHub (field `boleh_di_repo: false`).

## 4. Isi satu entri katalog

| Field | Arti |
|---|---|
| `id` | Pengenal unik, misalnya `saya/transisi_whoosh` atau `kit/whoosh-fast-hard`. |
| `file` | Path dari akar repo. Path inilah yang dipakai di skrip. |
| `sumber` | Asal SFX. |
| `prioritas` | Urutan pilihan sumber. |
| `kategori` | Kategori momen. |
| `kategori_asli` | Kategori dari sumber aslinya. |
| `cocok_untuk` / `hindari` | Kapan sebaiknya dipakai dan kapan tidak. |
| `kata_kunci` | Kata kunci dalam bahasa Indonesia dan Inggris. |
| `durasi_s` | Durasi dalam detik. |
| `panjang` | `pendek` (< 1,5 s), `sedang` (< 5 s), atau `panjang`. |
| `kekuatan`, `sync_at`, `turun_di_narasi_db` | Hanya untuk sfx-kit. |
| `lisensi`, `kredit_wajib`, `kredit` | Status lisensi dan teks kredit. |
| `boleh_di_repo` | Boleh diunggah ke GitHub atau tidak. |
| `tersedia` | Filenya ada di container atau tidak. |
| `sensitif` | Bernilai true untuk senjata, kekerasan, dan sejenisnya. |

Kategori dibuat otomatis dari judul dan kata kunci, jadi kadang ada yang meleset. Kalau menemukan salah kategori, perbaiki aturan `ATURAN`/`KAMUS` di `bangun_katalog.py`, lalu bangun ulang katalognya. Jangan mengedit `katalog.json` langsung.
