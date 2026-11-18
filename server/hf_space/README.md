---
title: AdriyTTS VoxCPM2
sdk: docker
app_port: 7860
---
# Server VoxCPM2 gratis di Hugging Face (tanpa komputer sendiri)

1. Buat akun gratis di huggingface.co.
2. Klik **New Space** → beri nama (mis. `adriytts`) → SDK **Docker** → hardware **CPU basic (free)** → Private.
3. Unggah file: `Dockerfile` dan `README.md` dari folder ini, `voxcpm_server.py` dan folder `voices/` dari folder `server/`.
4. Buka **Settings → Variables and secrets** → tambah secret `TOKEN` berisi kata sandi pilihan Anda.
5. Tunggu status **Running** (build pertama ±10–15 menit, termasuk mengunduh model 5 GB).
6. Di aplikasi: **Atur → Suara VoxCPM2** → alamat `https://<nama-akun>-adriytts.hf.space` dan kata sandi tadi → **Simpan & tes koneksi**.

Catatan jujur:
- Hardware gratis hanya CPU 2 inti: **1 menit audio butuh ±8–10 menit**. Cocok untuk teks pendek–sedang.
- Space gratis tertidur setelah 48 jam tidak dipakai; permintaan pertama membangunkannya (±1–2 menit).
- Bila Space sedang tidur/mati, aplikasi menanyakan apakah memakai Gadis/Ardi dulu.
