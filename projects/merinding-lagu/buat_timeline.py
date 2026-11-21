"""Buat src/timeline.json dari hasil/hasan/daftar.json (durasi & jeda tiap kalimat narasi)."""
import json, sys
src = sys.argv[1] if len(sys.argv) > 1 else "hasil/hasan/daftar.json"
d = json.load(open(src)); t = 0.0; out = []
for k in d:
    out.append({"no": k["no"], "teks": k["teks"], "mulai": round(t, 3), "durasi": k["durasi"]})
    t += k["durasi"] + k.get("jeda_sesudah", 0)
json.dump({"kalimat": out, "total": round(t, 3)}, open("src/timeline.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "kalimat,", round(t, 1), "detik")
