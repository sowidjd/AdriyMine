"""Narasi untuk folder proyek mana pun: python3 narasi_proyek.py <folder> gen REF.wav [id,id] | python3 narasi_proyek.py <folder> mix
Narasi dari naskah.json dengan tiruan suara (VoxCPM2) + cek ucapan (Whisper) + jadwal waktu.
"Suara adalah jam": waktu tiap kalimat menentukan waktu adegan.
  python3 narasi_gen.py gen REF.wav [id,id]   -> narasi/<id>.wav  (maks. 3 percobaan, ambil skor ucapan terbaik)
  python3 narasi_gen.py mix                    -> narasi.wav + timeline.json (mulai/akhir tiap kalimat, dalam detik video)"""
import sys, os, json, re, subprocess
HERE = os.path.abspath(sys.argv.pop(1)); OUT = os.path.join(HERE, 'narasi'); os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from ucapan import siapkan
N = json.load(open(os.path.join(HERE, 'naskah.json')))
# skor ucapan (sama dengan cek_ucapan.py, disalin ringkas agar berdiri sendiri)
import difflib
NUM = {'0': 'nol', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat', '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'delapan', '9': 'sembilan', '10': 'sepuluh'}
SAME = {'klod': 'claude', 'snuz': 'snooze', 'wush': 'whoosh', 'woosh': 'whoosh', 'wuss': 'whoosh', 'hush': 'whoosh', 'wus': 'whoosh', 'bush': 'whoosh', 'frigtful': 'frightful', 'project': 'project', 'wkwk': 'wekwek', 'wek': 'wek'}
def norm(s):
    s = s.lower(); s = re.sub(r'\d+', lambda m: ' ' + NUM.get(m.group(), m.group()) + ' ', s); s = re.sub(r'[^a-z ]', ' ', s)
    return ' '.join(SAME.get(w, w) for w in s.split())
def score(t, h):
    return difflib.SequenceMatcher(None, norm(t).replace(' ', ''), norm(h).replace(' ', '')).ratio()

if sys.argv[1] == 'gen':
    import numpy as np, soundfile as sf, librosa, torch
    torch.set_num_threads(os.cpu_count())
    ref = os.path.abspath(sys.argv[2]); only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
    from transformers import pipeline
    asr = pipeline('automatic-speech-recognition', model='openai/whisper-medium', device='cpu')
    def hear(w, sr):
        a = librosa.resample(np.asarray(w, np.float32), orig_sr=sr, target_sr=16000)
        return asr({'raw': a, 'sampling_rate': 16000}, generate_kwargs={'language': 'indonesian', 'task': 'transcribe'})['text'].strip()
    from voxcpm import VoxCPM
    model = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False); SR = model.tts_model.sample_rate
    for L in N['lines']:
        f = os.path.join(OUT, f"{L['id']}.wav")
        if (only and L['id'] not in only) or (not only and os.path.exists(f)): continue
        spoken = siapkan(L['text']); best = (-1, None, '')
        for k in range(4):
            w = model.generate(text=f"({L['style']}){spoken}", reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
            h = hear(w, SR); miss = [k for k in L.get('kunci', []) if norm(k).replace(' ', '') not in norm(h).replace(' ', '')]; sc = -0.3 * len(miss) + max(score(spoken, h), score(L['text'].replace('Adriy.Project', 'Adri titik Project'), h), *(score(d, h) for d in L.get('dengar', [])))
            if sc > best[0]: best = (sc, w, h)
            if sc >= .86 and not miss: break
        sf.write(f, best[1], SR)
        print(f"{L['id']:4s} {best[0]:.2f} {'OK ' if best[0] >= .85 else 'CEK'} {len(best[1]) / SR:.1f}s | {best[2]}", flush=True)
else:
    import numpy as np, soundfile as sf
    # naskah.json boleh punya: "tempo" (mis. 1.1 = suara 10% lebih cepat, nada tetap), "skala_jeda" (mis. 0.6), dan per kalimat "lewati": true
    # (kalimat dibuang dari video karena batas durasi; tetap dicatat di timeline dengan panjang nol supaya adegan tidak rusak)
    SR = 44100; t = N['lead']; parts = []; tl = []; tempo = N.get('tempo', 1.0); sj = N.get('skala_jeda', 1.0)
    for L in N['lines']:
        if L.get('lewati'): tl.append({'id': L['id'], 't0': round(t, 3), 't1': round(t, 3), 'cap': ''}); continue
        f = os.path.join(OUT, f"{L['id']}.wav"); tmp = os.path.join(OUT, '_t.wav')
        af = 'silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse' + (f',atempo={tempo}' if tempo != 1.0 else '')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', af, '-ar', str(SR), '-ac', '1', tmp], check=True)
        a, _ = sf.read(tmp); d = len(a) / SR
        tl.append({'id': L['id'], 't0': round(t, 3), 't1': round(t + d, 3), 'cap': L['cap']}); parts.append((t, a)); t += d + L['gap'] * (sj if L['id'] != 'z' else 1)
    dur = t + 1.2
    mix = np.zeros(int(dur * SR))
    for t0, a in parts: i = int(t0 * SR); mix[i:i + len(a)] += a
    sf.write(os.path.join(HERE, 'narasi.wav'), mix / (np.abs(mix).max() + 1e-9) * .9, SR)
    json.dump({'duration': round(dur, 3), 'lines': tl}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
    print('durasi', round(dur, 1), 's')
