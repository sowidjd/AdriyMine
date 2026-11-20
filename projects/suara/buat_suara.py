"""Buat suara narasi dengan VoxCPM2 (openbmb/VoxCPM2, Apache 2.0), meniru suara dari perpustakaan suara.

Pasang (sekali):
  python3 -m venv .venv-tts
  .venv-tts/bin/pip install torch torchaudio torchcodec --index-url https://download.pytorch.org/whl/cpu
  .venv-tts/bin/pip install voxcpm==2.0.3 soundfile
  bash projects/karakter/ambil_aset.sh        # perpustakaan suara -> projects/karakter/aset/suara/

Pakai:
  .venv-tts/bin/python projects/suara/buat_suara.py "Kalimat narasi." hasil.wav
  .venv-tts/bin/python projects/suara/buat_suara.py "Kalimat narasi." hasil.wav --suara ongky
  .venv-tts/bin/python projects/suara/buat_suara.py "Kalimat narasi." hasil.wav --referensi rekamanku.wav

Kalau teksnya persis sama dengan kalimat di perpustakaan, file lama langsung disalin (tidak dibuat ulang).
Tanpa --referensi, suara ditiru dari satu klip perpustakaan (6-10 detik) beserta teksnya sebagai prompt.
"""
import argparse, json, shutil, sys, time
from pathlib import Path

ASET = Path(__file__).resolve().parents[1] / "karakter" / "aset"
KATALOG = ASET / "suara" / "katalog.json"
# Klip prompt bawaan per suara (id di katalog). Ganti bila ada klip yang lebih mirip.
PROMPT_BAWAAN = {"adriy": "44acec416ad1"}


def muat_katalog():
    if not KATALOG.exists():
        sys.exit(f"Perpustakaan suara belum ada: {KATALOG}\nJalankan: bash projects/karakter/ambil_aset.sh")
    return json.loads(KATALOG.read_text(encoding="utf-8"))["kalimat"]


def pilih_prompt(kalimat, suara):
    cocok = [k for k in kalimat if k["suara"] == suara and 6 <= k.get("durasi", 0) <= 10]
    if not cocok:
        sys.exit(f"Tidak ada klip 6-10 detik untuk suara '{suara}'.")
    pilihan = next((k for k in cocok if k["id"] == PROMPT_BAWAAN.get(suara)), None)
    return pilihan or max(cocok, key=lambda k: k["durasi"])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("teks")
    p.add_argument("keluaran", help="file WAV hasil")
    p.add_argument("--suara", default="adriy", help="adriy (default) atau ongky")
    p.add_argument("--referensi", help="rekaman suara sendiri untuk ditiru (menggantikan klip perpustakaan)")
    p.add_argument("--teks-referensi", help="teks persis dari --referensi (membuat tiruan lebih mirip)")
    p.add_argument("--langkah", type=int, default=10, help="inference_timesteps (lebih besar = lebih halus, lebih lambat)")
    a = p.parse_args()

    kalimat = muat_katalog() if not a.referensi else []
    for k in kalimat:
        if k["suara"] == a.suara and k["teks"].strip() == a.teks.strip():
            shutil.copy(ASET / k["file"], a.keluaran)
            print(f"♻ diambil dari perpustakaan: {k['file']}")
            return

    if a.referensi:
        prompt_wav, prompt_text, ref = a.referensi, a.teks_referensi, a.referensi
        if not prompt_text:
            prompt_wav = None
    else:
        k = pilih_prompt(kalimat, a.suara)
        prompt_wav = ref = str(ASET / k["file"])
        prompt_text = k["teks"]
        print(f"prompt: {k['file']} ({k['durasi']} dtk)")

    import soundfile as sf, torch
    from voxcpm import VoxCPM
    torch.set_num_threads(max(1, torch.get_num_threads()))
    t0 = time.time()
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
    print(f"model dimuat {time.time() - t0:.0f} dtk", flush=True)
    t0 = time.time()
    wav = model.generate(text=a.teks, prompt_wav_path=prompt_wav, prompt_text=prompt_text,
                         reference_wav_path=ref, cfg_value=2.0, inference_timesteps=a.langkah)
    sr = model.tts_model.sample_rate
    sf.write(a.keluaran, wav, sr)
    print(f"selesai {time.time() - t0:.0f} dtk, audio {len(wav) / sr:.1f} dtk -> {a.keluaran}")


if __name__ == "__main__":
    main()
