"""Buat ulang versi rapi di normal/ dari audio/ (bila folder normal/ belum ada, misalnya setelah clone).
WAV 48 kHz stereo; jeda awal > 0,3 s dipangkas; puncak -3 dBFS (suasana -12 dBFS).  python3 normalisasi.py"""
import json, os, numpy as np, soundfile as sf, librosa
HERE = os.path.dirname(os.path.abspath(__file__)); os.makedirs(os.path.join(HERE, 'normal'), exist_ok=True)
for o in json.load(open(os.path.join(HERE, 'katalog.json'))):
    y, _ = librosa.load(os.path.join(HERE, 'audio', o['file']), sr=48000, mono=False); y = np.atleast_2d(y)
    if o['bunyi_mulai_s'] > .3: y = y[:, max(0, int((o['bunyi_mulai_s'] - .02) * 48000)):]
    y = y / (np.abs(y).max() + 1e-9) * 10 ** ((-12 if o['kategori'].startswith('Suasana') else -3) / 20)
    if y.shape[0] == 1: y = np.vstack([y, y])
    sf.write(os.path.join(HERE, o['normal']), y.T, 48000, subtype='PCM_16')
print('selesai')
