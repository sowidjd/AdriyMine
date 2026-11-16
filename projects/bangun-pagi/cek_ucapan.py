"""Cek ucapan narasi: ubah tiap kalimat narasi/NN.wav jadi teks (Whisper), bandingkan dengan naskah, tandai yang salah.
  python3 cek_ucapan.py [model]     model default: openai/whisper-medium
Hasil: cek_ucapan.json  {indeks: [skor 0..1, teks yang terdengar]}"""
import sys, os, re, json, difflib
import numpy as np, soundfile as sf, librosa
from transformers import pipeline
HERE = os.path.dirname(os.path.abspath(__file__))
sys.argv += [] ; MODEL = sys.argv[1] if len(sys.argv) > 1 else 'openai/whisper-medium'
src = open(os.path.join(HERE, 'narasi.py')).read()
LINES = eval(src[src.index('LINES = [') + 8: src.index('\n]\n', src.index('LINES = [')) + 2])

NUM = {'0': 'nol', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat', '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'delapan', '9': 'sembilan', '10': 'sepuluh'}
# words the listener may legitimately hear spelled another way
SAME = {'klod': 'claude', 'clod': 'claude', 'klot': 'claude', 'snuz': 'snooze', 'snus': 'snooze', 'wiken': 'weekend', 'tetap': 'tetep', 'trick': 'trik'}
def norm(s):
    s = s.lower()
    s = re.sub(r'\d+', lambda m: ' ' + NUM.get(m.group(), m.group()) + ' ', s)
    s = re.sub(r'[^a-z ]', ' ', s)
    return ' '.join(SAME.get(w, w) for w in s.split())
def score(target, heard):
    return difflib.SequenceMatcher(None, norm(target).replace(' ', ''), norm(heard).replace(' ', '')).ratio()

asr = pipeline('automatic-speech-recognition', model=MODEL, device='cpu')
res = {}
for i, (_, _, s) in enumerate(LINES):
    a, sr = sf.read(os.path.join(HERE, 'narasi', f'{i:02d}.wav'))
    if a.ndim > 1: a = a.mean(1)
    a = librosa.resample(a.astype(np.float32), orig_sr=sr, target_sr=16000)
    heard = asr({'raw': a, 'sampling_rate': 16000}, generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})['text'].strip()
    sc = score(s, heard); res[i] = [round(sc, 3), heard]
    print(f"{i:02d} {sc:.2f} {'OK ' if sc >= .85 else 'SALAH'} | naskah: {s} | terdengar: {heard}", flush=True)
json.dump(res, open(os.path.join(HERE, 'cek_ucapan.json'), 'w'), ensure_ascii=False, indent=1)
