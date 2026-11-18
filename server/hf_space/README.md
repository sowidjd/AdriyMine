---
title: AdriyTTS VoxCPM2
sdk: docker
app_port: 7860
---
# Server VoxCPM2 di Hugging Face Space

> **Penting (diuji 18 Nov 2026):** Hugging Face kini mewajibkan langganan **PRO (berbayar)** untuk Space
> Docker/Gradio, termasuk di hardware CPU gratis. Jalur ini **tidak lagi gratis**.
> Bila memakai PRO: buat Space **Private** (rekaman suara di folder `voices/` tidak boleh publik),
> lalu isi "Kunci Hugging Face" di aplikasi agar bisa mengakses Space privat.

1. Buat akun gratis di huggingface.co.
2. Klik **New Space** → beri nama (mis. `adriytts`) → SDK **Docker** → hardware **CPU basic (free)** → **Private** (wajib, karena berisi rekaman suara).
3. Unggah file: `Dockerfile` dan `README.md` dari folder ini, `voxcpm_server.py` dan folder `voices/` dari folder `server/`.
4. Buka **Settings → Variables and secrets** → tambah secret `TOKEN` berisi kata sandi pilihan Anda.
5. Tunggu status **Running** (build pertama ±10–15 menit, termasuk mengunduh model 5 GB).
6. Di aplikasi: **Atur → Suara VoxCPM2** → isi alamat dan kata sandi tadi → **Simpan & tes koneksi**.
   Alamat = `https://<nama-akun>-<nama-space>.hf.space`, huruf kecil semua, titik/garis bawah diganti tanda minus.
   Contoh: akun `Adriy_ID`, Space `adriytts` → `https://adriy-id-adriytts.hf.space`.
   Alamat pasti juga bisa dilihat di halaman Space: menu ⋮ → **Embed this Space** → bagian "Direct URL".

Catatan jujur:
- Hardware gratis hanya CPU 2 inti: **1 menit audio butuh ±8–10 menit**. Cocok untuk teks pendek–sedang.
- Space gratis tertidur setelah 48 jam tidak dipakai; permintaan pertama membangunkannya (±1–2 menit).
- Bila Space sedang tidur/mati, aplikasi menanyakan apakah memakai Gadis/Ardi dulu.
