"""Musik latar + efek suara untuk video "Bangun Pagi", disintesis dengan numpy (tanpa rekaman, bebas hak cipta).
Efek suara dibaca dari cues.json (ditulis render.mjs dari index.html), jadi selalu pas dengan gambar.
Jalankan: python3 audio.py  ->  audio.wav"""
import json, wave, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR, DUR = 44100, 171.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
MUS = np.zeros((N, 2)); SFX = np.zeros((N, 2))
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
T = lambda n: np.arange(n) / SR

def add(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * gain
    buf[i:i + len(sig), 0] += sig * (1 - max(0, pan)); buf[i:i + len(sig), 1] += sig * (1 + min(0, pan))

def lowpass(x, c):
    y = np.empty_like(x); k = 0.0
    for i in range(len(x)): k += c * (x[i] - k); y[i] = k
    return y

def env(n, a=.005, d=None):
    t = T(n); e = np.minimum(1, t / a) if a > 0 else np.ones(n)
    return e * (np.exp(-t / d) if d else 1)

def tone(f0, f1, dur, a=.005, d=.15, sq=False):
    n = int(dur * SR); f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) if not sq else .5 * np.sign(np.sin(ph)) + .5 * np.sin(ph)
    return s * env(n, a, d)

def noise(dur, a=.002, d=.05, bright=True):
    n = int(dur * SR); x = rng.standard_normal(n)
    if bright: x = np.diff(x, prepend=0)
    return x / 3 * env(n, a, d)

def whoosh(dur):
    n = int(dur * SR); x = lowpass(rng.standard_normal(n), .12)
    return x / (np.abs(x).max() + 1e-9) * np.sin(np.linspace(0, np.pi, n)) ** 1.5

def chime(f, dur=1.2):
    return sum(tone(f * m, f * m, dur, .003, dur / (2 + i)) * g for i, (m, g) in enumerate([(1, 1), (2, .4), (3, .2), (4.2, .12)]))

def boing(f0, f1, dur=.45):
    n = int(dur * SR); t = T(n); f = f0 + (f1 - f0) * (1 - np.exp(-t * 18)) + 40 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, .16)

def alarm(dur=2.2):   # classic double beep
    out = np.zeros(int(dur * SR))
    for k in range(int(dur / .5)):
        for j in range(2):
            b = tone(1900, 1900, .07, .002, None, True) * env(int(.07 * SR), .002, .05); i = int((k * .5 + j * .11) * SR)
            out[i:i + len(b)] += b[: len(out) - i]
    return out

def seq(parts, total):
    out = np.zeros(int(total * SR))
    for off, sig in parts:
        i = int(off * SR); n = min(len(sig), len(out) - i)
        if n > 0: out[i:i + n] += sig[:n]
    return out

SFXLIB = {
    'alarm': lambda: alarm(2.2) * .55,
    'alarmShort': lambda: alarm(.5) * .5,
    'slap': lambda: seq([(0, noise(.12, .001, .03, False) * 2.2), (0, tone(180, 90, .12, .001, .04))], .15),
    'sting': lambda: seq([(0, tone(220, 210, .7, .005, .35, True) * .4), (0, tone(233, 222, .7, .005, .35, True) * .4)], .7),
    'drop': lambda: tone(110, 40, .6, .002, .25) * 1.2,
    'whoosh': lambda: whoosh(.45) * .8,
    'pop': lambda: tone(500, 900, .09, .002, .03),
    'tick': lambda: tone(1400, 1100, .04, .001, .012) * .6,
    'ticks': lambda: seq([(i * .12, tone(2200, 2200, .03, .001, .01)) for i in range(24)], 3),
    'boing': lambda: boing(260, 700),
    'patter': lambda: seq([(i * .14, noise(.06, .001, .02, False) * 1.5) for i in range(16)], 2.4),
    'dizzy': lambda: seq([(i * .16, tone(1800, 2400, .12, .003, .05)) for i in range(5)], 1),
    'sad': lambda: seq([(k * .42, tone(f0, f1, .5 if k < 3 else 1.1, .03, .25 if k < 3 else .6, True) * .5) for k, (f0, f1) in enumerate([(392, 370), (370, 349), (349, 330), (330, 262)])], 2.6),
    'idea': lambda: seq([(i * .07, chime(f, 1.0) * .7) for i, f in enumerate([784, 988, 1175, 1568])], 1.6),
    'trick': lambda: seq([(0, whoosh(.3) * .6), (.15, chime(1047, 1.2) + chime(1319, 1.2) * .6)], 1.4),
    'place': lambda: seq([(0, tone(900, 700, .08, .001, .03)), (0, noise(.05, .001, .015, False))], .1),
    'chime': lambda: seq([(0, chime(1047, 1.4) * .8), (.1, chime(1568, 1.2) * .5)], 1.6),
    'curtain': lambda: lowpass(rng.standard_normal(int(.8 * SR)), .35) * np.sin(np.linspace(0, np.pi, int(.8 * SR))) * 1.4,
    'shimmer': lambda: seq([(i * .06, chime(f, 1.6) * .5) for i, f in enumerate([1047, 1319, 1568, 2093, 2637])], 2.2),
    'down': lambda: tone(800, 200, .7, .01, .4) * .7,
    'beep': lambda: tone(880, 880, .18, .002, .08),
    'launch': lambda: seq([(0, boing(200, 900, .5)), (0, whoosh(.5) * .6)], .6),
    'thud': lambda: seq([(0, tone(130, 45, .45, .002, .12) * 1.3), (0, noise(.2, .001, .04, False) * .6)], .5),
    'flip': lambda: lowpass(rng.standard_normal(int(.25 * SR)), .5) * np.sin(np.linspace(0, np.pi, int(.25 * SR))) * 1.2,
    'tick2': lambda: seq([(i * .5, tone(1500 if i % 2 else 1200, 1200, .04, .001, .012) * .6) for i in range(12)], 6),
    'end': lambda: chime(523, 2.0) + chime(784, 2.0) * .6,
}

cues = json.load(open(os.path.join(HERE, 'cues.json')))
for t, name, g in cues:
    if name in SFXLIB: add(SFX, SFXLIB[name](), t, g * .5, rng.uniform(-.25, .25))
# ambience: soft room tone at night, birds in the morning scenes
amb = lowpass(rng.standard_normal(N), .02); amb /= np.abs(amb).max(); SFX[:, 0] += amb * .015; SFX[:, 1] += amb * .015
for t in np.arange(76, 166, 2.7):
    for k in range(rng.integers(2, 4)): f = rng.uniform(2600, 3600); add(SFX, tone(f, f * 1.35, .09, .004, .04), t + k * .13 + rng.uniform(0, .5), .05, rng.uniform(-.6, .6))

# ---------- music: 100 BPM ----------
BEAT = .6; BAR = 4 * BEAT
def marimba(m, dur=.6):
    n = int(dur * SR); t = T(n); f = midi(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.minimum(1, t / .002)
def bass(m, dur):
    n = int(dur * SR); t = T(n); f = midi(m)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / .005) * np.exp(-t * 3) * np.minimum(1, (dur - t) / .03)
def pad(ms, dur):
    n = int(dur * SR); t = T(n)
    s = sum(np.sin(2 * np.pi * midi(m) * t + .3 * np.sin(2 * np.pi * 5 * t)) + .4 * np.sin(2 * np.pi * midi(m) * 1.004 * t) for m in ms) / len(ms)
    return s * np.minimum(1, t / .4) * np.minimum(1, (dur - t) / .4)
kick = lambda: tone(120, 45, .3, .001, .09) * 1.4
snare = lambda: seq([(0, noise(.18, .001, .05) * 1.2), (0, tone(220, 180, .1, .001, .04) * .4)], .2)
hat = lambda: noise(.04, .001, .012) * .6
CH = {'C': (48, 'M'), 'F': (53, 'M'), 'G': (55, 'M'), 'Am': (57, 'm'), 'Dm': (50, 'm'), 'E': (52, 'M'), 'Em': (52, 'm')}
def triad(name): r, k = CH[name]; return [r, r + (3 if k == 'm' else 4), r + 7]
# (start, end, progression, density: 'none'|'light'|'calm'|'sad'|'drive'|'happy')
SECT = [(4.3, 35, ['C', 'F', 'G', 'C'], 'light'), (35, 56, ['Am', 'F', 'C', 'G'], 'calm'), (56, 61, ['Am', 'Dm'], 'sad'),
        (61, 66, ['F', 'G'], 'build'), (66, 150, ['C', 'G', 'Am', 'F'], 'drive'), (150, 166, ['F', 'G', 'C', 'C'], 'happy'), (166, 171, ['C'], 'outro')]
PAT = [0, 2, 1, 2, 3, 2, 4, 2]
for a, b, prog, mode in SECT:
    bar = 0; t = a
    while t < b - .05:
        ch = triad(prog[bar % len(prog)]); bl = min(BAR, b - t)
        tones = [m + 24 for m in ch] + [m + 36 for m in ch]
        if mode in ('calm', 'sad', 'outro'): add(MUS, pad([m + 12 for m in ch], bl + .3), t, .18)
        if mode != 'sad': add(MUS, bass(ch[0] - 12 + 12, bl * .48), t, .5); add(MUS, bass(ch[0] - 12 + 12 + (7 if mode in ('drive', 'happy') else 0), bl * .48), t + bl / 2, .45)
        else: add(MUS, bass(ch[0], bl), t, .4)
        step = {'light': BEAT / 2, 'calm': BEAT, 'sad': BEAT * 1.5, 'build': BEAT / 4, 'drive': BEAT / 2, 'happy': BEAT / 2, 'outro': BEAT}[mode]
        k = 0; s = t
        while s < t + bl - 1e-6:
            idx = PAT[k % len(PAT)] if mode != 'build' else k % 6
            add(MUS, marimba(tones[idx % len(tones)], .8 if mode in ('calm', 'sad') else .55), s, .26 if mode != 'calm' else .2, .3 * np.sin(k))
            k += 1; s += step
        if mode in ('drive', 'happy', 'build'):
            for i in range(8):
                s = t + i * BEAT / 2
                if s >= t + bl: break
                add(MUS, hat(), s, .5 if i % 2 else .3, .3)
                if mode != 'build':
                    if i in (0, 3, 4): add(MUS, kick(), s, .7)
                    if i in (2, 6): add(MUS, snare(), s, .45)
                elif i % 2 == 0: add(MUS, kick(), s, .5)
        bar += 1; t += BAR
# duck the music under the trick title cards and the countdown, and let it breathe in the hook
gain = np.ones(N)
def ramp(t0, t1, g):
    i0, i1 = int(t0 * SR), int(t1 * SR); gain[i0:i1] = np.minimum(gain[i0:i1], g)
ramp(117.9, 123.5, .35)
MUS *= gain[:, None]

def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak
mix = norm(MUS, .3) + norm(SFX, .85)
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
fo = int(.4 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
pcm = (norm(mix, .9) * 32767).astype('<i2')
with wave.open(os.path.join(HERE, 'audio.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote audio.wav')
