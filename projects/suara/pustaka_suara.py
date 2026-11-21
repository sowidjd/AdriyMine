"""Pustaka suara: buat banyak kalimat sekaligus dengan VoxCPM2, simpan, dan pakai ulang tanpa membuat ulang.

Pustaka ada di projects/karakter/aset/suara/ (repo privat sowidjd/Adriy-aset-karakter, ambil dengan
`bash projects/karakter/ambil_aset.sh`): <suara>/<id>.wav + katalog.json. id = 12 huruf sha1("<suara>|<teks dibaca>"),
sama dengan repo Aidriy, jadi kalimat yang persis sama (huruf & tanda baca) langsung dipakai.

Model hanya dimuat SEKALI per perintah, lalu semua kalimat yang belum ada dibuat berurutan.
Pasang VoxCPM2 sekali per sesi (tanpa GPU, versi CPU):
  python3 -m venv .venv-tts
  .venv-tts/bin/pip install torch torchaudio torchcodec --index-url https://download.pytorch.org/whl/cpu
  .venv-tts/bin/pip install voxcpm==2.0.3 soundfile


  PY=.venv-tts/bin/python
  $PY projects/suara/pustaka_suara.py naskah naskah.txt hasil/         # semua kalimat naskah -> hasil/01.wav ... + narasi.wav
  $PY projects/suara/pustaka_suara.py tambah "Kalimat satu." "Kalimat dua." [--suara adriy ongky] [--catatan "nada pelan"]
  $PY projects/suara/pustaka_suara.py tambah --file daftar.txt       # satu kalimat per baris, isi stok pustaka
  $PY projects/suara/pustaka_suara.py buat "Satu kalimat." hasil.wav  # satu kalimat (diambil dari pustaka bila ada)
  python3 projects/suara/pustaka_suara.py cari "bawang"               # cari kalimat (tanpa model)
  python3 projects/suara/pustaka_suara.py daftar --fungsi "ajakan"    # daftar per fungsi alur cerita
  python3 projects/suara/pustaka_suara.py ringkas                     # jumlah kalimat per suara & fungsi
  python3 projects/suara/pustaka_suara.py profil                     # daftar profil suara (adriy, ongky, ...)
  $PY projects/suara/pustaka_suara.py profil adriy rekaman.wav "teks persis"  # ganti dengan rekaman asli
  python3 projects/suara/pustaka_suara.py kirim                       # commit & push kalimat baru ke repo aset privat

Format naskah: satu kalimat atau lebih per baris. Baris kosong = jeda panjang, baris diawali # dilewati,
penanda [jeda] / [pelan] / [nada naik] dibuang dari teks yang dibacakan. Teks di layar tetap pakai naskah asli;
yang dibacakan diubah lewat kamus pelafalan (projects/suara/pelafalan.py + kamus-pelafalan.json).
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
os.environ.setdefault("TQDM_DISABLE", "1")  # sembunyikan progress bar VoxCPM
from pelafalan import lafal  # noqa: E402

ASET = HERE.parent / "karakter" / "aset"
LIB = ASET / "suara"
KATALOG = LIB / "katalog.json"
PROFIL = LIB / "profil"  # profil/<suara>/prompt.wav + prompt.txt (+ reference.wav): suara yang ditiru
# Klip prompt per suara (id di katalog): suara baru ditiru dari klip ini + teksnya.
PROMPT_BAWAAN = {"adriy": "44acec416ad1", "ongky": "64295c8936f6"}  # cadangan bila profil tidak ada
JEDA_KALIMAT, JEDA_BARIS, JEDA_PARAGRAF = 0.25, 0.45, 0.9  # detik, untuk narasi.wav

# Fungsi kalimat dalam alur cerita (sama dengan repo Aidriy). Urutan = prioritas; 1-2 fungsi per kalimat.
FUNGSI = [
    ("pengenalan akun", r"^(di|kami di) adriy\.? ?project\b"),
    ("cta", r"\bfollow\b|\bikuti\b|sampai (jumpa|ketemu)|terima kasih sudah (menonton|ikut)|explore more"),
    ("ajakan", r"komentar|\bbagikan\b|\bsimpan\b|\btag\b|\bshare\b|\blike\b|kirim video|tonton sekali lagi"),
    ("jeda dramatis", r"^(sebentar|tunggu( sebentar| dulu)?|titik|hening|eits, tunggu dulu)\.?$|\.\.\.$|^dan (saat itulah|tiba-tiba)|semuanya menjadi sunyi|tidak ada suara"),
    ("pertanyaan retoris", r"(, kan|, ya|, bukan|, sih)\?$|^bukankah|^siapa (yang )?(setuju|sangka)|^masa, sih\?"),
    ("memberikan analogi", r"\bbayangkan\b|\bseperti\b|\bmirip\b|analogi|\bibarat|\bmisalnya\b|\bcontoh(nya)?\b"),
    ("membantah asumsi", r"\bpadahal\b|\bmitos\b|\bkeliru\b|salah (kira|paham)|faktanya justru|sebaliknya|kita (selama ini )?mengira|anggapan|belum tentu"),
    ("mengungkap kejutan", r"\bternyata\b|siapa sangka|mengejutkan|\bkaget|nggak nyangka|di luar dugaan|\bwah\b|\bwow\b|astaga|ya ampun"),
    ("menjelaskan sebab-akibat", r"\bkarena\b|akibat(nya)?|sebab(nya)?|menyebabkan|\bfaktor\b|\balasan\b|memicu|sehingga|dampak"),
    ("menghubungkan dua topik", r"hubungan|berhubungan|terhubung|berkaitan|\bkembali ke\b|dibandingkan|sisi lain|selain itu|\blanjut\b"),
    ("menyampaikan kesimpulan", r"^jadi\b|kesimpulan|singkatnya|\bintinya\b|pada akhirnya|^itulah|dengan kata lain|begitulah"),
    ("mengawali cerita", r"bermula|berawal|dimulai|^suatu|^dulu\b|pada awalnya|hari itu|^ada (satu|sesuatu)"),
    ("memperkenalkan fakta", r"penelitian|\bdata\b|ilmuwan|para ahli|\bmenurut\b|\bistilah\b|disebut|dikenal|persen|\bfakta\b|ditemukan"),
    ("memancing rasa penasaran", r"\?$|^pernah|penasaran|rahasia|jarang (dibahas|disadari|diketahui)|misteri|tunggu dulu"),
    ("mengubah suasana", r"\bsantai\b|\btenang\b|plot twist|ngaku|bercanda|lumayan|asyik|nggak sendirian"),
]


def fungsi_kalimat(teks):
    t, hasil = teks.strip().lower(), []
    for nama, pola in FUNGSI:
        if re.search(pola, t):
            hasil.append(nama)
            if nama in ("pengenalan akun", "cta", "ajakan") or len(hasil) == 2:
                break
    return hasil or ["memperkenalkan fakta"]


# ---------- katalog ----------

def kid(suara, teks):
    return hashlib.sha1(f"{suara}|{lafal(teks)}".encode()).hexdigest()[:12]


def baca_katalog():
    if not KATALOG.exists():
        sys.exit(f"Pustaka suara belum ada: {KATALOG}\nJalankan dulu: bash projects/karakter/ambil_aset.sh")
    return json.loads(KATALOG.read_text(encoding="utf-8"))


def tulis_katalog(k):
    KATALOG.write_text(json.dumps(k, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def cari_file(k, suara, teks):
    """File pustaka untuk kalimat ini: cocok id (teks dibaca sama) atau teks persis sama."""
    i = kid(suara, teks)
    f = LIB / suara / f"{i}.wav"
    if f.exists():
        return f
    for e in k["kalimat"]:
        if e["suara"] == suara and e["teks"].strip() == teks.strip() and (ASET / e["file"]).exists():
            return ASET / e["file"]
    return None


def durasi(p):
    import soundfile as sf
    info = sf.info(str(p))
    return round(info.frames / info.samplerate, 2)


# ---------- model ----------

class Pembuat:
    """Memuat VoxCPM2 sekali, lalu membuat banyak kalimat."""

    def __init__(self, k):
        self.k, self.model, self.prompt = k, None, {}

    def _muat(self):
        if self.model is None:
            try:
                from voxcpm import VoxCPM
            except ImportError:
                sys.exit("VoxCPM2 belum terpasang di Python ini. Pakai .venv-tts/bin/python (cara pasang di awal file ini).")
            t0 = time.time()
            self.model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
            print(f"model dimuat {time.time() - t0:.0f} dtk", flush=True)
        return self.model

    def _prompt(self, suara):
        if suara not in self.prompt:
            d = PROFIL / suara
            if (d / "prompt.wav").exists() and (d / "prompt.txt").exists():
                ref = d / "reference.wav"
                self.prompt[suara] = dict(prompt_wav_path=str(d / "prompt.wav"),
                                          prompt_text=(d / "prompt.txt").read_text(encoding="utf-8").strip(),
                                          reference_wav_path=str(ref if ref.exists() else d / "prompt.wav"))
                print(f"profil suara: {suara}", flush=True)
            else:  # belum ada profil: pakai satu klip pustaka
                cocok = [e for e in self.k["kalimat"] if e["suara"] == suara and 6 <= (e.get("durasi") or 0) <= 10]
                if not cocok:
                    sys.exit(f"Suara '{suara}' belum punya profil. Buat dulu: pustaka_suara.py profil {suara} rekaman.wav \"teks persis\"")
                e = next((e for e in cocok if e["id"] == PROMPT_BAWAAN.get(suara)), None) or max(cocok, key=lambda e: e["durasi"])
                f = str(ASET / e["file"])
                self.prompt[suara] = dict(prompt_wav_path=f, prompt_text=e["teks"], reference_wav_path=f)
        return self.prompt[suara]

    def buat(self, suara, teks, catatan="", sumber=""):
        """Buat satu kalimat, simpan ke pustaka, kembalikan path file."""
        import soundfile as sf
        m = self._muat()
        t0 = time.time()
        wav = m.generate(text=lafal(teks), cfg_value=2.0, inference_timesteps=10, **self._prompt(suara))
        i = kid(suara, teks)
        dst = LIB / suara / f"{i}.wav"
        dst.parent.mkdir(parents=True, exist_ok=True)
        sf.write(dst, wav, m.tts_model.sample_rate)
        self.k["kalimat"].append({"id": i, "suara": suara, "teks": teks, "dibaca": lafal(teks), "fungsi": fungsi_kalimat(teks),
                                  "file": f"suara/{suara}/{i}.wav", "durasi": durasi(dst), "kategori": "", "catatan": catatan,
                                  "sumber": sumber or "AdriyMine", "dibuat": time.strftime("%Y-%m-%d")})
        tulis_katalog(self.k)  # simpan tiap kalimat: kalau berhenti di tengah, yang sudah jadi tidak hilang
        print(f"  + [{suara}] {durasi(dst):4.1f}s ({time.time() - t0:.0f} dtk)  {teks[:70]}", flush=True)
        return dst

    def pastikan(self, suara, teks, **kw):
        f = cari_file(self.k, suara, teks)
        if f:
            return f, False
        return self.buat(suara, teks, **kw), True


# ---------- naskah ----------

def pecah_naskah(path, k=None, suara="adriy"):
    """Kalimat dari naskah: daftar (teks, jeda_sesudah). Baris yang sudah ada utuh di pustaka tidak dipecah."""
    out = []
    for baris in Path(path).read_text(encoding="utf-8").splitlines():
        b = re.sub(r"\[[^\]]*\]", " ", baris).strip()
        if b.startswith("#"):
            continue
        if not b:
            if out:
                out[-1] = (out[-1][0], JEDA_PARAGRAF)
            continue
        b = re.sub(r"\s+", " ", b)
        if k is not None and cari_file(k, suara, b):
            kal = [b]
        else:
            kal = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", b) if s.strip()]
        out += [(s, JEDA_KALIMAT) for s in kal]
        if out:
            out[-1] = (out[-1][0], JEDA_BARIS)
    return out


def gabung(files, jeda, tujuan):
    import numpy as np
    import soundfile as sf
    bagian, sr = [], None
    for f, j in zip(files, jeda):
        d, r = sf.read(str(f), dtype="float32")
        if d.ndim > 1:
            d = d.mean(axis=1)
        if sr and r != sr:
            sys.exit(f"Sample rate beda: {f}")
        sr = r
        bagian += [d, np.zeros(int(j * sr), dtype="float32")]
    sf.write(str(tujuan), np.concatenate(bagian), sr)


def cmd_naskah(a):
    k = baca_katalog()
    kal = pecah_naskah(a.naskah, k, a.suara)
    if not kal:
        sys.exit("Naskah kosong.")
    out = Path(a.keluaran)
    out.mkdir(parents=True, exist_ok=True)
    p, files, baru, t0 = Pembuat(k), [], 0, time.time()
    ada = sum(cari_file(k, a.suara, t) is not None for t, _ in kal)
    print(f"{len(kal)} kalimat: {ada} sudah ada di pustaka, {len(kal) - ada} dibuat baru")
    daftar = []
    for n, (t, j) in enumerate(kal, 1):
        f, dibuat = p.pastikan(a.suara, t, sumber=f"naskah:{Path(a.naskah).name}")
        baru += dibuat
        dst = out / f"{n:02d}.wav"
        shutil.copy2(f, dst)
        files.append(dst)
        daftar.append({"no": n, "file": dst.name, "teks": t, "durasi": durasi(dst), "jeda_sesudah": j, "pustaka": not dibuat})
    gabung(files, [d["jeda_sesudah"] for d in daftar], out / "narasi.wav")
    (out / "daftar.json").write_text(json.dumps(daftar, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"selesai {time.time() - t0:.0f} dtk: {len(kal) - baru} dipakai ulang (♻), {baru} baru, "
          f"narasi.wav {durasi(out / 'narasi.wav'):.1f} dtk -> {out}")
    if baru:
        print("Kalimat baru sudah masuk pustaka. Kirim ke repo aset: python3 projects/suara/pustaka_suara.py kirim")


def cmd_tambah(a):
    k = baca_katalog()
    kal = list(a.kalimat)
    if a.file:
        kal += [b.strip() for b in Path(a.file).read_text(encoding="utf-8").splitlines() if b.strip() and not b.startswith("#")]  # satu baris = satu kalimat
    if not kal:
        sys.exit("Tidak ada kalimat.")
    p, baru, t0 = Pembuat(k), 0, time.time()
    for t in kal:
        for s in a.suara:
            _, dibuat = p.pastikan(s, t, catatan=a.catatan, sumber="pustaka_suara.py tambah")
            baru += dibuat
    print(f"{baru} baru, {len(kal) * len(a.suara) - baru} sudah ada ({time.time() - t0:.0f} dtk)")


def cmd_buat(a):
    k = baca_katalog()
    f, dibuat = Pembuat(k).pastikan(a.suara, a.teks)
    shutil.copy2(f, a.keluaran)
    print(("dibuat baru" if dibuat else "♻ diambil dari pustaka") + f": {a.keluaran}")


def cmd_cari(a):
    q = a.kata.lower()
    for e in baca_katalog()["kalimat"]:
        if q in e["teks"].lower() and (not a.suara or e["suara"] == a.suara):
            print(f"{e['suara']:6s} {e.get('durasi') or 0:5.1f}s  {e['teks']}")


def cmd_daftar(a):
    for e in baca_katalog()["kalimat"]:
        if (not a.suara or e["suara"] == a.suara) and (not a.fungsi or a.fungsi in e.get("fungsi", [])):
            print(f"{e['suara']:6s} {e.get('durasi') or 0:5.1f}s {', '.join(e.get('fungsi', [])):38s} {e['teks'][:80]}")


def cmd_ringkas(a):
    from collections import Counter
    k = baca_katalog()["kalimat"]
    for s, n in Counter(e["suara"] for e in k).items():
        menit = sum(e.get("durasi") or 0 for e in k if e["suara"] == s) / 60
        print(f"{s}: {n} kalimat, {menit:.0f} menit")
    c = Counter(f for e in k if e["suara"] == "adriy" for f in e.get("fungsi", []))
    print("\nFungsi (suara adriy):")
    for nama, _ in FUNGSI:
        print(f"{c.get(nama, 0):5d}  {nama}")


def cmd_kirim(a):
    git = ["git", "-C", str(ASET)]
    subprocess.run(git + ["add", "suara"], check=True)
    if subprocess.run(git + ["diff", "--cached", "--quiet"]).returncode == 0:
        print("Tidak ada kalimat baru.")
        return
    n = subprocess.run(git + ["diff", "--cached", "--name-only", "--", "suara/*/*.wav"], capture_output=True, text=True).stdout.split()
    subprocess.run(git + ["commit", "-qm", f"Pustaka suara: {len(n)} kalimat baru"], check=True)
    cabang = subprocess.run(git + ["rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True).stdout.strip()
    if cabang == "HEAD":  # ambil_aset.sh membuat checkout tanpa cabang
        cabang = a.cabang
    subprocess.run(git + ["push", "origin", f"HEAD:{cabang}"], check=True)
    print(f"{len(n)} kalimat baru dikirim ke repo aset ({cabang}).")


def cmd_profil(a):
    """Tampilkan profil, atau buat/ganti profil dari rekaman (5-15 dtk untuk prompt; sisanya jadi reference)."""
    if not a.nama:
        for d in sorted(PROFIL.glob("*/")):
            info = json.loads((d / "info.json").read_text(encoding="utf-8")) if (d / "info.json").exists() else {}
            n = sum(e["suara"] == d.name for e in baca_katalog()["kalimat"])
            print(f"{d.name:8s} {info.get('jenis', '?'):30s} {n:5d} kalimat di pustaka")
        return
    if not (a.rekaman and a.teks):
        sys.exit("Pakai: pustaka_suara.py profil NAMA rekaman.wav \"teks persis dari 5-15 detik pertama rekaman\"")
    import numpy as np
    import soundfile as sf
    w, sr = sf.read(a.rekaman, dtype="float32", always_2d=True)
    w = w.mean(axis=1)
    w = w / (np.abs(w).max() + 1e-9) * 0.9  # samakan volume
    d = PROFIL / a.nama
    d.mkdir(parents=True, exist_ok=True)
    m = int(a.mulai * sr)
    sf.write(d / "prompt.wav", w[m: m + int(a.potong * sr)], sr)
    sf.write(d / "reference.wav", w[: int(a.acuan * sr)], sr)
    (d / "prompt.txt").write_text(a.teks.strip() + "\n", encoding="utf-8")
    (d / "info.json").write_text(json.dumps({"nama": a.nama, "jenis": "rekaman asli", "sumber": Path(a.rekaman).name, "prompt_detik": [a.mulai, a.mulai + a.potong],
                                             "dibuat": time.strftime("%Y-%m-%d")}, ensure_ascii=False, indent=1) + "\n")
    print(f"profil '{a.nama}' disimpan (rekaman {len(w) / sr:.1f} dtk, prompt detik {a.mulai:g}-{a.mulai + a.potong:g}). Teks prompt harus persis isi potongan itu.")
    print("Kalimat lama di pustaka tetap dipakai; kalimat baru memakai profil ini. Jangan lupa: pustaka_suara.py kirim")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("naskah", help="semua kalimat naskah sekaligus + narasi.wav")
    s.add_argument("naskah"), s.add_argument("keluaran"), s.add_argument("--suara", default="adriy")
    s = sub.add_parser("tambah", help="isi stok pustaka")
    s.add_argument("kalimat", nargs="*"), s.add_argument("--file"), s.add_argument("--suara", nargs="+", default=["adriy"])
    s.add_argument("--catatan", default="")
    s = sub.add_parser("buat", help="satu kalimat ke satu file")
    s.add_argument("teks"), s.add_argument("keluaran"), s.add_argument("--suara", default="adriy")
    s = sub.add_parser("cari")
    s.add_argument("kata"), s.add_argument("--suara")
    s = sub.add_parser("daftar")
    s.add_argument("--suara"), s.add_argument("--fungsi")
    sub.add_parser("ringkas")
    s = sub.add_parser("profil", help="lihat / buat profil suara")
    s.add_argument("nama", nargs="?"), s.add_argument("rekaman", nargs="?"), s.add_argument("teks", nargs="?")
    s.add_argument("--mulai", type=float, default=0, help="detik awal potongan prompt")
    s.add_argument("--potong", type=float, default=15, help="panjang potongan prompt dalam detik (teks harus sama persis)")
    s.add_argument("--acuan", type=float, default=30, help="detik pertama rekaman untuk warna suara (reference)")
    s = sub.add_parser("kirim", help="commit & push pustaka ke repo aset privat")
    s.add_argument("--cabang", default="ccr-a6f601eb-m17nbt")
    a = ap.parse_args()
    {"naskah": cmd_naskah, "tambah": cmd_tambah, "buat": cmd_buat, "cari": cmd_cari, "daftar": cmd_daftar,
     "ringkas": cmd_ringkas, "kirim": cmd_kirim, "profil": cmd_profil}[a.cmd](a)


if __name__ == "__main__":
    main()
