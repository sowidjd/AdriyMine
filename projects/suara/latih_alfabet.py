"""Latih kamus ucapan huruf A-Z (bahasa Indonesia) untuk tiruan suara VoxCPM2.
Untuk tiap huruf: coba beberapa ejaan bantu, cek hasilnya dengan Whisper, simpan ejaan yang terbukti benar.
  python3 latih_alfabet.py REF.wav
Huruf diucapkan berkelompok seperti mengeja (A, Be, Ce, De, E), lebih stabil daripada satu-satu.\nHasil: alfabet/grupN.wav, kamus_huruf.json {huruf: ejaan yang berhasil}, alfabet.wav (A sampai Z berurutan)."""
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
STYLE = 'spelling out letters of the alphabet one by one, clear, calm, steady pace, crisp articulation'
GROUPS = [list('ABCDE'), list('FGHIJ'), list('KLMNO'), list('PQRST'), list('UVWXYZ')]
kamus = {}; kp = os.path.join(HERE, 'kamus_huruf.json')
def letters_heard(heard):
    toks = [re.sub(r'[^a-z]', '', t) for t in re.split(r'[\s,.;!?-]+', heard.lower().replace('é', 'e'))]
    return [t for t in toks if t]
for gi, G in enumerate(GROUPS):
    pick = {h: 0 for h in G}; best = (-1, None, '', {})
    for attempt in range(5):
        text = ', '.join(HURUF[h][pick[h]].rstrip('.') for h in G) + '.'
        wav = model.generate(text=f'({STYLE}){text}', reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
        heard = hear(wav, SR); toks = letters_heard(heard)
        okd = {h: any(t in ok_set(h, HURUF[h][0]) | ok_set(h, HURUF[h][pick[h]]) for t in toks) for h in G}
        n = sum(okd.values())
        if n > best[0]: best = (n, wav, heard, {h: HURUF[h][pick[h]].rstrip('.') for h in G if okd[h]})
        print(f'  grup {gi + 1} coba {attempt + 1}: {text} -> {heard} ({n}/{len(G)})', flush=True)
        if n == len(G): break
        for h in G:   # only the letters that failed get their next spelling
            if not okd[h]: pick[h] = (pick[h] + 1) % len(HURUF[h])
    sf.write(os.path.join(OUT, f'grup{gi + 1}.wav'), best[1], SR)
    for h in G: kamus[h] = best[3].get(h)
    json.dump(kamus, open(kp, 'w'), ensure_ascii=False, indent=1)
    for h in G: print(f"{h} {'OK ' if kamus[h] else 'GAGAL'} ejaan: {kamus[h]}", flush=True)

parts = []
for gi in range(len(GROUPS)):
    a, sr = sf.read(os.path.join(OUT, f'grup{gi + 1}.wav')); a = a / (np.abs(a).max() + 1e-9) * .9
    parts += [a, np.zeros(int(.6 * sr))]
sf.write(os.path.join(HERE, 'alfabet.wav'), np.concatenate(parts), SR)
print('SELESAI', sum(1 for v in kamus.values() if v), 'dari', len(HURUF), 'huruf benar')
