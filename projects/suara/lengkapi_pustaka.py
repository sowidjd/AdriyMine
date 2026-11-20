"""Lengkapi pustaka suara: buat kalimat yang sudah ada di satu suara tapi belum ada di suara lain.

  .venv-tts/bin/python projects/suara/lengkapi_pustaka.py --cek                 # hanya hitung yang belum ada
  .venv-tts/bin/python projects/suara/lengkapi_pustaka.py [--suara adriy ongky hasan] [--kirim-tiap 25]

Kalimat umum (pengenalan akun, ajakan, CTA, jeda, retoris, kesimpulan, suasana) dibuat lebih dulu.
Bisa dihentikan dan dijalankan lagi kapan saja: yang sudah jadi tidak dibuat ulang.
"""
import argparse
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import pustaka_suara as ps  # noqa: E402

UMUM = ["pengenalan akun", "ajakan", "cta", "jeda dramatis", "pertanyaan retoris", "menyampaikan kesimpulan",
        "mengubah suasana", "menghubungkan dua topik"]


def belum_ada(k, suara_list):
    by = defaultdict(set)
    for e in k["kalimat"]:
        by[e["suara"]].add(e["teks"].strip())
    contoh = {}
    for e in k["kalimat"]:
        contoh.setdefault(e["teks"].strip(), e)
    prio = lambda t: (0 if set(contoh[t].get("fungsi", [])) & set(UMUM) else 1, contoh[t].get("durasi") or 0)
    return {s: sorted((t for t in contoh if t not in by[s]), key=prio) for s in suara_list}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--suara", nargs="+", default=None, help="default: semua profil")
    ap.add_argument("--cek", action="store_true")
    ap.add_argument("--kirim-tiap", type=int, default=25)
    a = ap.parse_args()
    suara = a.suara or sorted(d.name for d in ps.PROFIL.glob("*/"))
    k = ps.baca_katalog()
    todo = belum_ada(k, suara)
    for s in suara:
        print(f"{s}: {len(todo[s])} kalimat belum ada")
    if a.cek:
        return
    p, n, t0 = ps.Pembuat(k), 0, time.time()
    for s in suara:
        for t in todo[s]:
            if ps.cari_file(k, s, t):
                continue
            p.buat(s, t, sumber="lengkapi_pustaka.py")
            n += 1
            if n % a.kirim_tiap == 0:
                subprocess.run([sys.executable, str(HERE / "pustaka_suara.py"), "kirim"])
                print(f"-- {n} kalimat, {(time.time() - t0) / 60:.0f} menit", flush=True)
    if n:
        subprocess.run([sys.executable, str(HERE / "pustaka_suara.py"), "kirim"])
    print(f"selesai: {n} kalimat baru dalam {(time.time() - t0) / 60:.0f} menit")


if __name__ == "__main__":
    main()
