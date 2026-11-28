"""Cari SFX dari SEMUA sumber sekaligus, diurutkan dari yang paling layak dipakai.

  python3 projects/sfx/cari.py whoosh                 kata Indonesia/Inggris (boleh beberapa)
  python3 projects/sfx/cari.py ting benar --pendek    hanya < 1,5 detik
  python3 projects/sfx/cari.py -k transisi            semua di satu kategori
  python3 projects/sfx/cari.py hujan --loop           untuk latar (yang panjang / loop)
  python3 projects/sfx/cari.py klik --tanpa-kredit    buang yang wajib kredit (CC BY)
  python3 projects/sfx/cari.py --kategori             daftar kategori
  opsi lain: -n 30 (jumlah hasil, bawaan 8), --detail (keterangan lengkap), --orang (ikutkan suara orang), --semua (ikutkan Mixkit & yang sensitif), --json

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
kat = opsi('-k', True); n = int(opsi('-n', True) or 8); detail = opsi('--detail')
pendek, loop, bebas_kredit = opsi('--pendek'), opsi('--loop'), opsi('--tanpa-kredit')
orang, semua, keluar_json = opsi('--orang'), opsi('--semua'), opsi('--json')
kata = [w.lower() for w in a]

hasil = []
for e in K['sfx']:
    if e.get('dibuang'): continue
    if not semua and (not e['tersedia'] or e.get('sensitif')): continue
    if not orang and not semua and 'suara-orang' in e['kategori'] and kat != 'suara-orang': continue
    if kat and kat not in e['kategori']: continue
    if bebas_kredit and e['kredit_wajib']: continue
    d = e.get('durasi_s') or 0
    if pendek and d >= 1.5: continue
    if loop and not (e.get('loop') or 'suasana' in e['kategori'] or d >= 5): continue
    teks = ' '.join([e['id'], e['judul'], e.get('paket', ''), e['cocok_untuk'], ' '.join(e['kata_kunci']),
                     ' '.join(e['kategori']), e.get('kategori_asli', '')]).lower().replace('-', ' ').replace('_', ' ')
    jud = ' '.join([e['id'], e['judul'], ' '.join(e.get('kata_judul', []))]).lower().replace('-', ' ').replace('_', ' ')
    skor = sum(w in teks for w in kata)
    if kata and skor == 0: continue
    bonus = sum(w in jud for w in kata)
    hasil.append((-skor, -bonus, e['prioritas'], d, e))
hasil.sort(key=lambda x: x[:4])
if kata:  # utamakan yang cocok semua kata
    penuh = [h for h in hasil if -h[0] == len(kata)]
    hasil = penuh or hasil
hasil = [h[4] for h in hasil]
# gabungkan varian (door 1…31 → 1 baris) supaya hemat token
grup, urut = {}, []
for e in hasil:
    g = e.get('grup', e['id'])
    if g not in grup: grup[g] = []; urut.append(g)
    grup[g].append(e)
total = len(urut); urut = urut[:n]
SINGKAT = [('projects/sfx-saya/normal/', 'saya:'), ('repos/sfx-kit/sounds/', 'kit:'), ('projects/sfx-bebas/opengameart/', 'bebas:'),
           ('projects/sfx-bebas/soundbible/', 'sb:'), ('projects/_bersama/sfx/', 'bersama:')]
def pendek(f):
    for a_, b_ in SINGKAT:
        if f.startswith(a_): return b_ + f[len(a_):]
    return f
if keluar_json:
    print(json.dumps([grup[g][0] | {'varian': len(grup[g])} for g in urut], ensure_ascii=False, indent=1)); sys.exit()
if not detail:
    print('# saya:=projects/sfx-saya/normal/ kit:=repos/sfx-kit/sounds/ bebas:=projects/sfx-bebas/opengameart/ sb:=projects/sfx-bebas/soundbible/')
for g in urut:
    e = grup[g][0]; v = len(grup[g])
    tanda = ' ⚠kredit' if e['kredit_wajib'] else ''
    tanda += ' ✗tidak-ada-file' if not e['tersedia'] else ''
    tanda += ' ⚠sensitif' if e.get('sensitif') else ''
    if not detail:
        c = e['cocok_untuk'].split(';')[0][:45] if e['cocok_untuk'] else ''
        print(f"{pendek(e['file'])} {e.get('durasi_s') or 0:.1f}s {e['kategori'][0]}{tanda}" + (f" | {c}" if c else '') + (f" (+{v-1} varian)" if v > 1 else ''))
        continue
    print(f"{e['file']}\n   {e['sumber']} · {e.get('durasi_s')} s · {'/'.join(e['kategori'])}{tanda}" + (f" · {v} varian" if v > 1 else ''))
    if e.get('sync_at') is not None:
        print(f"   taruh: mulai di (momen − {e['sync_at']} s); di bawah narasi turunkan {e.get('turun_di_narasi_db')} dB")
    if e['cocok_untuk']: print(f"   cocok: {e['cocok_untuk'][:110]}")
    if e['hindari']: print(f"   hindari: {e['hindari'][:110]}")
print(f'— {len(urut)} dari {total} grup', file=sys.stderr)
