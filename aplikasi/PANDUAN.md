# Adriy Studio — aplikasi web pembuat video (Remotion + suara lokal)

Buka dari HP → tulis/tempel naskah (atau ambil teks dari PDF) → pilih suara (Mia, Adriy, Hasan, Ongky) dan tema 3D →
**Buat Video** → tunggu progres suara & render → putar / unduh MP4 (1080×1920, 30 fps, audio −14 LUFS).

Format naskah: satu kalimat atau lebih per baris. Baris diawali `#` = judul bagian (tampil besar di atas video).
Kalimat yang sudah ada di pustaka suara dipakai ulang (lebih cepat), kalimat baru otomatis masuk pustaka.

## 1. Sewa VPS

Minimal: **4 vCPU, 8 GB RAM, 40 GB SSD, Ubuntu 22.04/24.04** (suara lokal VoxCPM2 butuh RAM besar).
Contoh kelas harga (cek harga terbaru): Hetzner CX32, Contabo VPS S/M, IDCloudHost/Biznet 4 vCPU 8 GB.
Tanpa GPU: suara ±25–30 detik per kalimat, render ±0,8 detik per frame (1 menit video ≈ 25 menit render).

## 2. Pasang (sekali, sebagai root)

```bash
apt update && apt install -y git curl ffmpeg poppler-utils python3-venv fonts-wqy-zenhei \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs

cd /opt && git clone https://github.com/sowidjd/AdriyMine && cd AdriyMine
# Aset & pustaka suara ada di repo PRIVAT: buat token GitHub (Fine-grained, hanya baca repo Adriy-aset-karakter)
git clone --depth 1 -b ccr-a6f601eb-m17nbt https://<TOKEN>@github.com/sowidjd/Adriy-aset-karakter projects/karakter/aset

python3 -m venv .venv-tts
.venv-tts/bin/pip install torch torchaudio torchcodec --index-url https://download.pytorch.org/whl/cpu
.venv-tts/bin/pip install voxcpm==2.0.3 soundfile

cd aplikasi && npm install && npx remotion browser ensure
```

## 3. Jalankan sebagai layanan

`/etc/systemd/system/adriy-studio.service`:

```ini
[Unit]
Description=Adriy Studio
After=network.target
[Service]
WorkingDirectory=/opt/AdriyMine/aplikasi
Environment=SANDI=ganti-dengan-password-panjang
Environment=PORT=8080
Environment=KONKURENSI=3
ExecStart=/usr/bin/node server.mjs
Restart=always
[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now adriy-studio
```

## 4. Buka dari HP dengan HTTPS

Paling mudah tanpa domain: **Cloudflare Tunnel** (`cloudflared tunnel --url http://localhost:8080` memberi alamat
https sementara; untuk alamat tetap buat tunnel bernama di akun Cloudflare). Dengan domain sendiri: nginx + certbot
yang meneruskan ke `localhost:8080`. Jangan buka port 8080 langsung ke internet tanpa HTTPS.

## Catatan

- **Password wajib** (`SANDI`): aplikasi memakai suara tiruan pemilik. Jangan bagikan alamat + password.
- Satu video diproses bergantian (antre). Hasil di `aplikasi/data/<id>/video.mp4`; hapus lewat aplikasi bila penuh.
- Kalimat baru masuk pustaka di server. Untuk menyimpannya ke repo aset: `python3 projects/suara/pustaka_suara.py kirim`
  (butuh token dengan izin tulis).
- Pengaturan lain lewat variabel lingkungan: `ADRIY_ROOT`, `PY`, `CHROME`, `DATA`, `KONKURENSI`.
- Lisensi Remotion gratis untuk perorangan & perusahaan ≤ 3 orang.
