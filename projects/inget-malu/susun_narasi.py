"""Potong narasi ElevenLabs (narasi/bagian1.wav & bagian2.wav) per kalimat memakai waktu kata Whisper (narasi/kata.json),
lalu susun ulang dengan jeda dari naskah.json -> narasi.wav + timeline.json. Target durasi: argumen 1 (detik), default 169.
  python3 susun_narasi.py [169]"""
import json, re, sys, difflib, numpy as np, soundfile as sf, subprocess, os
TARGET = float(sys.argv[1]) if len(sys.argv) > 1 else 169.0
N = json.load(open('naskah.json')); K = json.load(open('narasi/kata.json')); SR = 44100
SAME = {'ingat': 'inget', 'kesel': 'kesal', 'seneng': 'senang', 'senengnya': 'senangnya', 'jaman': 'zaman', 'cat': 'chat', 'hilang': 'ngilang', 'temen': 'teman', 'smp': 'esempe'}
def nw(w): w = re.sub(r'[^a-z0-9]', '', w.lower()); return SAME.get(w, w)
def kata(s): return [nw(w) for w in re.sub(r'-', '', s).replace('5', 'lima').split() if nw(w)]
split = [i for i, l in enumerate(N['lines']) if l['id'] == 'q1'][0]      # bagian 2 dimulai di q1
bag = {'bagian1': N['lines'][:split], 'bagian2': N['lines'][split:]}
klip = {}
def padat(c, sr, maks=.14):   # jeda diam di dalam kalimat (> maks detik) dipendekkan jadi maks; kata tidak dipotong
    f = int(.01 * sr); e = np.sqrt(np.convolve(c ** 2, np.ones(f) / f, 'same')); th = max(e.max() * .03, 1e-4); diam = e < th
    out, i, n = [], 0, len(c)
    while i < n:
        if diam[i]:
            j = i
            while j < n and diam[j]: j += 1
            if j - i > maks * sr and i > 0 and j < n: h = int(maks * sr / 2); out.append(c[i:i + h]); out.append(c[j - h:j])
            else: out.append(c[i:j])
            i = j
        else:
            j = i
            while j < n and not diam[j]: j += 1
            out.append(c[i:j]); i = j
    return np.concatenate(out)
for b, lines in bag.items():
    a, sr = sf.read(f'narasi/{b}.wav'); a = a if a.ndim == 1 else a.mean(1)
    T = []
    for w in K[b]:                                          # gabungkan kata ulang yang dipecah Whisper: "Tiba" + "-tiba," -> "Tiba-tiba,"
        if T and w['w'].startswith('-'): T[-1] = {'w': T[-1]['w'] + w['w'], 't0': T[-1]['t0'], 't1': w['t1']}
        else: T.append(dict(w))
    tw = [nw(w['w'].replace('-', '')) or '_' for w in T]
    sw, own = [], []
    for li, l in enumerate(lines):
        for w in kata(l['text']): sw.append(w); own.append(li)
    sm = difflib.SequenceMatcher(None, sw, tw, autojunk=False); peta = {}
    for blk in sm.get_matching_blocks():
        for j in range(blk.size): peta[blk.a + j] = blk.b + j
    wkt = []
    for li, l in enumerate(lines):
        idx = [peta[i] for i, o in enumerate(own) if o == li and i in peta]
        if not idx: raise SystemExit('TIDAK KETEMU ' + l['id'])
        wkt.append((T[min(idx)]['t0'], T[max(idx)]['t1']))
    for li, l in enumerate(lines):          # batas: tidak boleh melewati titik tengah ke kalimat sebelah
        t0, t1 = wkt[li]; kiri = (wkt[li - 1][1] + t0) / 2 if li else 0; kanan = (t1 + wkt[li + 1][0]) / 2 if li + 1 < len(wkt) else len(a) / sr
        s0, s1 = max(kiri, t0 - .14), min(kanan, t1 + .18)
        c = a[int(s0 * sr):int(s1 * sr)].astype(np.float32)
        r = int(.012 * sr); c[:r] *= np.linspace(0, 1, r); c[-r:] *= np.linspace(1, 0, r)
        klip[l['id']] = padat(c, sr)
dur = sum(len(c) for c in klip.values()) / SR; gaps = sum(l['gap'] for l in N['lines'][:-1]); lead, ekor = N['lead'], 1.6
print('suara mentah', round(dur, 1), 'jeda total', round(gaps, 1)); tempo = 1.0; skala = (TARGET - lead - ekor - dur) / gaps
if skala < .45:                                    # jeda terlalu sempit: percepat suara sedikit (maks 1,1x, nada tetap; aturan §12)
    tempo = min(1.1, dur / (TARGET - lead - ekor - gaps * .6)); skala = .6
    for k, c in klip.items():
        sf.write('/tmp/_k.wav', c, SR); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/_k.wav', '-af', f'atempo={tempo:.4f}', '/tmp/_k2.wav'], check=True); klip[k], _ = sf.read('/tmp/_k2.wav')
    dur = sum(len(c) for c in klip.values()) / SR; skala = (TARGET - lead - ekor - dur) / gaps
out, t, L = [np.zeros(int(lead * SR))], lead, []
for l in N['lines']:
    c = klip[l['id']]; L.append({'id': l['id'], 't0': round(t, 3), 't1': round(t + len(c) / SR, 3), 'cap': l['cap']}); out.append(c); t += len(c) / SR
    if l is not N['lines'][-1]: g = l['gap'] * skala; out.append(np.zeros(int(g * SR))); t += g
out.append(np.zeros(int(ekor * SR))); w = np.concatenate(out); w = w / (np.abs(w).max() + 1e-9) * .95
sf.write('narasi.wav', np.stack([w, w], 1), SR)
json.dump({'duration': round(len(w) / SR, 3), 'lines': L}, open('timeline.json', 'w'), ensure_ascii=False, indent=0)
print(f'suara {dur:.1f} s, tempo {tempo:.3f}x, skala jeda {skala:.2f}, total {len(w) / SR:.2f} s')
