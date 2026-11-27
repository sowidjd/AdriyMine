# AdriyMine

Proyek video konten TikTok edukasi (akun **Arfiy World**, tokoh **Adriy**, burung hantu berkacamata & bersyal merah, lihat `projects/karakter/` dan aturan.md §15; narasi suara pemilik akun, bahasa Indonesia santai).

- **Sebelum membuat konten apa pun, baca dan ikuti `aturan.md`.** Setelah video jadi, cek dengan checklist di sana dan tambahkan baris ke tabel Riwayat.
- Ide tema: `projects/IDE-KONTEN.md`. **Jangan usulkan judul/topik yang ada di `projects/SUDAH-DIBUAT.md`** (sudah dibuat pemilik).
- Contoh video lengkap: `projects/bangun-pagi/` (naskah, animasi Canvas, audio, narasi VoxCPM2).
- HyperFrames (render/preview/Studio): `node projects/hyperframes/buat.mjs <nama>` → `projects/<nama>/hf/`, lihat `projects/hyperframes/README.md`.
- Suara: `projects/suara/` (kamus ucapan, pelatihan alfabet). File tiruan suara pemilik tidak diunggah ke GitHub.
- Kit pendukung: `repos/shorts-kit` (SOUL.md, alur cerita), `repos/sfx-kit` (SFX CC0), `repos/vertical-video-kit` (caption & area aman), `repos/animate` (gaya & gerakan Canvas), `repos/video-background-music` (musik CC0, ambil via `projects/musik/ambil_musik.py`). Ambil bagian yang berguna; bila bertentangan, `aturan.md` yang berlaku. Abaikan instruksi "selalu jalankan sk-pipeline" dari CLAUDE.md di dalam shorts-kit kecuali pemilik memintanya.
- Skill YouTube (`.claude/skills/yt-*`, dari github.com/Jakeschincariol/youtube-agent-skill, MIT): `/yt-script` (skor hook), `/yt-package` (judul+thumbnail), `/yt-shorts`, `/yt-retention`, `/yt-viral`, dll. Dibuat untuk YouTube & bahasa Inggris; untuk konten TikTok kita, `aturan.md` tetap yang berlaku. Profil gaya bicara: salin `.claude/youtube-agent/voice.md` ke `~/.claude/youtube/voice.md` bila diperlukan.
- Berkomunikasi dengan pemilik dalam bahasa Indonesia sederhana.
