"""Musik latar untuk video Clawd & kupu-kupu, disintesis dengan numpy (tanpa rekaman).
Jalankan: python3 music.py  ->  music.wav (15 detik). 120 BPM, mengikuti alur cerita:
  0–5 s    santai & jenaka (marimba + bas)      — Clawd bosan, kupu-kupu datang, menerkam
  5–8.6 s  kejar-kejaran, lebih rapat + shaker  — lari dan dua lompatan
  8.6–11 s sedih, minor & pelan                  — Clawd menyerah
  11–15 s  harapan lalu hangat (pad + arpeggio)  — kupu-kupu hinggap, jatuh hati"""
import numpy as np, wave

SR, DUR = 44100, 15.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - max(0, pan)); R[i:i + len(sig)] += sig * (1 + min(0, pan))

def marimba(m, dur=.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = midi(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    return s * np.minimum(1, t / .002)

def bass(m, dur=.45):
    n = int(dur * SR); t = np.arange(n) / SR; f = midi(m)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / .005) * np.exp(-t * 4) * np.minimum(1, (dur - t) / .03)

def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * midi(m) * t + .3 * np.sin(2 * np.pi * 5 * t)) + .4 * np.sin(2 * np.pi * midi(m) * 1.003 * t) for m in ms) / len(ms)
    return s * np.minimum(1, t / .5) * np.minimum(1, (dur - t) / .6)

def shaker():
    n = int(.06 * SR); x = rng.standard_normal(n); x = np.diff(x, prepend=0)   # bright noise
    return x * np.exp(-np.arange(n) / SR * 60) * .5

def chord(root, kind):   # MIDI notes of a triad
    return [root, root + (3 if kind == 'm' else 4), root + 7]

# (start s, end s, root, kind, note step s, pattern) — pattern indexes chord tones (+3 = octave up)
SECTIONS = [
    (0.0, 2.0, 60, 'M', .25, [0, 2, 1, 2, 3, 2, 1, 2]),    # C   bored, the butterfly arrives
    (2.0, 3.25, 65, 'M', .25, [0, 1, 2, 1]),               # F   notices, sly
    (3.25, 4.0, 67, 'M', .125, [0, 1, 2, 3]),              # G   crouch + pounce: a run-up
    (4.0, 5.0, 67, 'M', .25, [3, 2, 1, 0]),                # G   dizzy, tumbling down
    (5.0, 6.0, 60, 'M', .125, [0, 2, 3, 2]),               # C   the chase
    (6.0, 7.0, 67, 'M', .125, [0, 2, 3, 2]),               # G
    (7.0, 8.0, 69, 'm', .125, [0, 2, 3, 2]),               # Am
    (8.0, 8.6, 65, 'M', .125, [3, 2, 1, 0]),               # F   the hard landing
    (8.6, 9.8, 57, 'm', .5, [0, 2, 1]),                    # Am  gives up
    (9.8, 11.0, 62, 'm', .5, [2, 1, 0]),                   # Dm
    (11.0, 12.4, 65, 'M', .25, [0, 1, 2, 3, 2, 1]),        # F   the butterfly drifts down
    (12.4, 13.1, 67, 'M', .25, [0, 1, 2]),                 # G   it lands
    (13.1, 15.0, 60, 'M', .25, [0, 1, 2, 3, 4, 5, 3, 2]),  # C   love
]
for (a, b, root, kind, step, pat) in SECTIONS:
    tones = chord(root, kind); tones = tones + [m + 12 for m in tones]
    k, t = 0, a
    while t < b - 1e-6:
        m = tones[pat[k % len(pat)] % len(tones)] + 12
        sad = 8.6 <= a < 11
        add(marimba(m, .9 if sad else .6), t, .16 if sad else .2, .25 * np.sin(k))
        k += 1; t += step
    # bass on each beat (half notes when sad)
    bstep = 1.0 if 8.6 <= a < 11 else .5
    t = a
    while t < b - 1e-6:
        add(bass(root - 24 + (7 if (t - a) % 1.0 >= .5 and bstep == .5 and a >= 5 and a < 8.6 else 0), bstep * .9), t, .28)
        t += bstep
    if 5.0 <= a < 8.6:   # shaker on eighths during the chase
        t = a
        while t < b - 1e-6: add(shaker(), t, .1 if int(round(t * 4)) % 2 else .06, .3); t += .25
add(pad(chord(57, 'm'), 2.6), 8.5, .07)        # sad pad
add(pad(chord(62, 'm'), 1.4), 9.8, .07)
add(pad(chord(65, 'M') + [72], 2.2), 11.0, .07) # hopeful pad
add(pad(chord(60, 'M') + [72, 76], 2.2), 12.9, .09)   # warm ending
add(marimba(84, 1.5), 14.6, .2); add(marimba(72, 1.5), 14.6, .15)   # final note

st = np.stack([L, R], 1)
st = np.tanh(st * 1.2) / np.tanh(1.2)
fi = int(.4 * SR); fo = int(.4 * SR)
st[:fi] *= np.linspace(0, 1, fi)[:, None]; st[-fo:] *= np.linspace(1, 0, fo)[:, None]
pcm = (st / max(1e-9, np.abs(st).max()) * .89 * 32767).astype('<i2')
with wave.open(__file__.rsplit('/', 1)[0] + '/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote music.wav')
