"""Putaran 2 pelatihan alfabet: nada stabil + pilihan ejaan untuk huruf yang salah menurut pendengar.
- Mode lanjutan: rekaman kelompok yang sudah bagus (patokan) + teksnya dipakai sebagai prompt, jadi nada & gaya mengeja sama.
- Tiap kandidat diukur nadanya per huruf (pYIN); ditolak bila ada huruf yang lari > 2 semitone dari nada patokan.
  python3 latih_alfabet2.py REF.wav
Hasil: alfabet/v2_<kelompok>_<n>.wav (beberapa pilihan per kelompok), laporan nada di layar."""
import sys, os, re, json
import numpy as np, soundfile as sf, librosa, torch
torch.set_num_threads(os.cpu_count())
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'alfabet')
ref = os.path.abspath(sys.argv[1])
PATOKAN = (os.path.join(OUT, 'grup3.wav'), 'Ka, El, Em, En, O.')   # K-O: lolos 5/5 pada percobaan pertama

def f0_segments(wav, sr):
    """Median nada (Hz) tiap potongan bersuara (= tiap huruf yang dieja)."""
    y = librosa.resample(np.asarray(wav, np.float32), orig_sr=sr, target_sr=16000)
    segs = librosa.effects.split(y, top_db=30, frame_length=1024, hop_length=256)
    out = []
    for a, b in segs:
        if b - a < 1600: continue
        f0, v, _ = librosa.pyin(y[a:b], fmin=70, fmax=350, sr=16000, frame_length=1024)
        f0 = f0[~np.isnan(f0)]
        if len(f0) > 3: out.append(float(np.median(f0)))
    return out

pw, psr = sf.read(PATOKAN[0])
base = float(np.median(f0_segments(pw, psr)))
print(f'nada patokan: {base:.0f} Hz', flush=True)
# prompt: patokan dipotong 8 detik maksimal (mode lanjutan meniru nada & tempo)
prompt = os.path.join(OUT, '_patokan.wav'); sf.write(prompt, pw[: int(8 * psr)], psr)

from transformers import pipeline
asr = pipeline('automatic-speech-recognition', model='openai/whisper-medium', device='cpu')
def hear(wav, sr):
    a = librosa.resample(np.asarray(wav, np.float32), orig_sr=sr, target_sr=16000)
    return asr({'raw': a, 'sampling_rate': 16000}, generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})['text'].strip()
from voxcpm import VoxCPM
model = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False); SR = model.tts_model.sample_rate

# kelompok -> ejaan yang dicoba (beberapa ejaan untuk I & J supaya pendengar bisa memilih)
TUGAS = {
    'IJ':  ['I, Je.', 'Ii, Jee.', 'Iy, Jé.', 'Ih, Jeh.', 'I, Dje.'],
    'UVW': ['U, Fe, We.', 'Uu, Vé, Weh.', 'U, Fé, Wé.'],
    'XYZ': ['Eks, Ye, Zet.', 'Éks, Yé, Zét.', 'Eks, Ié, Set.'],
}
laporan = {}
for nama, cands in TUGAS.items():
    hasil = []
    for c in cands:
        for _ in range(2):
            wav = model.generate(text=c, prompt_wav_path=prompt, prompt_text=PATOKAN[1], reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
            segs = f0_segments(wav, SR)
            dev = [12 * np.log2(f / base) for f in segs] if segs else [99]
            worst = float(max(abs(d) for d in dev)); heard = hear(wav, SR)
            hasil.append((worst, c, heard, wav, [round(d, 1) for d in dev]))
            print(f'  {nama} | {c} -> {heard} | selisih nada per huruf (semitone): {[round(d, 1) for d in dev]}', flush=True)
            if worst <= 2.0: break
    # simpan maksimal 3 pilihan terbaik (nada paling stabil), satu per ejaan
    hasil.sort(key=lambda r: r[0]); dipakai = []; n = 0
    for worst, c, heard, wav, dev in hasil:
        if c in [d[0] for d in dipakai]: continue
        n += 1; sf.write(os.path.join(OUT, f'v2_{nama}_{n}.wav'), wav, SR); dipakai.append((c, round(worst, 1), heard))
        if n == 3: break
    laporan[nama] = dipakai
    print(nama, 'pilihan:', dipakai, flush=True)
json.dump(laporan, open(os.path.join(HERE, 'alfabet_v2.json'), 'w'), ensure_ascii=False, indent=1)
print('SELESAI')
