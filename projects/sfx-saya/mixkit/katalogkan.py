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
 'crowd-laugh': 'penonton tertawa, momen lucu',
 'owl-shriek': 'jeritan burung hantu, kaget/seram', 'small-cricket-screech': 'jangkrik kecil berderik (dekat)', 'crickets-at-night-in-nature': 'jangkrik malam di alam (latar)',
 'summer-crickets-loop': 'jangkrik musim panas (latar)', 'light-rain-atmosphere': 'suasana gerimis (latar)', 'scary-woods-at-night': 'hutan seram malam hari (latar)',
 'summer-night-crickets-loop': 'jangkrik malam (latar)', 'single-cricket-screech': 'satu jangkrik "krik", hening canggung', 'night-crickets-near-the-swamp': 'jangkrik malam dekat rawa (latar)',
 'horror-ambience': 'suasana horor, mencekam (latar)', 'terror-transition': 'transisi horor/mengagetkan',
 'walking-in-the-forest': 'berjalan di hutan', 'summer-night-in-the-forest': 'malam musim panas di hutan (latar)', 'quiet-forest-ambience': 'hutan sunyi (latar)',
 'man-running-in-the-forest': 'orang berlari di hutan, dikejar, buru-buru', 'forest-rain-loop': 'hujan di hutan (latar)', 'morning-sound-in-a-garden': 'pagi di taman/kebun, segar',
 'walking-through-dry-forest-leaves': 'berjalan di atas daun kering', 'owl-in-a-forest': 'burung hantu di hutan, malam misterius', 'european-forest-ambience': 'hutan subtropis (latar)',
 'river-in-the-forest-with-birds': 'sungai di hutan + burung', 'windy-humming-forest-with-birds': 'hutan berangin + burung', 'birds-in-the-jungle': 'burung di hutan tropis',
 'wind-in-the-forest': 'angin di hutan', 'footsteps-in-the-forest-ground': 'langkah di tanah hutan, mengendap', 'running-through-the-forest': 'berlari menembus hutan',
 'forest-birds-singing': 'kicau burung hutan, pagi damai',
 'fast-ignition-fire': 'api menyala cepat, "wush!", semangat membara', 'big-fire-burning': 'api besar berkobar (latar)', 'fire-spell-with-explosion': 'sihir api + ledakan, momen dahsyat',
 'small-meteor-falling': 'meteor jatuh, sesuatu meluncur dari langit', 'big-fire-flame-burning': 'nyala api besar (latar)', 'fireball-spell': 'bola api, serangan, energi',
 'wizard-fire-woosh': 'sihir api, transisi magis', 'intense-long-fire-beam': 'semburan api panjang, kekuatan besar', 'ghost-fire-swoosh': 'api hantu, transisi misterius',
 'fire-woosh': 'whoosh api, transisi panas', 'fire-match-lighting': 'korek api dinyalakan, ide kecil, awal sesuatu', 'fuel-explosion': 'ledakan bahan bakar, dahsyat',
 'fire-explosion': 'ledakan api', 'soft-woosh-fire': 'whoosh api lembut', 'papers-blowing-in-the-windstorm': 'kertas beterbangan diterpa angin, berantakan, kacau',
 'campfire-burning-crackles': 'api unggun berderak, hangat, cerita malam', 'campfire-night-wind': 'api unggun + angin malam (latar)', 'fire-swoosh-burning': 'whoosh lalu terbakar',
 'short-fire-whoosh': 'whoosh api singkat',
 'wind-in-futuristic-city': 'angin di kota masa depan, sci-fi sepi', 'strange-animal-of-the-desert': 'suara hewan aneh di gurun, misterius',
 'rattlesnake-ready-to-hunt': 'ular derik siap menyerang, bahaya', 'rattlesnake-in-desert': 'ular derik di gurun', 'rattlesnake-moving-the-tail': 'ekor ular derik bergetar, peringatan',
 'wind-in-a-desolate-world': 'angin di dunia sepi/kosong, hampa', 'arctic-winds': 'angin kutub, dingin', 'ambient-sound-in-the-desert': 'suasana gurun',
 'creepy-cavern-ambience-loop': 'gua seram, gelap, misteri', 'blizzard-cold-winds': 'badai salju, dingin ekstrem', 'sand-in-the-desert': 'pasir tertiup di gurun',
 'hawk-call-squawk': 'teriakan elang/burung pemangsa', 'desert-ambience': 'suasana gurun (latar)', 'body-impact-falling-into-the-sand': 'jatuh ke pasir, gedebuk',
 'horror-sci-fi-wind-tunnel': 'lorong angin horor/sci-fi, mencekam', 'arabian-mystery-harp-notification': 'notifikasi harpa misterius ala Timur Tengah, fakta unik',
 'wind-in-the-top-of-the-mountain': 'angin di puncak gunung, ketinggian',
 'people-bathing-in-the-sea-ambience': 'pantai ramai, orang berenang, liburan', 'beach-waves-with-children-ambience': 'ombak pantai + anak-anak bermain, ceria',
 'distant-sea-humming-ambiance': 'laut di kejauhan, tenang, luas', 'small-waves-harbor-rocks': 'ombak kecil di batu pelabuhan', 'sea-waves-with-birds-loop': 'ombak + burung laut (latar)',
 'thunder-strike-in-storm': 'petir menyambar, kejutan besar, dramatis', 'thunderstorm-in-the-forest': 'badai petir di hutan',
 'fish-moving-in-water': 'ikan bergerak di air, kecipak', 'heavy-rain': 'hujan deras', 'birds-chirping-in-the-jungle': 'kicau burung di hutan tropis',
 'jungle-rain-and-birds': 'hujan di hutan + burung', 'heavy-storm-rain-loop': 'badai hujan deras (latar)', 'heavy-rain-and-thunder-in-background': 'hujan deras + petir di kejauhan',
 'strong-wild-wind-in-a-storm': 'angin kencang badai, terhempas', 'bird-singing-and-flapping-wings': 'burung berkicau & mengepak sayap (dekat)',
 'river-water-flow-and-surroundings': 'sungai mengalir + suasana sekitar', 'thunder-rumble-and-light-rain': 'gemuruh petir + gerimis, muram',
 'rain-in-the-jungle-and-birds': 'hujan hutan + burung', 'thunderstorm-and-rain-loop': 'badai & hujan (latar)', 'thunderstorm-and-clear-rain': 'badai lalu hujan reda',
 'birds-chirping-near-the-river': 'pagi di sungai, alam damai', 'night-forest-with-insects': 'hutan malam, serangga, misterius tenang',
 'rain-long-loop': 'hujan panjang (latar)', 'dry-leaves-rustling': 'daun kering bergemerisik, langkah di hutan, musim kemarau',
 'calm-thunderstorm-in-the-jungle': 'badai tenang di hutan tropis', 'water-flowing-ambience-loop': 'air mengalir, sungai, tenang',
 'breeze-through-the-trees': 'angin sepoi di pepohonan', 'liquid-bubble': 'gelembung cairan, ide muncul, lab', 'heavy-rain-drops': 'tetes hujan deras, dramatis',
 'wolves-at-scary-forest': 'serigala di hutan seram, horor/ancaman',
 'vintage-telephone-ringtone': 'telepon jadul berdering, panggilan, zaman dulu', 'vacuum-swoosh-transition': 'transisi tersedot/menghilang',
 'trumpet-fanfare': 'kemenangan, pengumuman resmi, "ta-da!"', 'transition-windy-swoosh': 'transisi berangin, angin kencang',
 'tick-tock-clock-timer': 'waktu berjalan, menunggu, deadline', 'technological-futuristic-hum': 'teknologi canggih, futuristik, mesin/AI',
 'stadium-crowd-light-applause': 'tepuk tangan stadion, pengakuan besar', 'small-crowd-laugh-and-applause': 'tertawa + tepuk tangan, lucu yang berhasil', 'cool-impact-movie-trailer': 'hantaman keren ala trailer, judul muncul', 'clock-countdown-bleeps': 'hitung mundur, waktu hampir habis'}
AMB = ('ambience', 'rain', 'loop', 'storm', 'birds-singing', 'geese', 'suspense-waiting', 'futuristic-hum', 'forest', 'river', 'flowing', 'breeze', 'thunderstorm', 'leaves-rustling', 'rain-drops', 'wolves', 'thunder', 'storm', 'jungle', 'heavy-rain', 'wind', 'water', 'sea', 'waves', 'beach', 'ambiance', 'desert', 'arctic', 'blizzard', 'cavern', 'winds', 'desolate', 'mountain', 'futuristic-city', 'wind-tunnel', 'fire-burning', 'flame-burning', 'campfire', 'windstorm', 'forest', 'garden', 'jungle', 'owl-in', 'crickets', 'atmosphere', 'scary-woods', 'horror-ambience')
out = []
for f in sorted(os.listdir('audio')):
    base = re.sub(r'^mixkit-|-\d+\.wav$', '', f)
    y, sr = librosa.load('audio/' + f, sr=None, mono=True); peak = float(np.abs(y).max())
    nz = np.where(np.abs(y) > peak * .05)[0]; lead = nz[0] / sr if len(nz) else 0; amb = any(k in base for k in AMB) and not any(k in base for k in ('transition', 'strike', 'swoosh', 'fish', 'rattlesnake', 'hawk', 'impact', 'notification', 'strange-animal', 'woosh', 'whoosh', 'explosion', 'ignition', 'spell', 'meteor', 'beam', 'match', 'walking', 'running', 'footsteps', 'shriek', 'screech'))
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
