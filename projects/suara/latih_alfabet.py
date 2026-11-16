"""Latih kamus ucapan huruf A-Z (bahasa Indonesia) untuk tiruan suara VoxCPM2.
Untuk tiap huruf: coba beberapa ejaan bantu, cek hasilnya dengan Whisper, simpan ejaan yang terbukti benar.
  python3 latih_alfabet.py REF.wav
Hasil: alfabet/<HURUF>.wav, kamus_huruf.json {huruf: ejaan yang berhasil}, alfabet.wav (A sampai Z berurutan)."""
import sys, os, re, json
import numpy as np, soundfile as sf, librosa, torch
torch.set_num_threads(os.cpu_count())
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'alfabet'); os.makedirs(OUT, exist_ok=True)

# nama huruf baku bahasa Indonesia -> ejaan bantu yang dicoba (urutan = prioritas)
HURUF = {
    'A': ['A.', 'Aa.', 'Ah.'], 'B': ['Be.', 'Bé.', 'Beh.'], 'C': ['Ce.', 'Cé.', 'Ceh.'], 'D': ['De.', 'Dé.', 'Deh.'],
    'E': ['E.', 'É.', 'Eh.'], 'F': ['Ef.', 'Éf.', 'Eff.'], 'G': ['Ge.', 'Gé.', 'Geh.'], 'H': ['Ha.', 'Haa.', 'Hah.'],
    'I': ['I.', 'Ii.', 'Ih.'], 'J': ['Je.', 'Jé.', 'Jeh.'], 'K': ['Ka.', 'Kaa.', 'Kah.'], 'L': ['El.', 'Él.', 'Ell.'],
    'M': ['Em.', 'Ém.', 'Emm.'], 'N': ['En.', 'Én.', 'Enn.'], 'O': ['O.', 'Oo.', 'Oh.'], 'P': ['Pe.', 'Pé.', 'Peh.'],
    'Q': ['Ki.', 'Kii.', 'Kih.'], 'R': ['Er.', 'Érr.', 'Err.'], 'S': ['Es.', 'És.', 'Ess.'], 'T': ['Te.', 'Té.', 'Teh.'],
    'U': ['U.', 'Uu.', 'Uh.'], 'V': ['Ve.', 'Vé.', 'Fe.'], 'W': ['We.', 'Wé.', 'Weh.'], 'X': ['Eks.', 'Éks.', 'Ekss.'],
    'Y': ['Ye.', 'Yé.', 'Yeh.'], 'Z': ['Zet.', 'Zét.', 'Zett.'],
}
# apa saja yang boleh "terdengar" untuk tiap huruf (Whisper sering menulis hurufnya sendiri)
def ok_set(h, name):
    n = re.sub(r'[^a-z]', '', name.lower().replace('é', 'e'))
    return {h.lower(), n, n.rstrip('h'), n[:-1] if len(n) > 2 and n[-1] == n[-2] else n} | ({'f', 'fe', 've'} if h == 'V' else set()) | ({'q', 'ki', 'kiu'} if h == 'Q' else set())

ref = os.path.abspath(sys.argv[1])
from transformers import pipeline
asr = pipeline('automatic-speech-recognition', model=os.environ.get('JUDGE', 'openai/whisper-medium'), device='cpu')
def hear(wav, sr):
    a = librosa.resample(np.asarray(wav, np.float32), orig_sr=sr, target_sr=16000)
    return asr({'raw': a, 'sampling_rate': 16000}, generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})['text'].strip()
from voxcpm import VoxCPM
model = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False); SR = model.tts_model.sample_rate
STYLE = 'spelling out a single letter of the alphabet, clear, calm, crisp articulation'
kamus = {}
kp = os.path.join(HERE, 'kamus_huruf.json')
if os.path.exists(kp): kamus = json.load(open(kp))
for h, cands in HURUF.items():
    if h in kamus and os.path.exists(os.path.join(OUT, f'{h}.wav')): continue
    good = ok_set(h, cands[0]); best = None
    for c in cands:
        for _ in range(2):
            wav = model.generate(text=f'({STYLE}){c}', reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
            heard = hear(wav, SR); hw = re.sub(r'[^a-z]', '', heard.lower())
            if hw in good: best = (c, wav, heard); break
            if best is None: best = (None, wav, heard)
        if best and best[0]: break
    sf.write(os.path.join(OUT, f'{h}.wav'), best[1], SR)
    kamus[h] = best[0]
    json.dump(kamus, open(kp, 'w'), ensure_ascii=False, indent=1)
    print(f"{h} {'OK ' if best[0] else 'GAGAL'} ejaan: {best[0]} | terdengar: {best[2]}", flush=True)

# alfabet.wav: A..Z berurutan, jeda 0.45 s
parts = []
for h in HURUF:
    a, sr = sf.read(os.path.join(OUT, f'{h}.wav')); a = a / (np.abs(a).max() + 1e-9) * .9
    parts += [a, np.zeros(int(.45 * sr))]
sf.write(os.path.join(HERE, 'alfabet.wav'), np.concatenate(parts), SR)
print('SELESAI', sum(1 for v in kamus.values() if v), 'dari', len(HURUF), 'huruf benar')
