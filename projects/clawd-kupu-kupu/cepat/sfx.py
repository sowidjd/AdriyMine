"""Efek suara untuk video Clawd & kupu-kupu, disintesis dengan numpy (tanpa file rekaman).
Jalankan: python3 sfx.py  ->  sfx.wav (15 detik, 44.1 kHz, stereo)
Waktu tiap efek mengikuti adegan di index.html (detik video)."""
import numpy as np, wave

SR, DUR = 44100, 15.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); sig = sig[: max(0, N - i)] * gain
    L[i:i + len(sig)] += sig * (1 - max(0, pan)); R[i:i + len(sig)] += sig * (1 + min(0, pan))

def env(n, a=.005, d=None):
    t = np.arange(n) / SR; e = np.minimum(1, t / a) if a > 0 else np.ones(n)
    return e * (np.exp(-t / d) if d else 1)

def tone(f0, f1, dur, a=.005, d=.15, wave_='sine'):
    n = int(dur * SR); f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) if wave_ == 'sine' else np.sign(np.sin(ph)) * .5 + np.sin(ph) * .5
    return s * env(n, a, d)

def noise(dur, a=.01, d=.1, lp=.3):
    n = int(dur * SR); x = rng.standard_normal(n); y = np.zeros(n); k = 0.0
    for i in range(n): k += lp * (x[i] - k); y[i] = k
    return y / (np.abs(y).max() + 1e-9) * env(n, a, d)

def whoosh(dur, up=True):
    n = int(dur * SR); x = rng.standard_normal(n); y = np.zeros(n); k = 0.0
    c = np.linspace(.02, .35, n) if up else np.linspace(.35, .02, n)
    for i in range(n): k += c[i] * (x[i] - k); y[i] = k
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return y / (np.abs(y).max() + 1e-9) * shape

def thud(big=1.0):
    a = tone(140 * big ** -.3, 45, .45, .002, .12 * big) * 1.2; a[:int(.2 * SR)] += noise(.2, .001, .04, .15) * .5
    return a

def chime(f, dur=1.2):
    return sum(tone(f * m, f * m, dur, .003, dur / (2 + i)) * g for i, (m, g) in enumerate([(1, 1), (2, .4), (3, .2), (4.2, .12)]))

def boing(f0=220, f1=520, dur=.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 18)) + 40 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, .16)

def flutter(dur, rate=13):
    n = int(dur * SR); t = np.arange(n) / SR
    am = (.5 + .5 * np.sin(2 * np.pi * rate * t)) ** 3
    return noise(dur, .05, None, .5) * am * np.minimum(1, t / .15) * np.minimum(1, (dur - t) / .15)

def bird(t0, pan):
    for k in range(rng.integers(2, 4)):
        f = rng.uniform(2600, 3600); add(tone(f, f * 1.35, .09, .004, .04), t0 + k * .13, .05, pan)

# --- ambience: birds and a soft breeze through the whole film ---
add(whoosh(DUR, True) * .5 + whoosh(DUR, False) * .5, 0, .035)
for t in [0.4, 1.7, 3.0, 5.6, 7.2, 9.4, 10.8, 12.0, 14.0]: bird(t + rng.uniform(0, .3), rng.uniform(-.6, .6))

# --- shot A ---
add(chime(660, 1.4), 0.05, .12)                         # iris opens
add(flutter(1.35), 0.7, .18, -.5)                       # butterfly flies in
add(tone(1200, 1500, .08, .002, .03), 2.05, .1, .2)     # lands on the flower
add(boing(300, 760, .35), 2.1, .35)                     # "!" surprise
add(tone(500, 500, .12, .002, .05, 'sq') * .6, 2.75, .18)   # sly grin: two sneaky plucks
add(tone(420, 420, .12, .002, .05, 'sq') * .6, 2.92, .18)
add(tone(180, 120, .2, .01, .08), 3.12, .2)             # crouch
add(flutter(1.7), 3.25, .16, .3)                        # butterfly escapes
add(whoosh(.5, True), 3.3, .35)                         # pounce
add(thud(1.2), 3.9, .7)                                 # face-plant
add(boing(160, 260, .7), 3.92, .3, .3)                  # flower springs back
for k in range(4): add(tone(1800, 2400, .12, .003, .05), 4.0 + k * .14, .1, (-1) ** k * .4)   # dizzy tweets
add(whoosh(.6, True), 4.7, .4)                          # brush wipe

# --- shot B ---
for k in range(10): add(noise(.06, .001, .02, .25), 5.05 + k * .125, .22, .1)   # running patter
add(flutter(1.3), 5.0, .14, .4)
add(whoosh(.55, True), 6.25, .32)                       # jump 1
add(thud(.8), 6.9, .5)                                  # land
add(boing(500, 260, .45), 6.95, .3)                     # "?" confused
for k in range(4): add(noise(.06, .001, .02, .25), 7.0 + k * .12, .2, .1)
add(whoosh(.75, True), 7.55, .4)                        # jump 2, bigger
add(flutter(1.0), 7.6, .16, -.3)                        # butterfly loops over
add(thud(1.6), 8.35, .85)                               # hard landing
for k, (f0, f1) in enumerate([(392, 370), (370, 349), (349, 330), (330, 262)]):   # sad "wah wah wah wahhh"
    add(tone(f0, f1, .5 if k < 3 else 1.1, .03, .25 if k < 3 else .6, 'sq') * .5, 8.7 + k * .42, .22)
for k in range(40): add(noise(.03, .001, .01, .6), 8.8 + k * .09 + rng.uniform(0, .05), .05, rng.uniform(-.3, .3))   # little rain cloud
for k, f in enumerate([1318, 1175, 1047, 988, 880]): add(chime(f, .9), 11.0 + k * .28, .07, .3 - k * .12)   # butterfly drifts down
add(flutter(1.4, 8), 11.0, .1, .2)
add(tone(1568, 1568, .25, .002, .08), 12.4, .14)        # lands on the head
add(tone(700, 1400, .15, .003, .06), 12.45, .18)        # Clawd looks up
for k, f in enumerate([523, 659, 784, 1047]): add(chime(f, 1.6), 13.15 + k * .09, .13)   # love!
for k in range(3): add(tone(900 + k * 150, 1300 + k * 150, .1, .002, .04), 13.3 + k * .3, .1, .3)   # hearts pop
add(chime(523, 2.0) + chime(784, 2.0) * .6, 13.9, .1)   # iris closes
add(tone(262, 262, 1.0, .01, .3), 14.7, .12)            # final soft note

# --- mix, gentle limiter, write ---
st = np.stack([L, R], 1)
st = np.tanh(st * 1.4) / np.tanh(1.4)
fade = np.ones(N); fade[-int(.3 * SR):] = np.linspace(1, 0, int(.3 * SR)); st *= fade[:, None]
pcm = (st / max(1e-9, np.abs(st).max()) * .89 * 32767).astype('<i2')
with wave.open(__file__.rsplit('/', 1)[0] + '/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote sfx.wav')
