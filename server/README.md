# Server VoxCPM2 untuk AdriyTTS

VoxCPM2 (OpenBMB, lisensi Apache 2.0) adalah model suara 2 miliar parameter. Ukurannya 5 GB dan
butuh kartu grafis, jadi **tidak bisa dijalankan di dalam HP**. Server ini menjalankannya di komputer,
lalu aplikasi AdriyTTS di HP mengambil suaranya lewat Wi‑Fi atau internet.

Suara utama aplikasi (Gadis & Ardi) tetap jalan tanpa server ini. Jika server mati, aplikasi otomatis
memakai Gadis/Ardi agar audio tetap jadi.

## Kebutuhan
| | Minimal | Disarankan |
|---|---|---|
| Kartu grafis | tanpa GPU (CPU saja) | NVIDIA, memori ≥ 8 GB (RTX 3060 12 GB, RTX 4060 Ti 16 GB, atau T4 gratis di Google Colab/Kaggle) |
| Kecepatan (1 menit audio) | ±4–6 menit | ±20 detik (RTX 4090) |
| RAM | 16 GB | 16 GB |
| Ruang disk | 6 GB | 6 GB |

## Cara memasang (Windows/Linux, komputer di rumah)
1. Pasang Python 3.10+ dan ffmpeg.
2. Pasang PyTorch yang sesuai GPU (lihat pytorch.org), lalu:
   ```
   pip install voxcpm
   ```
3. Jalankan (model diunduh otomatis sekali, ±5 GB):
   ```
   python voxcpm_server.py --port 8808 --token isi-kata-sandi-anda
   ```
4. Cari alamat IP komputer (mis. `192.168.1.10`). HP dan komputer harus satu Wi‑Fi.
5. Di aplikasi: **Atur → Suara VoxCPM2** → isi `http://192.168.1.10:8808` dan kata sandi →
   **Simpan & tes koneksi**. Suara "VoxCPM2 · Wanita/Pria" muncul di layar **Buat**.

## Tanpa komputer bergrafis: Google Colab (gratis, ada batas waktu harian)
1. Buka colab.research.google.com → Runtime → Change runtime type → **T4 GPU**.
2. Jalankan di sel:
   ```
   !git clone https://github.com/sowidjd/AdriyMine && cd AdriyMine/server && pip -q install voxcpm
   !nohup python AdriyMine/server/voxcpm_server.py --port 8808 --token isi-kata-sandi > log.txt 2>&1 &
   !wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cf && chmod +x cf
   !./cf tunnel --url http://localhost:8808
   ```
3. Salin alamat `https://….trycloudflare.com` yang muncul ke aplikasi.
   Catatan: sesi Colab gratis berhenti setelah beberapa jam atau bila tidak dipakai.

## Yang perlu diketahui (hasil uji)
- Kealamian (UTMOS): VoxCPM2 Pria 3,53 · Wanita 3,07 · Gadis 3,59 · Ardi 3,62.
- Abjad A–Z: Gadis/Ardi 100% tepat; VoxCPM2 kadang keliru (mis. I → "e", P → "be"). Untuk teks ejaan, pilih Gadis/Ardi.
- Suara acuan di folder `voices/` dipilih dari beberapa kandidat lewat pengukuran, agar suara tetap sama
  dari awal sampai akhir. Rancangan suara VoxCPM2 sangat acak (skor kandidat 1,5 sampai 3,3).
- Volume otomatis disamakan ke −19 LUFS seperti suara utama.

## Suara kloning "Adriy" (dan suara kloning lain)
Server otomatis memuat setiap pasangan `voices/<nama>.wav` + `voices/<nama>.txt` (transkrip persis rekaman)
sebagai suara kloning. Suara **Adriy** sudah disertakan (`voices/adriy.wav`, potongan 15,7 detik dari rekaman asli).

Hasil uji suara Adriy: kemiripan suara 0,85–0,88 terhadap bagian rekaman asli yang tidak dipakai untuk kloning
(suara lain hanya 0,15–0,29), dan pengucapan 100% tepat pada kalimat uji.

Untuk menambah suara sendiri: rekam 10–20 detik di ruangan sunyi, simpan sebagai `voices/namaku.wav`,
tulis kalimat yang diucapkan persis di `voices/namaku.txt`, lalu jalankan ulang server.
