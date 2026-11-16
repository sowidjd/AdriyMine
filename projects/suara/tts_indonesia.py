import torch, scipy.io.wavfile as wf, sys
from transformers import VitsModel, AutoTokenizer
m = VitsModel.from_pretrained("facebook/mms-tts-ind"); tok = AutoTokenizer.from_pretrained("facebook/mms-tts-ind")
text = sys.argv[1]
with torch.no_grad(): out = m(**tok(text.lower(), return_tensors="pt")).waveform[0].numpy()
wf.write(sys.argv[2], m.config.sampling_rate, out)
print("ok", len(out) / m.config.sampling_rate)
