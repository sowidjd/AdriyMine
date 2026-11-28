"""Susun narasi dari file PER KALIMAT (hasil ElevenLabs Hasan/Amy) -> narasi.wav + timeline.json.
Lebih cepat dari susun_narasi.py: tidak perlu memotong rekaman panjang dengan Whisper.

  python3 projects/suara/susun_per_kalimat.py <folder-video> [target-detik]

Butuh di <folder-video>:
  naskah.json            (id, text, gap per kalimat; seperti biasa)
  narasi/<id>.mp3        satu file per kalimat (id sama dengan naskah.json)
  narasi/<id>.mp3 untuk kalimat yang ada di pustaka boleh disalin dari projects/suara/pustaka/<suara>/<frasa>.mp3
Hasil: <folder-video>/narasi.wav dan timeline.json (lalu render.mjs + campur.py seperti biasa).
Bila target diberi: jeda diskalakan; bila suara terlalu panjang, tempo dinaikkan maks. 1,1x (nada tetap, aturan §12)."""
import json, sys, os, subprocess, numpy as np, soundfile as sf, librosa
D = os.path.abspath(sys.argv[1]); TARGET = float(sys.argv[2]) if len(sys.argv) > 2 else None; SR = 44100
N = json.load(open(os.path.join(D, 'naskah.json')))

def muat(p):
    a, sr = librosa.load(p, sr=SR, mono=True); return a.astype(np.float32)
def rapikan(c, maks=.16):                      # buang diam di tepi + pendekkan diam panjang di dalam kalimat
    f = int(.01 * SR); e = np.sqrt(np.convolve(c ** 2, np.ones(f) / f, 'same')); th = max(e.max() * .03, 1e-4); on = np.where(e > th)[0]
    if len(on): c = c[max(0, on[0] - int(.04 * SR)):on[-1] + int(.08 * SR)]
    e = np.sqrt(np.convolve(c ** 2, np.ones(f) / f, 'same')); diam = e < th; out, i, n = [], 0, len(c)
    while i < n:
        j = i
        while j < n and diam[j] == diam[i]: j += 1
        if diam[i] and j - i > maks * SR and 0 < i and j < n: h = int(maks * SR / 2); out += [c[i:i + h], c[j - h:j]]
        else: out.append(c[i:j])
        i = j
    c = np.concatenate(out); r = int(.01 * SR); c[:r] *= np.linspace(0, 1, r); c[-r:] *= np.linspace(1, 0, r); return c
def tempo(c, t):
    sf.write('/tmp/_k.wav', c, SR); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/_k.wav', '-af', f'atempo={t:.4f}', '/tmp/_k2.wav'], check=True); return sf.read('/tmp/_k2.wav')[0].astype(np.float32)

klip, hilang = {}, []
for l in N['lines']:
    p = next((os.path.join(D, 'narasi', l['id'] + e) for e in ('.mp3', '.wav') if os.path.exists(os.path.join(D, 'narasi', l['id'] + e))), None)
    if not p: hilang.append(l['id']); continue
    klip[l['id']] = rapikan(muat(p))
if hilang: raise SystemExit('file narasi belum ada: ' + ', '.join(hilang))
dur = sum(len(c) for c in klip.values()) / SR; gaps = sum(l['gap'] for l in N['lines'][:-1]); lead, ekor = N.get('lead', .3), 1.6
t_ = 1.0; skala = 1.0
if TARGET:
    skala = (TARGET - lead - ekor - dur) / gaps
    if skala < .55:
        t_ = min(1.1, dur / max(1, TARGET - lead - ekor - gaps * .55)); klip = {k: tempo(c, t_) for k, c in klip.items()}
        dur = sum(len(c) for c in klip.values()) / SR; skala = max(.2, (TARGET - lead - ekor - dur) / gaps)
    skala = min(skala, 2.5)
out, t, L = [np.zeros(int(lead * SR), np.float32)], lead, []
for k, l in enumerate(N['lines']):
    c = klip[l['id']]; L.append({'id': l['id'], 't0': round(t, 3), 't1': round(t + len(c) / SR, 3), 'cap': l['cap']}); out.append(c); t += len(c) / SR
    if k < len(N['lines']) - 1: g = l['gap'] * skala; out.append(np.zeros(int(g * SR), np.float32)); t += g
out.append(np.zeros(int(ekor * SR), np.float32)); w = np.concatenate(out); w = w / (np.abs(w).max() + 1e-9) * .95
sf.write(os.path.join(D, 'narasi.wav'), np.stack([w, w], 1), SR)
json.dump({'duration': round(len(w) / SR, 3), 'lines': L}, open(os.path.join(D, 'timeline.json'), 'w'), ensure_ascii=False, indent=0)
print(f'{len(L)} kalimat, suara {dur:.1f} s, tempo {t_:.3f}x, skala jeda {skala:.2f}, total {len(w) / SR:.2f} s')
