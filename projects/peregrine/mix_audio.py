"""Gabungkan narasi + musik latar CC0 + efek suara (sfx-kit, CC0) jadi audio.wav.
  python3 mix_audio.py
Musik: katalog repos/video-background-music (semua CC0-1.0), diunduh dengan projects/musik/ambil_musik.py.
  - Bagian utama: "LD 06" (ludum-dare-30-06, uplifting, 96 BPM), Tallbeard Studios, CC0
  - Bagian rekor (a1 sampai f4): "LD 03" (ludum-dare-30-03, epic & misterius, 100 BPM), Tallbeard Studios, CC0
Musik otomatis turun saat narasi bicara (ducking)."""
import os, json, numpy as np, soundfile as sf, librosa
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 44100
ROOT = os.path.join(HERE, '..', '..')
tl = json.load(open(os.path.join(HERE, 'timeline.json'))); DUR = tl['duration']; N = int(DUR * SR)
L = {l['id']: l for l in tl['lines']}
def load(p, mono=False):
    a, sr = sf.read(p, always_2d=True); a = a.T.astype(np.float32)
    if sr != SR: a = np.stack([librosa.resample(c, orig_sr=sr, target_sr=SR) for c in a])
    if a.shape[0] == 1: a = np.vstack([a, a])
    return a[:2]
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); n = min(sig.shape[1], N - i)
    if n > 0 and i >= 0: buf[:, i:i + n] += sig[:, :n] * g
def fade(n, a, b, k0, k1):   # envelope 0..1 rising between sample a..b, falling between k0..k1
    e = np.ones(n); x = np.arange(n)
    e = np.minimum(e, np.clip((x - a) / max(1, b - a), 0, 1)); e = np.minimum(e, np.clip((k1 - x) / max(1, k1 - k0), 0, 1)); return e

voice = load(os.path.join(HERE, 'narasi.wav')); voice = np.pad(voice, ((0, 0), (0, max(0, N - voice.shape[1]))))[:, :N]
# music: A for the story, B (epic/mysterious) for the record reveal, crossfaded
cache = os.path.join(ROOT, 'projects', 'musik', 'cache')
A = load(os.path.join(cache, 'ludum-dare-30-06.ogg')); B = load(os.path.join(cache, 'ludum-dare-30-03.ogg'))
def loopto(x, n): r = int(np.ceil(n / x.shape[1])); return np.tile(x, (1, r))[:, :n]
A = loopto(A, N); B = loopto(B, N)
ra, rb = int((L['a1']['t0'] - .8) * SR), int((L['f4']['t1'] + .8) * SR)
eB = fade(N, ra, ra + int(1.5 * SR), rb, rb + int(1.5 * SR)); eA = 1 - eB
eA = np.minimum(eA, fade(N, 0, int(.4 * SR), N - int(1.5 * SR), N))
music = A * eA + B * eB
# ducking: music drops ~10 dB while the voice speaks (smoothed envelope)
env = np.abs(voice[0]); k = int(.2 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env = np.clip(env / (np.percentile(env, 95) * .5 + 1e-9), 0, 1)
env = np.convolve(env, np.ones(int(.35 * SR)) / int(.35 * SR), 'same')
music *= (1 - .68 * env)
# effects
sfx = np.zeros((2, N), np.float32)
for t, f, g in json.load(open(os.path.join(HERE, 'cues.json'))):
    p = os.path.join(ROOT, 'repos', 'sfx-kit', 'sounds', f + '.wav')
    if os.path.exists(p): place(sfx, load(p), t, g)
    else: print('tidak ada:', f)
def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak
mix = norm(voice, .95) + norm(music, .32) + norm(sfx, .5)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
sf.write(os.path.join(HERE, 'audio.wav'), (norm(mix, .9)).T, SR)
print('audio.wav', round(DUR, 1), 's')
