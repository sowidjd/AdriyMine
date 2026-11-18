# Hugging Face Space (SDK: Docker, hardware gratis "CPU basic") untuk server VoxCPM2 AdriyTTS.
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir voxcpm
WORKDIR /app
COPY voxcpm_server.py /app/
COPY voices /app/voices
ENV HF_HOME=/tmp/hf
EXPOSE 7860
# Isi Settings > Variables and secrets: TOKEN = kata sandi pilihan Anda (dipakai juga di aplikasi).
CMD ["sh", "-c", "python voxcpm_server.py --port 7860 --token \"$TOKEN\""]
