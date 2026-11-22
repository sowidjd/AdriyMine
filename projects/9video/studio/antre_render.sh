#!/bin/bash
# Antrean render: tiap narasi Hasan yang sudah jadi → video + thumbnail (bisa dilanjutkan bila terputus)
cd "$(dirname "$0")"; BX=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out/jadi
while true; do
  sisa=0; kerja=0
  for f in ../[0-9][0-9]-*.txt; do
    nama=$(basename $f .txt); n=${nama:0:2}
    [ -f out/jadi/$nama.mp4 ] && [ -f out/jadi/$nama-thumbnail.png ] && continue
    sisa=$((sisa+1))
    [ -f ../hasil/$nama/narasi.wav ] && [ -f ../hasil/$nama/.terkirim ] || continue
    kerja=1; echo "RENDER $nama $(date +%H:%M)"
    python3 siapkan.py v$n | grep -v "^sfx:"
    python3 buat_root.py >/dev/null
    npx remotion render src/index.ts Video$n out/v$n-mentah.mp4 --browser-executable=$BX --concurrency=3 --log=error || { echo "GAGAL $nama"; continue; }
    ffmpeg -loglevel error -y -i out/v$n-mentah.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/jadi/$nama.mp4
    npx remotion still src/index.ts Thumb$n out/jadi/$nama-thumbnail.png --browser-executable=$BX --log=error
    rm -f out/v$n-mentah.mp4
    echo "SELESAI $nama $(date +%H:%M) $(ffprobe -v error -show_entries format=duration -of csv=p=0 out/jadi/$nama.mp4)"
  done
  [ $sisa -eq 0 ] && break
  [ $kerja -eq 0 ] && sleep 60
done
echo "SEMUA VIDEO SELESAI"
