"""
Server VoxCPM2 untuk AdriyTTS.

Menjalankan model VoxCPM2 (OpenBMB, Apache 2.0) di komputer Anda, lalu aplikasi AdriyTTS di HP
mengambil suara dari sini lewat Wi-Fi/internet.

Kebutuhan:
  - Python 3.10+, ffmpeg
  - pip install voxcpm
  - Disarankan GPU NVIDIA >= 8 GB (RTX 3060 12 GB / 4060 Ti 16 GB / T4 di Colab/Kaggle).
    Tanpa GPU tetap jalan, tetapi ±4x lebih lambat dari durasi audio.

Menjalankan:
  python voxcpm_server.py --port 8808 [--token RAHASIA]

Lalu di aplikasi: Atur > Mesin VoxCPM2 > isi alamat, misalnya http://192.168.1.10:8808

API:
  GET  /health                  -> {"ok": true, "voices": [...], "device": "cuda"}
  POST /tts  {"text": "...", "voice": "wanita"|"pria"}
       -> audio/mpeg (MP3 24 kHz mono 96 kbps, format yang sama dengan mesin utama aplikasi)
"""
import argparse
import io
import json
import os
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
import soundfile as sf

VOICES = {
    # Deskripsi "voice design": dipakai sekali untuk membuat rekaman acuan, lalu rekaman itu
    # dipakai untuk semua kalimat agar suara tetap sama dari awal sampai akhir.
    "wanita": "(Narator buku audio wanita, suara tenang dan bersih, rekaman studio)",
    "pria": "(Seorang pria Indonesia dewasa, suara dalam dan bersahabat, logat Indonesia baku, tempo tenang)",
}
REF_TEXT = {
    "wanita": "Selamat datang. Saya akan membacakan tulisan Anda dengan suara yang jelas dan tenang.",
    "pria": "Selamat datang. Saya akan membacakan tulisan Anda dengan suara yang jelas dan tenang.",
}


def to_mp3(wav: np.ndarray, sr: int) -> bytes:
    """Ubah ke MP3 MPEG-2 24 kHz mono 96 kbps (CBR) agar cocok dengan penggabung MP3 aplikasi."""
    buf = io.BytesIO()
    sf.write(buf, wav, sr, format="WAV", subtype="PCM_16")
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", "pipe:0", "-af", "loudnorm=I=-19:TP=-1.5:LRA=11",
         "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame",
         "-b:a", "96k", "-write_xing", "0", "-id3v2_version", "0", "-f", "mp3", "pipe:1"],
        input=buf.getvalue(), capture_output=True, check=True)
    return p.stdout


class Engine:
    def __init__(self, model_id: str, ref_dir: str, steps: int):
        from voxcpm import VoxCPM
        self.model = VoxCPM.from_pretrained(model_id, load_denoiser=False)
        self.sr = self.model.tts_model.sample_rate
        self.steps = steps
        self.lock = threading.Lock()
        self.refs = {}
        os.makedirs(ref_dir, exist_ok=True)
        bundled = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voices")
        for name, desc in VOICES.items():
            # Suara acuan terpilih (diukur paling natural dari beberapa kandidat) ikut dikirim bersama server.
            path = os.path.join(bundled, f"{name}.wav")
            if not os.path.exists(path):
                path = os.path.join(ref_dir, f"ref_{name}.wav")
            if not os.path.exists(path):
                print(f"[server] membuat suara acuan '{name}'…", flush=True)
                wav = self.model.generate(text=desc + REF_TEXT[name], cfg_value=2.0, inference_timesteps=steps)
                sf.write(path, wav, self.sr)
            self.refs[name] = path
        print("[server] siap.", flush=True)

    def tts(self, text: str, voice: str) -> bytes:
        ref = self.refs.get(voice, self.refs["wanita"])
        with self.lock:  # satu GPU: proses satu per satu
            wav = self.model.generate(
                text=text,
                prompt_wav_path=ref, prompt_text=REF_TEXT.get(voice, REF_TEXT["wanita"]),
                reference_wav_path=ref,
                cfg_value=2.0, inference_timesteps=self.steps,
            )
        return to_mp3(np.asarray(wav, dtype=np.float32), self.sr)


def make_handler(engine: Engine, token: str | None):
    class H(BaseHTTPRequestHandler):
        def _auth(self) -> bool:
            if not token:
                return True
            if self.headers.get("Authorization", "") == f"Bearer {token}":
                return True
            self._send(401, b'{"error":"token salah"}', "application/json")
            return False

        def _send(self, code, body: bytes, ctype: str):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path.rstrip("/") != "/health":
                return self._send(404, b"{}", "application/json")
            if not self._auth():
                return
            import torch
            info = {"ok": True, "model": "VoxCPM2", "voices": list(VOICES),
                    "device": "cuda" if torch.cuda.is_available() else "cpu"}
            self._send(200, json.dumps(info).encode(), "application/json")

        def do_POST(self):
            if self.path.rstrip("/") != "/tts":
                return self._send(404, b"{}", "application/json")
            if not self._auth():
                return
            try:
                n = int(self.headers.get("Content-Length", "0"))
                req = json.loads(self.rfile.read(n) or b"{}")
                text = str(req.get("text", "")).strip()
                if not text or len(text) > 2000:
                    return self._send(400, b'{"error":"teks kosong atau terlalu panjang"}', "application/json")
                t0 = time.time()
                mp3 = engine.tts(text, str(req.get("voice", "wanita")))
                print(f"[server] {len(text)} karakter -> {len(mp3)} byte dalam {time.time() - t0:.1f} dtk", flush=True)
                self._send(200, mp3, "audio/mpeg")
            except Exception as e:  # jangan matikan server karena satu permintaan
                self._send(500, json.dumps({"error": str(e)}).encode(), "application/json")

        def log_message(self, *a):
            pass

    return H


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="openbmb/VoxCPM2", help="ID Hugging Face atau folder model lokal")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8808)
    ap.add_argument("--token", default=None, help="opsional: kata sandi agar hanya aplikasi Anda yang bisa memakai")
    ap.add_argument("--steps", type=int, default=10, help="langkah difusi (10 = kualitas bawaan)")
    ap.add_argument("--ref-dir", default=os.path.join(tempfile.gettempdir(), "adriytts_voxcpm"))
    a = ap.parse_args()
    engine = Engine(a.model, a.ref_dir, a.steps)
    srv = ThreadingHTTPServer((a.host, a.port), make_handler(engine, a.token))
    print(f"[server] mendengarkan di http://{a.host}:{a.port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
