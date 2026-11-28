"""Cek apakah rekaman pustaka mengucapkan teks yang benar (Whisper medium, CPU).

  python3 projects/suara/pustaka/cek_ucapan.py 10            # semua rekaman tahap 10
  python3 projects/suara/pustaka/cek_ucapan.py 10 --suara amy

Skor 1,00 = sama persis. Skor < 0,95 perlu didengar manual (sering hanya beda angka/ejaan, mis. "3" vs "tiga").
"""
import json, os, re, sys, difflib, subprocess
import numpy as np
from faster_whisper import WhisperModel
P = os.path.dirname(os.path.abspath(__file__))
tahap = sys.argv[1] if len(sys.argv) > 1 else None
suara = sys.argv[sys.argv.index('--suara') + 1] if '--suara' in sys.argv else None
fr = [f for f in json.load(open(os.path.join(P, 'indeks.json')))['frasa']
      if (tahap is None or str(f.get('tahap')) == tahap) and (suara is None or f['suara'] == suara)]
def load(p):
    b = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', p, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    return np.frombuffer(b, np.int16).astype(np.float32) / 32768
def norm(t):
    t = re.sub(r'\[[^\]]*\]', ' ', t).lower()
    return ' '.join(re.sub(r'[^0-9a-z\s]', ' ', t).split())
m = WhisperModel('medium', device='cpu', compute_type='int8')
hasil = []
for f in fr:
    seg, _ = m.transcribe(load(os.path.join(P, f['file'])), language='id', beam_size=5)
    hyp = ' '.join(s.text for s in seg).strip()
    hasil.append((difflib.SequenceMatcher(None, norm(f['teks']), norm(hyp)).ratio(), f['suara'], f['id'], f['teks'], hyp))
hasil.sort()
ok = sum(r >= .95 for r, *_ in hasil)
print(f'{ok}/{len(hasil)} rekaman cocok (>= 0,95)')
for r, s, i, t, h in hasil:
    if r < .95: print(f'  {r:.2f} {s}/{i}: "{t}" -> terdengar "{h}"')
