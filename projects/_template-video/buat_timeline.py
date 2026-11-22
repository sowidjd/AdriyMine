"""Buat src/timeline.json (waktu tiap kalimat narasi).
  python3 buat_timeline.py hasil/hasan/daftar.json   # dari narasi asli (pustaka_suara.py naskah)
  python3 buat_timeline.py --perkiraan                 # perkiraan dari naskah.txt (sebelum suara jadi)"""
import json, sys
if len(sys.argv) > 1 and sys.argv[1] == "--perkiraan":
    d = [{"no": i, "teks": l, "durasi": round(len(l.split()) / 2.5 + 0.6, 2), "jeda_sesudah": 0.45}
         for i, l in enumerate([x.strip() for x in open("naskah.txt") if x.strip()], 1)]
else:
    d = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "hasil/adriy/daftar.json"))
t, out = 0.0, []
for k in d:
    out.append({"no": k["no"], "teks": k["teks"], "mulai": round(t, 3), "durasi": k["durasi"]})
    t += k["durasi"] + k.get("jeda_sesudah", 0)
json.dump({"kalimat": out, "total": round(t, 3)}, open("src/timeline.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "kalimat,", round(t, 1), "detik")
