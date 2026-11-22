"""Siapkan aset satu video: python3 siapkan.py v01 [--perkiraan]
- timeline dari narasi Hasan (../hasil/NN-nama/daftar.json), dikelompokkan per baris naskah
- pose ADRIY (OUTFIT di data.tsx) → public/vNN/pose/ + src/vNN/pose.json (ukuran)
- benda katalog (nama="x" & benda: [...]) → public/benda/
- SFX ([k, g, "nama", v]) → public/vNN/sfx/nama.wav  (sfx-saya/normal → Mixkit → aset/sfx)
- musik (MUSIK_ID) → public/vNN/musik.ogg ; font → public/font/
"""
import json, os, re, shutil, subprocess, sys, glob, urllib.request

R = "/home/user/AdriyMine"
S = os.path.dirname(os.path.abspath(__file__))
v = sys.argv[1]
nn = v[1:]
naskah = glob.glob(f"{S}/../{nn}-*.txt")[0]
nama_naskah = os.path.basename(naskah)[:-4]
src = open(f"{S}/src/{v}/data.tsx").read()
pub = f"{S}/public/{v}"
os.makedirs(f"{pub}/pose", exist_ok=True); os.makedirs(f"{pub}/sfx", exist_ok=True); os.makedirs(f"{S}/public/benda", exist_ok=True)

# ── timeline ──
L = [l.strip() for l in open(naskah) if l.strip()]
daftar = f"{S}/../hasil/{nama_naskah}/daftar.json"
if os.path.exists(daftar) and "--perkiraan" not in sys.argv:
    d = json.load(open(daftar))
    shutil.copy(f"{S}/../hasil/{nama_naskah}/narasi.wav", f"{pub}/narasi.wav")
else:
    d = [{"no": i, "teks": l, "durasi": round(len(l.split()) / 2.4 + 0.6, 2), "jeda_sesudah": 0.45} for i, l in enumerate(L, 1)]
    if not os.path.exists(f"{pub}/narasi.wav"):
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "1", f"{pub}/narasi.wav"])
t, sub = 0.0, []
for k in d:
    sub.append({"no": k["no"], "teks": k["teks"], "mulai": round(t, 3), "durasi": k["durasi"]}); t += k["durasi"] + k.get("jeda_sesudah", 0)
kal, i = [], 0
norm = lambda s: re.sub(r"\s+", "", s)
for n, line in enumerate(L, 1):
    parts, acc = [], ""
    while i < len(sub) and len(norm(acc)) < len(norm(line)):
        parts.append(sub[i]); acc = (acc + " " + sub[i]["teks"]).strip(); i += 1
    assert norm(acc) == norm(line), (acc, line)
    kal.append({"no": n, "teks": line, "mulai": parts[0]["mulai"], "durasi": round(parts[-1]["mulai"] + parts[-1]["durasi"] - parts[0]["mulai"], 3)})
json.dump({"kalimat": kal, "total": round(t, 3), "sub": sub}, open(f"{S}/src/{v}/timeline.json", "w"), ensure_ascii=False, indent=1)
print(f"{v}: {len(kal)} baris, {len(sub)} kalimat, {t:.1f} detik")

# ── pose ──
outfit = re.search(r'OUTFIT\s*=\s*"([^"]+)"', src).group(1)
poses = sorted(set(re.findall(r'pose:\s*"([^"]+)"', src)))
from PIL import Image
dims = {}
for p in poses:
    f = f"{R}/projects/karakter/aset/{outfit}/pose/{p}.png"
    if not os.path.exists(f):
        print("POSE TIDAK ADA:", p); continue
    shutil.copy(f, f"{pub}/pose/{p}.png"); dims[p] = list(Image.open(f).size)
json.dump(dims, open(f"{S}/src/{v}/pose.json", "w"), indent=1)
print("pose:", len(dims))

# ── benda ──
kat = json.load(open(f"{R}/projects/karakter/aset/objek/katalog.json"))
semua = {x["nama"]: x for vv in kat.values() if isinstance(vv, list) for x in vv}
bend = set(re.findall(r'nama="([^"]+)"', src))
for m in re.findall(r"benda:\s*\[([^\]]*)\]", src):
    bend |= set(re.findall(r'"([^"]+)"', m))
for b in sorted(bend):
    if b not in semua:
        print("BENDA TIDAK ADA:", b); continue
    fs = f"{R}/projects/karakter/aset/" + semua[b]["file"].split("adri/", 1)[1]
    shutil.copy(fs, f"{S}/public/benda/{b}.png")
print("benda:", len(bend))

# ── sfx ──
mix = {x["nama"]: x for x in json.load(open(f"{R}/projects/sfx-saya/mixkit/katalog.json"))}
asetsfx = {os.path.splitext(os.path.basename(x["file"]))[0]: x for x in json.load(open(f"{R}/projects/karakter/aset/sfx/katalog.json"))["sfx"]}
for nama in sorted(set(re.findall(r'\[\s*\d+\s*,\s*-?[\d.]+\s*,\s*"([^"]+)"\s*,', src))):
    out = f"{pub}/sfx/{nama}.wav"
    if os.path.exists(out): continue
    asal = None
    if os.path.exists(f"{R}/projects/sfx-saya/normal/{nama}.wav"):
        asal = f"{R}/projects/sfx-saya/normal/{nama}.wav"
    elif nama in mix:
        idm = re.search(r"-(\d+)\.wav$", mix[nama]["file"]).group(1)
        asal = f"/tmp/mixkit-{idm}.mp3"
        if not os.path.exists(asal):
            urllib.request.urlretrieve(f"https://assets.mixkit.co/active_storage/sfx/{idm}/{idm}-preview.mp3", asal)
    elif nama in asetsfx:
        asal = f"{R}/projects/karakter/aset/" + asetsfx[nama]["file"]
    if not asal:
        print("SFX TIDAK ADA:", nama); continue
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", asal, "-af", "silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-18:TP=-2", "-ar", "48000", out])
    print("sfx:", nama, "←", os.path.basename(asal))

# ── musik ──
m = re.search(r'MUSIK_ID\s*=\s*"([^"]+)"', src)
if m and not os.path.exists(f"{pub}/musik.ogg"):
    f = subprocess.run(["python3", f"{R}/projects/musik/ambil_musik.py", "ambil", m.group(1)], capture_output=True, text=True).stdout.split("|")[0].strip()
    shutil.copy(f, f"{pub}/musik.ogg"); print("musik:", m.group(1))

# ── font ──
os.makedirs(f"{S}/public/font", exist_ok=True)
for fnt in set(re.findall(r'font(?:Judul|Isi):\s*"([^"]+)"', src)):
    if not os.path.exists(f"{S}/public/font/{fnt}.woff2"):
        fs = glob.glob(f"{S}/node_modules/@fontsource/{fnt}/files/{fnt}-latin-700-normal.woff2") or glob.glob(f"{S}/node_modules/@fontsource/{fnt}/files/{fnt}-latin-400-normal.woff2")
        shutil.copy(fs[0], f"{S}/public/font/{fnt}.woff2")
print("siap")
