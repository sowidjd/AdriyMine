"""Perbaiki ucapan kalimat narasi yang salah: coba beberapa ejaan bantu (hanya untuk suara, teks di layar tetap),
buat beberapa versi, cek tiap versi dengan Whisper, simpan yang paling tepat ke narasi/NN.wav.
  python3 perbaiki_ucapan.py REF.wav 0,5,7      (indeks kalimat; tanpa daftar = semua yang skornya < 0.9 di cek_ucapan.json)"""
import sys, os, json, re
import numpy as np, soundfile as sf, librosa, torch
torch.set_num_threads(os.cpu_count())
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'narasi')
sys.path.insert(0, HERE)
ns = {}; src = open(os.path.join(HERE, 'narasi.py')).read()
exec(src[: src.index("if sys.argv[1] == 'gen':")].replace('HERE = os.path.dirname(os.path.abspath(__file__))', f'HERE = {HERE!r}'), ns)
LINES, style = ns['LINES'], ns['style']
cu = {}; exec(open(os.path.join(HERE, 'cek_ucapan.py')).read().split('asr = pipeline')[0].replace("MODEL = sys.argv[1] if len(sys.argv) > 1 else 'openai/whisper-medium'", "MODEL = ''"), cu)
score = cu['score']

# Ejaan bantu: kata di naskah -> cara tulis yang dicoba supaya model mengucapkannya benar (urutan = prioritas)
PRON = {
    'alarm': ['alarm', 'alarem', 'a-larm', 'alarrm'],
    'Alarm': ['Alarm', 'Alarem', 'A-larm', 'Alarrm'],
    'snooze': ['snuz', 'snooze', 'snus'],
    'Snooze': ['Snuz', 'Snooze', 'Snus'],
    'Gini': ['Gini', 'Ginii', 'Nah gini'],
    'Cahaya': ['Cahaya', 'Ca-haya', 'Cahaaya'],
    'teler': ['teler', 'te-ler', 'tellerr'],
    'Tiga.': ['Tiga!', 'Tigaa.', 'Ti-ga!'],
    'Dua.': ['Dua!', 'Duaa.', 'Du-a!'],
    'Satu.': ['Satu!', 'Satuu.', 'Sa-tu!'],
    'tetep': ['tetep', 'tetep aja,', 'te-tep'],
}
def variants(s):
    out = [s]
    for w, alts in PRON.items():
        if re.search(rf'(?<![A-Za-z]){re.escape(w)}', s):
            out = [re.sub(rf'(?<![A-Za-z]){re.escape(w)}', a, v) for v in out for a in alts]
    seen = []; [seen.append(v) for v in out if v not in seen]
    return seen[:4]

ref = os.path.abspath(sys.argv[1])
if len(sys.argv) > 2: todo = [int(x) for x in sys.argv[2].split(',')]
else: todo = [int(k) for k, (sc, _) in json.load(open(os.path.join(HERE, 'cek_ucapan.json'))).items() if sc < .9]
from transformers import pipeline
asr = pipeline('automatic-speech-recognition', model='openai/whisper-small', device='cpu')
def hear(wav, sr):
    a = librosa.resample(np.asarray(wav, np.float32), orig_sr=sr, target_sr=16000)
    return asr({'raw': a, 'sampling_rate': 16000}, generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})['text'].strip()
from voxcpm import VoxCPM
model = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False); SR = model.tts_model.sample_rate
for i in todo:
    target = LINES[i][2]; best = (-1, None, '', '')
    f = os.path.join(OUT, f'{i:02d}.wav')
    if os.path.exists(f):   # the current take competes too
        a, sr = sf.read(f); h = hear(a, sr); best = (score(target, h), a, h, '(lama)')
    for v in variants(target):
        for _ in range(2):
            if best[0] >= .97: break
            wav = model.generate(text=f'({style(i)}){v}', reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
            h = hear(wav, SR); sc = score(target, h)
            if sc > best[0]: best = (sc, wav, h, v)
        if best[0] >= .97: break
    if best[3] != '(lama)': sf.write(f, best[1], SR)
    print(f'{i:02d} {best[0]:.2f} pakai: {best[3]} | terdengar: {best[2]}', flush=True)
