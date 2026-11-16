"""Buat katalog + versi rapi (normal/) untuk semua file Mixkit di audio/.  python3 katalogkan.py
Versi rapi: WAV 48 kHz stereo, jeda awal > 0,3 s dipangkas, puncak -3 dBFS (suasana/loop -12 dBFS)."""
import os, json, re, numpy as np, soundfile as sf, librosa
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE); os.makedirs('normal', exist_ok=True)
SAAT = {'cinematic-whoosh-fast-transition': 'transisi cepat antar adegan', 'cinematic-laser-gun-thunder': 'ledakan sci-fi, kekuatan besar, dramatis', 'cartoon-toy-whistle': 'lucu, konyol, gagal lucu',
 'arrow-whoosh': 'sesuatu melesat, panah, gerak cepat', 'air-zoom-vacuum': 'tersedot, zoom masuk, menghilang', 'air-woosh': 'gerak udara ringan, teks masuk', 'aggressive-beast-roar': 'monster/binatang buas, ancaman, kaget',
 'small-group-cheer-and-applause': 'berhasil, sorakan, perayaan kecil', 'cinematic-tunnel-reverb-woosh': 'masuk ke dunia lain, flashback, transisi dalam', 'cinematic-transition-swoosh-heartbeat-trailer': 'transisi tegang ala trailer',
 'retro-game-notification': 'notifikasi gaya game, poin didapat', 'retro-game-emergency-alarm': 'bahaya gaya game, darurat lucu', 'game-show-suspense-waiting': 'menunggu jawaban, kuis, tegang lucu',
 'classic-alarm': 'jam beker berbunyi, bangun pagi', 'fast-small-sweep-transition': 'transisi kecil, kartu/teks berganti', 'fast-rocket-whoosh': 'roket, melesat sangat cepat', 'dog-barking-twice': 'anjing menggonggong, kejutan lucu',
 'crickets-and-insects-in-the-wild-ambience': 'alam malam, sepi, canggung', 'arcade-retro-game-over': 'gagal, game over, kalah',
 'sick-man-sneeze': 'bersin, sakit, kejutan lucu', 'sad-game-over-trombone': 'gagal lucu "wah wah wah", kecewa', 'rain-and-thunder-storm': 'badai, hujan petir, suasana muram/dramatis',
 'mystwrious-bass-pulse': 'misterius, tegang, sesuatu akan terungkap', 'movie-trailer-epic-impact': 'angka/fakta besar muncul, hantaman epik', 'melodical-flute-music-notification': 'notifikasi lembut, alam, ceria',
 'martial-arts-fast-punch': 'pukulan, "dihantam", fakta yang menampar', 'little-birds-singing-in-the-trees': 'pagi, taman, alam tenang', 'light-rain-loop': 'hujan ringan, santai, sendu',
 'keyboard-typing': 'mengetik, chat, kerja di laptop', 'intro-transition': 'pembuka bagian/judul baru', 'footsteps-on-tall-grass': 'berjalan di rumput, alam, mengendap', 'flock-of-wild-geese': 'kawanan burung, alam liar, migrasi',
 'female-astonished-gasp': 'kaget/takjub "hah!", reaksi fakta mengejutkan', 'fast-whoosh-transition': 'transisi cepat', 'epic-orchestra-transition': 'transisi megah, pengungkapan besar',
 'crowd-laugh': 'penonton tertawa, momen lucu', 'cool-impact-movie-trailer': 'hantaman keren ala trailer, judul muncul', 'clock-countdown-bleeps': 'hitung mundur, waktu hampir habis'}
AMB = ('ambience', 'rain', 'loop', 'storm', 'birds-singing', 'geese', 'suspense-waiting')
out = []
for f in sorted(os.listdir('audio')):
    base = re.sub(r'^mixkit-|-\d+\.wav$', '', f)
    y, sr = librosa.load('audio/' + f, sr=None, mono=True); peak = float(np.abs(y).max())
    nz = np.where(np.abs(y) > peak * .05)[0]; lead = nz[0] / sr if len(nz) else 0; amb = any(k in base for k in AMB)
    z, _ = librosa.load('audio/' + f, sr=48000, mono=False); z = np.atleast_2d(z)
    if lead > .3: z = z[:, max(0, int((lead - .02) * 48000)):]
    z = z / (np.abs(z).max() + 1e-9) * 10 ** ((-12 if amb else -3) / 20)
    if z.shape[0] == 1: z = np.vstack([z, z])
    sf.write('normal/' + base + '.wav', z.T, 48000, subtype='PCM_16')
    out.append({'file': f, 'nama': base, 'durasi_s': round(len(y) / sr, 2), 'bunyi_mulai_s': round(lead, 2), 'peak_db': round(20 * np.log10(peak + 1e-12), 1), 'suasana_loop': amb,
                'cocok_untuk': SAAT.get(base, ''), 'normal': 'normal/' + base + '.wav', 'sumber': 'Mixkit (mixkit.co)',
                'lisensi': 'Mixkit Sound Effects Free License: boleh komersial tanpa kredit, TIDAK boleh disebarkan ulang file mentahnya'})
json.dump(out, open('katalog.json', 'w'), ensure_ascii=False, indent=1)
L = ['# Efek suara Mixkit (dari pemilik)', '', f'{len(out)} efek suara dari **Mixkit** (mixkit.co). Asli di `audio/`, versi rapi (WAV 48 kHz, jeda awal > 0,3 s dipangkas, puncak -3 dBFS, suasana/loop -12 dBFS) di `normal/`. Buat ulang dengan `python3 katalogkan.py`.', '',
 '**Lisensi: Mixkit Sound Effects Free License.** Boleh dipakai di video komersial (TikTok yang dimonetisasi) **tanpa mencantumkan kredit**. Tapi **file mentahnya tidak boleh disebarkan ulang**, jadi file audionya **tidak diunggah** ke repo GitHub yang publik ini. Simpan cadangannya sendiri (HP/Google Drive), atau jadikan repo privat lalu file ini boleh diunggah.', '',
 '| Nama | Durasi | Cocok untuk |', '|---|---|---|']
for o in out: L.append(f"| `{o['nama']}` | {o['durasi_s']} s{' (suasana/loop)' if o['suasana_loop'] else ''} | {o['cocok_untuk']} |")
open('KATALOG.md', 'w').write('\n'.join(L) + '\n')
print(len(out), 'efek;', 'tanpa keterangan:', [o['nama'] for o in out if not o['cocok_untuk']])
