"""Cari SFX dari SEMUA sumber sekaligus, diurutkan dari yang paling layak dipakai.

  python3 projects/sfx/cari.py whoosh                 kata Indonesia/Inggris (boleh beberapa)
  python3 projects/sfx/cari.py ting benar --pendek    hanya < 1,5 detik
  python3 projects/sfx/cari.py -k transisi            semua di satu kategori
  python3 projects/sfx/cari.py hujan --loop           untuk latar (yang panjang / loop)
  python3 projects/sfx/cari.py klik --tanpa-kredit    buang yang wajib kredit (CC BY)
  python3 projects/sfx/cari.py --kategori             daftar kategori
  opsi lain: -n 30 (jumlah hasil), --orang (ikutkan suara orang), --semua (ikutkan Mixkit & yang sensitif), --json

Urutan: cocok kata terbanyak → prioritas sumber (1 milik sendiri, 2 sfx-kit, 3 bebas CC0/PD, 4 bebas CC BY, 5 Mixkit).
"""
import json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
K = json.load(open(os.path.join(D, 'katalog.json')))
a = sys.argv[1:]
def opsi(nama, nilai=False):
    if nama not in a: return None
    i = a.index(nama); a.pop(i)
    return a.pop(i) if nilai else True

if opsi('--kategori'):
    import collections
    c = collections.Counter(k for e in K['sfx'] for k in e['kategori'])
    for k, ket in list(K['kategori'].items()) + [('lain', 'belum terkategori')]:
        print(f'{k:15} {c[k]:5}  {ket}')
    sys.exit()
kat = opsi('-k', True); n = int(opsi('-n', True) or 15)
pendek, loop, bebas_kredit = opsi('--pendek'), opsi('--loop'), opsi('--tanpa-kredit')
orang, semua, keluar_json = opsi('--orang'), opsi('--semua'), opsi('--json')
kata = [w.lower() for w in a]

hasil = []
for e in K['sfx']:
    if not semua and (not e['tersedia'] or e.get('sensitif')): continue
    if not orang and not semua and 'suara-orang' in e['kategori'] and kat != 'suara-orang': continue
    if kat and kat not in e['kategori']: continue
    if bebas_kredit and e['kredit_wajib']: continue
    d = e.get('durasi_s') or 0
    if pendek and d >= 1.5: continue
    if loop and not (e.get('loop') or 'suasana' in e['kategori'] or d >= 5): continue
    teks = ' '.join([e['id'], e['judul'], e.get('paket', ''), e['cocok_untuk'], ' '.join(e['kata_kunci']),
                     ' '.join(e['kategori']), e.get('kategori_asli', '')]).lower().replace('-', ' ').replace('_', ' ')
    skor = sum(w in teks for w in kata)
    if kata and skor == 0: continue
    hasil.append((-skor, e['prioritas'], d, e))
hasil.sort(key=lambda x: x[:3])
if kata:  # utamakan yang cocok semua kata
    penuh = [h for h in hasil if -h[0] == len(kata)]
    hasil = penuh or hasil
total = len(hasil); hasil = [h[3] for h in hasil[:n]]
if keluar_json:
    print(json.dumps(hasil, ensure_ascii=False, indent=1)); sys.exit()
for e in hasil:
    tanda = ' ⚠kredit' if e['kredit_wajib'] else ''
    tanda += ' ✗tidak-ada-file' if not e['tersedia'] else ''
    tanda += ' ⚠sensitif' if e.get('sensitif') else ''
    print(f"{e['file']}\n   {e['sumber']} · {e.get('durasi_s')} s · {'/'.join(e['kategori'])}{tanda}")
    if e.get('sync_at') is not None:
        print(f"   taruh: mulai di (momen − {e['sync_at']} s); di bawah narasi turunkan {e.get('turun_di_narasi_db')} dB")
    if e['cocok_untuk']: print(f"   cocok: {e['cocok_untuk'][:110]}")
    if e['hindari']: print(f"   hindari: {e['hindari'][:110]}")
print(f'— {len(hasil)} dari {total} hasil', file=sys.stderr)
