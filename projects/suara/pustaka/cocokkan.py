"""Cocokkan naskah video dengan pustaka suara (aturan.md §17), supaya kredit & waktu hemat.

  python3 projects/suara/pustaka/cocokkan.py projects/<video>            # laporan saja
  python3 projects/suara/pustaka/cocokkan.py projects/<video> --salin    # salin file pustaka ke <video>/narasi/
  python3 projects/suara/pustaka/cocokkan.py projects/<video> --suara amy
  python3 projects/suara/pustaka/cocokkan.py projects/<video> --simpan   # simpan kalimat baru (narasi/<id>.mp3) ke pustaka

Kalimat di naskah.json dianggap dari pustaka bila:
  - punya kunci "pustaka": "<id-frasa>" (pilihan langsung), atau
  - teksnya sama persis dengan teks pustaka (tanda [tag], huruf besar, dan tanda baca diabaikan).
Kalimat yang hanya MIRIP (>= 80%) ditampilkan sebagai saran: ubah teks naskah agar sama persis, atau biarkan.
"""
import json, os, re, sys, shutil, difflib

P = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if not args: raise SystemExit(__doc__)
V = os.path.abspath(args[0])
suara = sys.argv[sys.argv.index('--suara') + 1] if '--suara' in sys.argv else 'hasan'
if suara in args: args.remove(suara)

def norm(t):
    t = re.sub(r'\[[^\]]*\]', ' ', t).lower()
    return ' '.join(re.sub(r'[^0-9a-z\s-]', ' ', t).split())

idx_path = os.path.join(P, 'indeks.json')
idx = json.load(open(idx_path))
lib = {f['id']: f for f in idx['frasa'] if f['suara'] == suara}
by_text = {norm(f['teks']): f for f in lib.values()}
naskah = json.load(open(os.path.join(V, 'naskah.json')))
lines = [l for l in naskah['lines'] if not l.get('lewati')]
narasi = os.path.join(V, 'narasi'); os.makedirs(narasi, exist_ok=True)

if '--simpan' in sys.argv:
    baru = 0
    for l in lines:
        src = os.path.join(narasi, l['id'] + '.mp3')
        if l.get('pustaka') or norm(l['text']) in by_text or not os.path.exists(src): continue
        fid = 'v-' + os.path.basename(V) + '-' + l['id']
        dst = os.path.join(P, suara, fid + '.mp3'); shutil.copy(src, dst)
        idx['frasa'].append({'id': fid, 'suara': suara, 'teks': l['text'], 'session_id': None, 'generation_id': None,
                             'file': f'{suara}/{fid}.mp3', 'tahap': 'video:' + os.path.basename(V)})
        baru += 1
    json.dump(idx, open(idx_path, 'w'), ensure_ascii=False, indent=1)
    print(f'{baru} kalimat baru disimpan ke pustaka ({suara}).'); sys.exit()

pakai, mirip, buat = [], [], []
for l in lines:
    f = lib.get(l.get('pustaka', '')) or by_text.get(norm(l['text']))
    if f:
        pakai.append((l, f)); continue
    best = max(lib.values(), key=lambda x: difflib.SequenceMatcher(None, norm(l['text']), norm(x['teks'])).ratio())
    r = difflib.SequenceMatcher(None, norm(l['text']), norm(best['teks'])).ratio()
    (mirip if r >= .8 else buat).append((l, best, r))

hilang = []
for l, f in pakai:
    src = os.path.join(P, f['file'])
    if not os.path.exists(src): hilang.append(f['file']); continue
    if '--salin' in sys.argv: shutil.copy(src, os.path.join(narasi, l['id'] + '.mp3'))

kredit = sum(len(l['text']) + 12 for l, *_ in mirip + buat)  # ±1 kredit/karakter + tag emosi
n = len(lines)
print(f'Naskah: {n} kalimat | dari pustaka ({suara}): {len(pakai)} ({100 * len(pakai) // max(n, 1)}%) | perlu dibuat: {len(mirip) + len(buat)} (±{kredit} kredit)')
if hilang: print('PERINGATAN, file pustaka tidak ada di komputer ini:', ', '.join(hilang))
if mirip:
    print('\nMirip pustaka (ubah teks naskah agar sama persis supaya gratis):')
    for l, f, r in mirip: print(f"  {l['id']}: \"{l['text']}\"\n      -> {f['id']}: \"{re.sub(r'^\[[^\]]*\]\s*', '', f['teks'])}\" ({r:.0%})")
if buat:
    print('\nPerlu dibuat baru:')
    for l, *_ in buat: print(f"  {l['id']}: {l['text']}")
if '--salin' in sys.argv: print(f'\n{len(pakai) - len(hilang)} file pustaka disalin ke {narasi}/')
