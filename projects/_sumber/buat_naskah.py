"""Ubah skrip pemilik (teks final, kata tidak diubah) jadi naskah.json: kalimat panjang dipecah di koma, angka ditulis kata, catatan [..] jadi arahan."""
import json, re, sys
STOP = set('yang dan di ke dari untuk dengan ini itu kamu kita aku bisa juga tidak sudah akan pada dalam saat atau jadi lebih sangat hanya bahkan karena namun tetapi tapi seperti sedang mereka para kalau jika'.split())
def kunci(t):
    w = [x.strip('.,!?:;"\'…').lower() for x in t.split()]
    w = [x for x in w if len(x) > 5 and x not in STOP and not x.isdigit()]
    return sorted(set(w), key=lambda x: -len(x))[:2]
def cap(t):
    k = kunci(t)
    if k:
        m = re.search(re.escape(k[0]), t, re.I)
        if m: t = t[:m.start()] + '*' + t[m.start():m.end()] + '*' + t[m.end():]
    return t
def bangun(d, judul, rows):
    L = []
    for r in rows:
        i, g, s, t = r[:4]; e = {'id': i, 'gap': g, 'style': s, 'text': t, 'cap': cap(t), 'kunci': kunci(t)}
        if 'Adriy.Project' in t: e['kunci'] = ['titik']
        if i == 'z': e['cap'] = ''; e['kunci'] = []
        L.append(e)
    json.dump({'judul': judul, 'lead': 0.3, 'lines': L}, open(f'{d}/naskah.json', 'w'), ensure_ascii=False, indent=1)
    w = sum(len(l['text'].split()) for l in L); print(d, len(L), 'baris', w, 'kata, perkiraan', round(w / 2.33 + sum(l['gap'] for l in L)), 'detik')
