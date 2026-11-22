"""Timeline: adegan (# S..) dan kalimat dari naskah.txt + hasil/daftar.json (atau perkiraan bila belum ada)."""
import json, re, os
FPS = 30; LEAD = 0.4
adegan, kal = [], []
for b in open('naskah.txt', encoding='utf-8'):
    b = b.strip()
    if b.startswith('# S'): adegan.append({'id': b[2:].split()[0], 'nama': b.split(None, 2)[2] if len(b.split()) > 2 else ''}); continue
    if not b: continue
    for s in [x for x in re.split(r'(?<=[.!?…])\s+', b) if x.strip()]:
        kal.append({'teks': s, 'adegan': len(adegan) - 1})
dur = None
if os.path.exists('hasil/daftar.json'):
    d = json.load(open('hasil/daftar.json'))
    if len(d) == len(kal): dur = [(e['durasi'], e['jeda_sesudah']) for e in d]
    else: print('!! jumlah kalimat beda', len(d), len(kal))
if dur is None: dur = [(len(k['teks'].split()) / 2.5, 0.45) for k in kal]
t = LEAD
for k, (du, je) in zip(kal, dur):
    k['a'] = round(t * FPS); k['b'] = round((t + du) * FPS); t += du + je
for i, s in enumerate(adegan):
    ks = [k for k in kal if k['adegan'] == i]
    s['a'] = ks[0]['a'] if i else 0; s['n'] = len(ks)
for i, s in enumerate(adegan):
    s['b'] = adegan[i + 1]['a'] if i + 1 < len(adegan) else round((t + 1.5) * FPS)
json.dump({'durasi': adegan[-1]['b'], 'adegan': adegan, 'kalimat': kal, 'perkiraan': not os.path.exists('hasil/daftar.json')}, open('src/timeline.json', 'w'), ensure_ascii=False, indent=0)
print(len(kal), 'kalimat', adegan[-1]['b'] / FPS, 'dtk', [(s['id'], s['n']) for s in adegan])
