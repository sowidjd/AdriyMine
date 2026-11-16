"""Ambil musik latar BEBAS HAK CIPTA (CC0) dari katalog repos/video-background-music.
334 lagu loop CC0 (Tallbeard Studios Music Loop Bundle) dengan label suasana, tempo, energi & kunci nada.
  python3 ambil_musik.py cari playful            # daftar lagu bersuasana "playful"
  python3 ambil_musik.py cari energetic --tempo fast --energy high
  python3 ambil_musik.py ambil <id>              # unduh ke projects/musik/cache/<file>
Suasana yang tersedia: romantic, energetic, groovy, playful, dreamy, happy, dark, uplifting, calm,
melancholic, epic, mysterious, ...  Semua lagu CC0-1.0 (dicek per lagu di manifest).
Catatan pemilik musik: jangan dijual ulang tanpa diubah & jangan untuk NFT / pelatihan AI. Untuk musik latar video: aman."""
import sys, os, json, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
MAN = os.path.join(HERE, '..', '..', 'repos', 'video-background-music', 'manifest.json')
CACHE = os.path.join(HERE, 'cache'); os.makedirs(CACHE, exist_ok=True)
m = json.load(open(MAN)); TRACKS = m['tracks']

def cari(mood=None, tempo=None, energy=None, loop=None):
    out = []
    for t in TRACKS:
        if t.get('license') != 'CC0-1.0': continue          # hanya CC0
        if mood and mood not in (t.get('moods') or [t.get('mood')]): continue
        if tempo and t.get('tempo') != tempo: continue
        if energy and t.get('energy') != energy: continue
        if loop is not None and bool(t.get('loopable')) != loop: continue
        out.append(t)
    return out

def ambil(track_id):
    t = next(x for x in TRACKS if x['id'] == track_id)
    assert t.get('license') == 'CC0-1.0', 'bukan CC0, tidak dipakai'
    f = os.path.join(CACHE, t['file'])
    if not os.path.exists(f):
        url = f"{m['releaseBaseUrl']}/{m['releaseTag']}/{t['file']}"
        urllib.request.urlretrieve(url, f)
    return f, t

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'cari':
        opt = dict(zip(a[2::2], a[3::2])) if len(a) > 2 else {}
        for t in cari(a[1] if len(a) > 1 else None, opt.get('--tempo'), opt.get('--energy')):
            print(f"{t['id']:70s} {t.get('bpm')}bpm {t.get('tempo'):6s} {t.get('energy'):6s} {t.get('durationS'):5.1f}s {','.join(t.get('moods') or [])}")
    elif a and a[0] == 'ambil':
        f, t = ambil(a[1]); print(f, '|', t['title'], '|', t['license'], '| sumber:', t['source'])
    else: print(__doc__)
