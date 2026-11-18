"""Efek suara buatan kode sendiri (milik Adriy.Project, bebas dipakai): python3 sfx_buatan.py -> _bersama/sfx/*.wav
- perut-kruk-panjang: perut keroncongan panjang (gemuruh rendah + gelembung yang naik-turun nadanya)
- perut-kruk-pendek: versi pendek
- perut-gemuruh-pelan: gemuruh pelan untuk latar adegan usus
- kertas-lepas: kertas tempel dicabut (kresek lengket pendek)
- kertas-sobek: halaman kertas sobek
- kertas-remas: kertas diremas jadi bola"""
import numpy as np, soundfile as sf, os
SR = 48000; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx'); rng = np.random.default_rng(7)
def lowpass(x, f):   # one-pole low-pass, applied twice
    a = np.exp(-2 * np.pi * f / SR); y = np.zeros_like(x)
    for _ in range(2):
        acc = 0.0; out = np.empty_like(x)
        for i, v in enumerate(x): acc = (1 - a) * v + a * acc; out[i] = acc
        x = out
    return x
def growl(dur, base=95, glide=(1.0, 1.6, .8), gurgles=6, seed=1):
    r = np.random.default_rng(seed); n = int(dur * SR); t = np.arange(n) / SR
    f = base * np.interp(t, np.linspace(0, dur, len(glide)), glide) * (1 + .04 * np.sin(2 * np.pi * 7 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + .5 * np.sin(2 * ph + .3) + .25 * np.sin(3 * ph + 1)
    am = .55 + .45 * np.abs(np.sin(2 * np.pi * (3 + 2 * r.random()) * t)) ** 1.5   # throaty flutter
    noise = lowpass(r.standard_normal(n).astype(np.float64), 260) * 3
    x = (tone * am * .6 + noise * .5)
    for _ in range(gurgles):   # small bubbling glides
        s = r.uniform(.05, dur - .25); d = r.uniform(.08, .2); i0 = int(s * SR); m = int(d * SR); tt = np.arange(m) / SR
        fb = r.uniform(160, 320); x[i0:i0 + m] += .45 * np.sin(2 * np.pi * (fb + 600 * tt) * tt) * np.sin(np.pi * tt / d) ** 2
    env = np.minimum(1, t / .08) * np.minimum(1, (dur - t) / .25) * (.7 + .3 * np.sin(np.pi * t / dur))
    x = x * env; return x / (np.abs(x).max() + 1e-9) * .89
os.makedirs(OUT, exist_ok=True)
sf.write(f'{OUT}/perut-kruk-panjang.wav', growl(2.0, 90, (1.0, 1.7, 1.2, .7), 8, 3), SR)
sf.write(f'{OUT}/perut-kruk-pendek.wav', growl(.9, 110, (1.2, .8), 3, 5), SR)
g = growl(4.0, 70, (1, 1.2, .9, 1.1), 10, 9); sf.write(f'{OUT}/perut-gemuruh-pelan.wav', g * .5, SR)
def crackle(dur, rate, hp=True, seed=1, shape=None):   # bursts of filtered noise clicks (paper sounds)
    r = np.random.default_rng(seed); n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    dens = rate * (shape(t / dur) if shape else np.ones(n))
    hits = r.random(n) < dens / SR
    for i in np.nonzero(hits)[0]:
        m = int(SR * r.uniform(.002, .012)); seg_ = r.standard_normal(min(m, n - i)) * np.exp(-np.arange(min(m, n - i)) / (m / 4)) * r.uniform(.3, 1); x[i:i + len(seg_)] += seg_
    x += r.standard_normal(n) * .05 * (shape(t / dur) if shape else 1)
    if hp: x = np.diff(x, prepend=0)
    x *= np.minimum(1, t / .01) * np.minimum(1, (dur - t) / .05); return x / (np.abs(x).max() + 1e-9) * .85
sf.write(f'{OUT}/kertas-lepas.wav', crackle(.45, 900, True, 11, lambda u: np.sin(np.pi * u) ** .7), SR)
sf.write(f'{OUT}/kertas-sobek.wav', crackle(.8, 2500, True, 12, lambda u: np.clip(u * 3, 0, 1) * (1 - u) ** .3), SR)
sf.write(f'{OUT}/kertas-remas.wav', crackle(1.0, 350, True, 13, lambda u: .4 + .6 * np.abs(np.sin(u * 9))), SR)
print('ok', os.listdir(OUT))
