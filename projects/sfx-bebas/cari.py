"""Cari SFX bebas pakai berdasarkan kata kunci (judul, paket, atau nama file).

  python3 projects/sfx-bebas/cari.py hujan
  python3 projects/sfx-bebas/cari.py klik --cc0      (hanya yang tidak perlu kredit)
"""
import json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
cc0 = '--cc0' in sys.argv
k = json.load(open(os.path.join(D, 'katalog.json')))
n = 0
for v in k['sfx']:
    teks = f"{v['judul']} {v.get('paket', '')} {v['file']}".lower()
    if all(a.lower() in teks for a in args) and (not cc0 or 'BY' not in v['lisensi']):
        n += 1
        kredit = '  ← perlu kredit' if 'BY' in v['lisensi'] else ''
        print(f"projects/sfx-bebas/{v['file']}  [{v['lisensi']}]{kredit}")
print(f'{n} file', file=sys.stderr)
