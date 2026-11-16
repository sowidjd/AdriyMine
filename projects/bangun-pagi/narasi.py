"""Narasi suara untuk video "Bangun Pagi" dengan VoxCPM2 (OpenBMB, Apache 2.0), meniru suara pemilik dari rekaman contoh.
  python3 narasi.py gen REF.wav      -> narasi/NN.wav (satu file per kalimat; yang sudah ada dilewati)
  python3 narasi.py mix              -> narasi.wav (171 s): tiap kalimat ditaruh di waktunya, dipercepat sedikit bila terlalu panjang
REF.wav = potongan rekaman suara 10-30 detik; PROMPT_TEXT = isi 8 detik pertamanya (untuk mode lanjutan, tiruan lebih mirip)."""
import sys, os, subprocess, json
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'narasi')
PROMPT_TEXT = "Di langit, ada seekor burung yang ketika melihat mangsanya bisa berubah menjadi salah satu makhluk tercepat di planet ini."

# (mulai, batas akhir, kalimat) dalam detik video. "Klod" = cara baca "Clawd".
LINES = [
    (0.2, 2.4, "Alarm bunyi tujuh kali..."),
    (2.45, 4.3, "tetep aja telat."),
    (4.35, 7.0, "Tapi tenang, masalahnya bukan karena kamu malas."),
    (7.3, 10.0, "Nah, kenalin. Ini si Klod."),
    (10.05, 13.0, "Tiap pagi, dramanya sama."),
    (13.2, 15.0, "Jam lima, alarm bunyi."),
    (15.5, 18.0, "Lima menit lagi deh..."),
    (18.4, 21.0, "Snooze lagi."),
    (21.4, 24.0, "Snooze lagi."),
    (24.2, 27.0, "Dan seterusnya..."),
    (27.2, 31.0, "Jam tujuh kurang seperempat. Panik!"),
    (31.1, 35.0, "Udah tidur lama, kok malah pusing dan lemes?"),
    (35.3, 40.0, "Gini nih yang terjadi di otakmu."),
    (40.1, 46.0, "Tiap kamu snooze, otak mulai masuk tidur lagi."),
    (46.1, 51.0, "Sembilan menit kemudian, dipotong paksa lagi."),
    (51.1, 56.0, "Hasilnya? Mabuk tidur. Makin sering snooze, makin teler."),
    (56.3, 60.0, "Klod udah pasang sepuluh alarm. Tetep gagal."),
    (60.1, 64.0, "Terus dia nyoba cara yang agak... aneh."),
    (64.1, 66.0, "Dan ternyata berhasil."),
    (66.2, 68.2, "Trik satu: musuhin alarmmu."),
    (68.4, 74.0, "Taruh alarm jauh dari kasur. Di seberang kamar."),
    (74.4, 80.0, "Mau matiin? Harus bangun dan jalan dulu."),
    (80.1, 85.0, "Badan udah gerak, otak ikut nyala."),
    (85.1, 88.0, "Snooze jadi males duluan."),
    (88.2, 90.2, "Trik dua: kejar matahari."),
    (90.4, 96.0, "Begitu bangun, langsung buka jendela."),
    (96.1, 103.0, "Cahaya pagi ngasih sinyal ke otak: udah pagi, stop ngantuk."),
    (103.1, 108.0, "Hormon ngantuknya, melatonin, langsung turun."),
    (108.1, 110.0, "Mendung? Lampu terang juga ngaruh."),
    (110.2, 112.2, "Trik tiga: hitung mundur."),
    (113.5, 118.0, "Kelamaan mikir, otak keburu cari alasan."),
    (118.05, 119.1, "Lima."), (119.17, 120.2, "Empat."), (120.29, 121.3, "Tiga."), (121.41, 122.4, "Dua."), (122.53, 123.5, "Satu."),
    (123.6, 125.5, "Lompat!"),
    (126.1, 130.0, "Jangan kasih otak waktu buat nego."),
    (130.2, 132.2, "Trik empat: jam tidur yang sama."),
    (132.4, 138.0, "Tidur dan bangun di jam yang sama. Weekend juga."),
    (138.1, 144.0, "Badanmu punya jam sendiri."),
    (144.3, 150.0, "Kalau rutin, lama-lama kamu bangun sebelum alarm."),
    (150.2, 152.6, "Seminggu kemudian..."),
    (152.9, 160.0, "Sekali bunyi, langsung bangun."),
    (160.1, 166.0, "Jadi, empat trik: alarm jauh, cari cahaya, hitung mundur, jam tidur sama."),
    (166.2, 167.9, "Coba tujuh hari ya."),
    (168.0, 171.0, "Kamu tim snooze atau tim bangun pagi? Tulis di komentar!"),
]

# Arahan gaya per kalimat (VoxCPM2 "controllable cloning": deskripsi dalam kurung sebelum teks).
# Tanpa prompt lanjutan, supaya nada tidak ikut datar seperti rekaman contoh.
def style(i):
    if i == 0: return "dramatic, exasperated, storytelling tone with strong rise and fall"
    if i == 1: return "exasperated sigh, moderate pace, clear articulation"
    if i == 2: return "playful, reassuring, warm smile in the voice"
    if i <= 4: return "friendly, cheerful, clear articulation, like introducing a friend"
    if i == 5: return "sleepy, slow, drowsy"
    if i == 6: return "very sleepy, mumbling, lazy whisper"
    if i <= 9: return "comedic, deadpan, a bit faster"
    if i == 10: return "shocked, panicked, urgent and loud"
    if i == 11: return "confused, whiny, rising question intonation"
    if i <= 15: return "curious explainer, lively, expressive emphasis on key words"
    if i == 16: return "sad, disappointed, slow"
    if i == 17: return "mysterious, slowing down with suspense"
    if i == 18: return "surprised and happy, bright"
    if i in (19, 24, 29, 38): return "energetic announcer, excited, punchy"
    if i in (31, 32, 33, 34, 35): return "counting down, firm and clear, crisp articulation"
    if i == 36: return "shouting with excitement, very energetic"
    if i <= 44: return "upbeat, confident, conversational, expressive"
    return "warm, cheerful, inviting, friendly smile in the voice"

if sys.argv[1] == 'gen':
    import soundfile as sf, torch
    torch.set_num_threads(os.cpu_count())
    from voxcpm import VoxCPM
    ref = os.path.abspath(sys.argv[2]); os.makedirs(OUT, exist_ok=True)
    prompt = os.path.join(OUT, '_prompt.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', ref, '-t', '8.0', prompt], check=True)
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
    only = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
    for i, (_, _, s) in enumerate(LINES):
        if only is not None and i not in only: continue
        f = os.path.join(OUT, f'{i:02d}.wav')
        if os.path.exists(f): continue
        wav = model.generate(text=f'({style(i)}){s}', reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
        sf.write(f, wav, model.tts_model.sample_rate); print(f'{i:02d} {len(wav) / model.tts_model.sample_rate:.1f}s {s}', flush=True)
else:
    import numpy as np, soundfile as sf
    SR = 44100; mix = np.zeros(int(171 * SR)); report = []
    for i, (t0, t1, s) in enumerate(LINES):
        f = os.path.join(OUT, f'{i:02d}.wav'); tmp = os.path.join(OUT, '_fit.wav')
        # trim silence at both ends, resample, and speed up (max 1.3x) if it would run past its slot
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse', '-ar', str(SR), '-ac', '1', tmp], check=True)
        a, _ = sf.read(tmp); d = len(a) / SR; room = (t1 - t0) - .05
        sp = min(1.3, d / room) if d > room else 1.0
        if sp > 1.0:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', f'atempo={sp:.3f}', tmp + '.b.wav'], check=True); a, _ = sf.read(tmp + '.b.wav')
        i0 = int(t0 * SR); n = min(len(a), len(mix) - i0); mix[i0:i0 + n] += a[:n]
        report.append((i, round(d, 2), round(t1 - t0, 2), round(sp, 2)))
    mix = mix / (np.abs(mix).max() + 1e-9) * .9
    sf.write(os.path.join(HERE, 'narasi.wav'), mix, SR)
    json.dump([[t0, t1] for t0, t1, _ in LINES], open(os.path.join(HERE, 'narasi_slots.json'), 'w'))
    for r in report: print(r)
