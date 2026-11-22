#!/bin/bash
# Alur video Adriy Project dari template. Jalankan dari mana saja.
#   bash projects/_template-video/video.sh baru   <nama>              salin template ke projects/<nama>
#   bash projects/_template-video/video.sh suara  <nama> <suara>      buat narasi (adriy/hasan/mia/ongky) + timeline
#   bash projects/_template-video/video.sh musik  <nama> <id> [file]  ambil musik CC0 → public/<file> (default musik1.ogg)
#   bash projects/_template-video/video.sh aset   <nama> <outfit>     salin pose/benda/SFX/font yang dipakai di src/
#   bash projects/_template-video/video.sh cek    <nama>              8 gambar contoh → out/cek.png
#   bash projects/_template-video/video.sh render <nama>              render → out/<nama>.mp4 (volume disamakan untuk TikTok)
set -e
daftar() { (cd "$P" && python3 -c "import os,json;json.dump(sorted(os.listdir('public')),open('src/berkas.json','w'))"); }
R=/home/user/AdriyMine; T=$R/projects/_template-video; P=$R/projects/$2; A=$R/projects/karakter/aset
BX=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
case "$1" in
baru)
  [ -e "$P" ] && { echo "$P sudah ada"; exit 1; }
  mkdir -p "$P"; (cd $T && tar cf - --exclude=node_modules --exclude=public --exclude=out --exclude=hasil .) | (cd "$P" && tar xf -)
  sed -i "s/\"template-video\"/\"$2\"/" "$P/package.json"; mkdir -p "$P/public"
  (cd "$P" && npm install --no-audit --no-fund --silent && python3 buat_timeline.py --perkiraan)
  echo "Siap: isi $P/naskah.txt dan $P/src/Video.tsx";;
suara)
  cd $R && pkill -f jalan_pustaka.sh || true; pkill -f lengkapi_pustaka || true; pkill -f "pustaka_suara.py tambah" || true
  .venv-tts/bin/python projects/suara/pustaka_suara.py naskah "$P/naskah.txt" "$P/hasil/$3/" --suara "$3"
  python3 projects/suara/pustaka_suara.py kirim || true
  cp "$P/hasil/$3/narasi.wav" "$P/public/narasi.wav"; (cd "$P" && python3 buat_timeline.py "hasil/$3/daftar.json"); daftar
  nohup setsid bash projects/suara/jalan_pustaka.sh >> /tmp/claude-0/-home-user/67076e17-60c5-5402-b7ea-d872a098786f/scratchpad/lengkapi.log 2>&1 < /dev/null &
  echo "Narasi: $P/hasil/$3/narasi.wav (kirim dulu ke pemilik sebelum render)";;
musik)
  f=$(python3 $R/projects/musik/ambil_musik.py ambil "$3" | cut -d'|' -f1 | xargs); cp "$f" "$P/public/${4:-musik1.ogg}"; daftar; echo "musik → public/${4:-musik1.ogg}";;
aset)
  cd "$P"; mkdir -p public
  cp node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2 public/caveat-700.woff2
  cp node_modules/@fontsource/patrick-hand/files/patrick-hand-latin-400-normal.woff2 public/patrick-hand.woff2
  for p in $(grep -oh 'pose="[^"]*"' src/*.tsx | cut -d'"' -f2 | sort -u); do
    cp "$A/$3/pose/$p.png" "public/adriy-$p.png" || echo "  POSE TIDAK ADA: $p (lihat $A/$3/pose/)"; done
  for b in $(grep -oh 'nama="[^"]*"' src/*.tsx | cut -d'"' -f2 | sort -u); do
    cp "$A/objek/benda/$b.png" "public/benda-$b.png" || echo "  BENDA TIDAK ADA: $b"; done
  for s in $(grep -oh '"[a-z0-9_]*"' src/Video.tsx | tr -d '"' | sort -u); do
    [ -f "$R/projects/sfx-saya/normal/$s.wav" ] && cp "$R/projects/sfx-saya/normal/$s.wav" public/; done
  daftar; ls public | wc -l | xargs echo "file di public:";;
cek)
  cd "$P"; mkdir -p out/cek; rm -f out/cek/*.png
  D=$(python3 -c "import json,math;print(math.ceil((json.load(open('src/timeline.json'))['total']+1.8)*30))")
  for i in 1 2 3 4 5 6 7 8; do npx remotion still src/index.ts Video out/cek/$i.png --frame=$((D*i/9)) --browser-executable=$BX --scale=0.4 --log=error; done
  $R/.venv-tts/bin/python -c "
from PIL import Image; ims=[Image.open(f'out/cek/{i}.png') for i in range(1,9)]; w,h=ims[0].size
s=Image.new('RGB',(w*4,h*2),'white'); [s.paste(im,((i%4)*w,(i//4)*h)) for i,im in enumerate(ims)]; s.save('out/cek.png')"
  echo "$P/out/cek.png";;
render)
  cd "$P"; npx remotion render src/index.ts Video out/mentah.mp4 --browser-executable=$BX --concurrency=4 --log=error
  ffmpeg -loglevel error -y -i out/mentah.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k "out/$2.mp4"
  echo "$P/out/$2.mp4";;
*) sed -n 2,9p "$0";;
esac
