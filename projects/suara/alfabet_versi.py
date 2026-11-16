"""Buat beberapa versi alfabet A-Z lengkap untuk dipilih pendengar (nada dinilai telinga, ucapan dicek Whisper).
Tiap kelompok huruf dibuat dengan kalimat pengantar "Sekarang hurufnya: ..." (menjaga karakter suara),
lalu pengantarnya dipotong otomatis pakai cap waktu per kata dari Whisper.
  python3 alfabet_versi.py REF.wav [jumlah_versi=3]
Hasil: alfabet/versi<N>_<kelompok>.wav dan alfabet-versi<N>.wav (A-Z berurutan)."""
import sys, os, re
import numpy as np, soundfile as sf, librosa, torch
torch.set_num_threads(os.cpu_count())
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'alfabet'); os.makedirs(OUT, exist_ok=True)
REF = os.path.abspath(sys.argv[1]); NV = int(sys.argv[2]) if len(sys.argv) > 2 else 3
PENGANTAR = 'Sekarang hurufnya:'
KELOMPOK = [('ABC', 'A, Bé, Cé'), ('DEF', 'De, E, Ef'), ('GH', 'Gé, Ha'), ('IJ', 'I, Je'), ('KLM', 'Ka, El, Em'),
            ('NOP', 'En, O, Pé'), ('QRS', 'Ki, Er, Es'), ('TUV', 'Té, U, Ve'), ('WXYZ', 'We, Eks, Ye, Zet')]
from transformers import pipeline
asr = pipeline('automatic-speech-recognition', model='openai/whisper-medium', device='cpu')
def hear(w, sr):
    a = librosa.resample(np.asarray(w, np.float32), orig_sr=sr, target_sr=16000)
    return asr({'raw': a, 'sampling_rate': 16000}, return_timestamps='word', generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})
def ok(heard, grp):
    after = re.split(r'huruf\w*', heard.lower(), maxsplit=1)[-1]
    l = re.sub(r'[^a-z]', '', after)
    return l in (grp.lower(), grp.lower() + 'e') or l.replace('e', '') == grp.lower().replace('e', '')
from voxcpm import VoxCPM
m = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False); SR = m.tts_model.sample_rate
for v in range(1, NV + 1):
    parts = []
    for grp, text in KELOMPOK:
        f = os.path.join(OUT, f'versi{v}_{grp}.wav')
        if not os.path.exists(f):
            keep = None
            for attempt in range(4):
                w = m.generate(text=f'{PENGANTAR} {text}.', reference_wav_path=REF, cfg_value=2.0, inference_timesteps=10)
                o = hear(w, SR); cut = None
                for ch in o.get('chunks', []):
                    if 'huruf' in ch['text'].lower(): cut = ch['timestamp'][1]
                good = ok(o['text'], grp) and cut is not None
                print(f'  versi {v} {grp} coba {attempt + 1}: {o["text"].strip()} {"OK" if good else "ulang"}', flush=True)
                seg = w[int(cut * SR):] if cut else w
                if keep is None or good: keep = seg
                if good: break
            i = int(np.argmax(np.abs(keep) > np.abs(keep).max() * .05)); keep = keep[max(0, i - int(.03 * SR)):]
            sf.write(f, keep, SR)
        a, sr = sf.read(f); parts += [a / (np.abs(a).max() + 1e-9) * .9, np.zeros(int(.5 * sr))]
    sf.write(os.path.join(HERE, f'alfabet-versi{v}.wav'), np.concatenate(parts), SR)
    print(f'VERSI {v} SELESAI', flush=True)
