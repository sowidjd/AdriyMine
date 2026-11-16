"""Putaran 3 pelatihan alfabet. Temuan: huruf tanpa konteks membuat nada melonjak (+19 semitone, suara melengking);
dengan kalimat pengantar "Sekarang hurufnya: ..." nada tetap seperti suara asli (selisih < 2 semitone).
Cara: buat "Sekarang hurufnya: I, Je." -> cek ucapan (Whisper) + cek nada -> potong pengantar pakai cap waktu per kata.
  python3 latih_alfabet3.py REF.wav
Hasil: alfabet/v3_<kelompok>.wav, alfabet.wav (A-Z), kamus_huruf.json diperbarui."""
import sys, os, re, json
import numpy as np, soundfile as sf, librosa, torch
torch.set_num_threads(os.cpu_count())
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'alfabet'); os.makedirs(OUT, exist_ok=True)
REF = os.path.abspath(sys.argv[1]); PENGANTAR = 'Sekarang hurufnya:'

def med_f0(y, sr):
    """Median nada bagian bersuara (pYIN, rentang suara laki-laki 70-320 Hz supaya tidak salah baca 2x lipat).
    Bila hampir tidak ada bagian bersuara di rentang itu (suara melengking/aneh), kembalikan nilai yang pasti ditolak."""
    y = librosa.resample(np.asarray(y, np.float32), orig_sr=sr, target_sr=16000)
    f0, v, _ = librosa.pyin(y, fmin=70, fmax=320, sr=16000, frame_length=1024, hop_length=160)
    g = f0[~np.isnan(f0)]
    rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=160)[0]
    loud = (rms > rms.max() * .2).sum()
    if len(g) < max(5, .2 * loud): return SPK * 4 if 'SPK' in globals() else float('nan')
    return float(np.median(g))
r, rsr = sf.read(REF); SPK = med_f0(r, rsr)

# kelompok huruf -> ejaan yang dicoba (G/I/J dipisah karena sering tertukar)
KELOMPOK = [
    ('ABC', ['A, Be, Ce', 'A, Bé, Cé']), ('DEF', ['De, E, Ef', 'Dé, É, Ef']), ('GH', ['Ge, Ha', 'Gé, Ha']),
    ('IJ', ['I, Je', 'I, Jé', 'Ii, Je']), ('KLM', ['Ka, El, Em']), ('NOP', ['En, O, Pe', 'En, O, Pé']),
    ('QRS', ['Ki, Er, Es', 'Kii, Er, Es']), ('TUV', ['Te, U, Ve', 'Té, U, Vé', 'Te, U, Fe']), ('WXYZ', ['We, Eks, Ye, Zet', 'Wé, Eks, Yé, Zet']),
]
from transformers import pipeline
asr = pipeline('automatic-speech-recognition', model='openai/whisper-medium', device='cpu')
def hear(w, sr, words=False):
    a = librosa.resample(np.asarray(w, np.float32), orig_sr=sr, target_sr=16000)
    o = asr({'raw': a, 'sampling_rate': 16000}, return_timestamps='word' if words else False,
            generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})
    return o
def letters_ok(heard, grp):
    after = re.split(r'huruf\w*', heard.lower(), maxsplit=1)[-1]
    l = re.sub(r'[^a-z]', '', after)
    return l == grp.lower() or l.replace('e', '') == grp.lower().replace('e', '') or l in {grp.lower() + 'e'}
from voxcpm import VoxCPM
m = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False); SR = m.tts_model.sample_rate
kp = os.path.join(HERE, 'kamus_huruf.json'); kamus = json.load(open(kp)) if os.path.exists(kp) else {}
for grp, cands in KELOMPOK:
    if os.path.exists(os.path.join(OUT, f'v3_{grp}.wav')): continue
    best = None
    for c in cands:
        for _ in range(3):
            w = m.generate(text=f'{PENGANTAR} {c}.', reference_wav_path=REF, cfg_value=2.0, inference_timesteps=10)
            o = hear(w, SR, words=True); heard = o['text'].strip()
            # cut the lead-in: everything up to the end of the word "hurufnya"
            cut = None
            for ch in o.get('chunks', []):
                if 'huruf' in ch['text'].lower(): cut = ch['timestamp'][1]
            seg = w[int((cut or 0) * SR):] if cut else w
            pitch = 12 * np.log2(med_f0(seg, SR) / SPK) if len(seg) > SR * .3 else 99
            good = letters_ok(heard, grp) and abs(pitch) <= 3 and cut is not None
            print(f'  {grp} | {c} -> {heard} | nada {pitch:+.1f} st | {"OK" if good else "ulang"}', flush=True)
            if good: best = (c, seg); break
        if best: break
    if not best: print(f'{grp} GAGAL', flush=True); continue
    # trim leading silence of the cut part, keep a short fade-in
    seg = best[1]; idx = np.argmax(np.abs(seg) > np.abs(seg).max() * .05); seg = seg[max(0, idx - int(.03 * SR)):]
    sf.write(os.path.join(OUT, f'v3_{grp}.wav'), seg, SR)
    for h, sp in zip(grp, [s.strip() for s in best[0].split(',')]): kamus[h] = sp
    json.dump(kamus, open(kp, 'w'), ensure_ascii=False, indent=1)
    print(f'{grp} OK ejaan: {best[0]}', flush=True)
parts = []
for grp, _ in KELOMPOK:
    f = os.path.join(OUT, f'v3_{grp}.wav')
    if os.path.exists(f): a, sr = sf.read(f); parts += [a / (np.abs(a).max() + 1e-9) * .9, np.zeros(int(.5 * sr))]
sf.write(os.path.join(HERE, 'alfabet.wav'), np.concatenate(parts), SR)
print('SELESAI')
