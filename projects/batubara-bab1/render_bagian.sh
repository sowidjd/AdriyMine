#!/bin/bash
# Render bertahap per 2000 frame ke out/bagian/NNN.mp4 (yang sudah ada dilewati), lalu gabung.
cd "$(dirname "$0")"; mkdir -p out/bagian
CH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
N=$(python3 -c "import json;print(json.load(open('src/timeline.json'))['durasi'])"); B=2000; K=${KONK:-3}
for ((a=0; a<N; a+=B)); do
  e=$((a+B-1)); [ $e -ge $N ] && e=$((N-1)); o=out/bagian/$(printf %05d $a).mp4
  [ -f $o ] && continue
  echo "render $a-$e $(date +%T)"
  npx remotion render src/index.ts Batubara $o.tmp.mp4 --frames=$a-$e --gl=swangle --browser-executable=$CH --concurrency=$K --muted --log=error && mv $o.tmp.mp4 $o
done
ls out/bagian/*.mp4 | grep -v tmp | sed 's/^/file /' | sed "s#file #file '$PWD/#;s#\$#'#" > out/daftar.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/daftar.txt -i public/narasi.wav -map 0:v -map 1:a -c:v libx264 -crf 20 -pix_fmt yuv420p -af loudnorm=I=-14:TP=-1.5 -c:a aac -b:a 160k -shortest -movflags +faststart out/batubara-bab1.mp4 && echo "SELESAI $(date +%T)"
