import sys, time, soundfile as sf, torch
torch.set_num_threads(4)
from voxcpm import VoxCPM
t0 = time.time()
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
print("loaded", round(time.time() - t0), "s", flush=True)
t0 = time.time()
wav = model.generate(text=sys.argv[1], cfg_value=2.0, inference_timesteps=10)
sf.write(sys.argv[2], wav, model.tts_model.sample_rate)
print("gen", round(time.time() - t0), "s, audio", round(len(wav) / model.tts_model.sample_rate, 1), "s")
