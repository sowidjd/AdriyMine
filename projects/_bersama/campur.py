"""Gabungkan narasi + musik CC0 + efek suara jadi audio.wav, lalu (jika video-tanpa-suara.mp4 ada) jadi video final <folder>/<nama>.mp4.
  python3 campur.py <folder>
Pengaturan di <folder>/musik.json:
  {"musik": [{"file": "x.ogg", "dari": "h1", "sampai": "e3", "gain": 1.0}, ...],   # dari/sampai = id kalimat (atau "awal"/"akhir"); crossfade 1,5 detik
   "jingle": [["h1", "h3", 0.6]],    # opsional: lagu "nyangkut" buatan kode sendiri (milik kita)
   "nama": "judul-file"}
Efek suara dari cues.json: 'mk:<nama>' = Mixkit milik pemilik (projects/sfx-saya/mixkit/normal), lainnya repos/sfx-kit/sounds (CC0).
Musik turun ~10 dB saat narasi bicara; turun lagi di bawah bunyi khas nama akun; menutup bersama kartu "Explore More, Know More"."""
import os, sys, json, subprocess, numpy as np, soundfile as sf, librosa
D = os.path.abspath(sys.argv[1]); ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); SR = 44100
tl = json.load(open(os.path.join(D, 'timeline.json'))); DUR = tl['duration']; N = int(DUR * SR); L = {l['id']: l for l in tl['lines']}
cfg = json.load(open(os.path.join(D, 'musik.json')))
def load(p):
    a, sr = sf.read(p, always_2d=True); a = a.T.astype(np.float32)
    if sr != SR: a = np.stack([librosa.resample(c, orig_sr=sr, target_sr=SR) for c in a])
    if a.shape[0] == 1: a = np.vstack([a, a])
    return a[:2]
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); n = min(sig.shape[1], N - i)
    if n > 0 and i >= 0: buf[:, i:i + n] += sig[:, :n] * g
def tt(x, end):
    if x in (None, 'awal'): return 0.0
    if x == 'akhir': return DUR
    return L[x]['t1'] + .8 if end else L[x]['t0'] - .8
def smooth(x, sec):   # moving average via cumulative sum (fast for long windows)
    k = max(1, int(sec * SR)); c = np.cumsum(np.pad(np.asarray(x, np.float64), (k // 2, k - k // 2))); return ((c[k:] - c[:-k]) / k)[:len(x)].astype(np.float32)
voice = load(os.path.join(D, 'narasi.wav')); voice = np.pad(voice, ((0, 0), (0, max(0, N - voice.shape[1]))))[:, :N]
music = np.zeros((2, N), np.float32); cache = os.path.join(ROOT, 'projects', 'musik', 'cache')
for m in cfg['musik']:
    a = load(os.path.join(cache, m['file'])); a = np.tile(a, (1, int(np.ceil(N / a.shape[1])) + 1))[:, :N]
    s, e = tt(m.get('dari'), False), tt(m.get('sampai'), True); env = np.zeros(N); env[int(max(0, s) * SR):int(min(DUR, e) * SR)] = 1
    music += a * smooth(env, 1.5) * m.get('gain', 1.0)
# the "stuck song": a catchy 4-bar marimba-ish loop made in code (ours)
if cfg.get('jingle'):
    mel = [72, 76, 79, 76, 74, 77, 76, 72]; bpm = 132; beat = 60 / bpm
    def tone(f, d):
        x = np.arange(int(d * SR)) / SR; return (np.sin(2 * np.pi * f * x) + .35 * np.sin(4 * np.pi * f * x) + .1 * np.sin(6 * np.pi * f * x)) * np.exp(-x * 6)
    bar = np.zeros(int(len(mel) * beat * SR))
    for i, n in enumerate(mel): s = tone(440 * 2 ** ((n - 69) / 12), beat * 1.5); j = int(i * beat * SR); bar[j:j + len(s)] += s[:len(bar) - j]
    jg = np.tile(bar, int(np.ceil(N / len(bar))) + 1)[:N]
    for a_, b_, g in cfg['jingle']:
        env = np.zeros(N); env[int(L[a_]['t0'] * SR):int(L[b_]['t1'] * SR)] = 1; music += np.vstack([jg, jg]) * smooth(env, .4) * g * .5
env = np.abs(voice[0]); env = smooth(env, .2); env = np.clip(env / (np.percentile(env, 95) * .5 + 1e-9), 0, 1); env = smooth(env, .35)
music *= (1 - .68 * env)
if 'a1' in L:   # channel moment: dip under the signature sting
    dip = np.ones(N); bs = int((L['a1']['t1'] - .3) * SR); dip[bs:bs + int(2 * SR)] = .55; music *= smooth(dip, .25)
if 'z' in L:    # closing card: music fades out together with the warm sting
    fo = np.ones(N); zs = int((L['z']['t0'] - .3) * SR); fo[zs:] = np.linspace(1, .25, N - zs); music *= fo
fade = np.ones(N); fade[:int(.3 * SR)] = np.linspace(0, 1, int(.3 * SR)); fade[-int(.6 * SR):] = np.linspace(1, 0, int(.6 * SR)); music *= fade
sfx = np.zeros((2, N), np.float32); miss = []
for t, f, g in json.load(open(os.path.join(D, 'cues.json'))):
    p = os.path.join(ROOT, 'projects', 'sfx-saya', 'mixkit', 'normal', f[3:] + '.wav') if f.startswith('mk:') else os.path.join(ROOT, 'repos', 'sfx-kit', 'sounds', f + '.wav')
    if not os.path.exists(p): miss.append(f); continue
    s = load(p)
    if f.startswith('mk:') and s.shape[1] > 6 * SR: s = s[:, :int(6 * SR)] * np.r_[np.ones(int(5 * SR)), np.linspace(1, 0, int(1 * SR))]   # long ambiences: 6 s max
    place(sfx, s, t, g)
if miss: print('tidak ada:', sorted(set(miss)))
def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak
mix = norm(voice, .95) + norm(music, .3) + norm(sfx, .5); mix = np.tanh(mix * 1.2) / np.tanh(1.2)
out = os.path.join(D, 'audio.wav'); sf.write(out, norm(mix, .9).T, SR); print('audio.wav', round(DUR, 1), 's')
v = os.path.join(D, 'video-tanpa-suara.mp4')
if os.path.exists(v):
    final = os.path.join(D, cfg.get('nama', 'video') + '.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-i', out, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', final], check=True)
    print('video final:', final)
