#!/bin/bash
# Antrean narasi Hasan untuk 9 video: tiap NN-*.txt → hasil/NN-nama/narasi.wav (bisa dilanjutkan bila terputus)
cd /home/user/AdriyMine
while true; do
  pkill -f jalan_pustaka.sh; pkill -f lengkapi_pustaka; pkill -f "pustaka_suara.py tambah"
  f=""; for x in projects/9video/[0-9][0-9]-*.txt; do n=$(basename $x .txt); [ -f projects/9video/hasil/$n/narasi.wav ] || { f=$x; break; }; done
  if [ -z "$f" ]; then [ -f projects/9video/.naskah-lengkap ] && break; sleep 30; continue; fi
  n=$(basename $f .txt); echo "MULAI $n $(date +%H:%M)"
  .venv-tts/bin/python projects/suara/pustaka_suara.py naskah "$f" projects/9video/hasil/$n/ --suara hasan
  python3 projects/suara/pustaka_suara.py kirim || true
  echo "SELESAI $n $(date +%H:%M)"
done
echo "SEMUA NARASI SELESAI"
nohup setsid bash projects/suara/jalan_pustaka.sh >> /tmp/claude-0/-home-user/67076e17-60c5-5402-b7ea-d872a098786f/scratchpad/lengkapi.log 2>&1 < /dev/null &
