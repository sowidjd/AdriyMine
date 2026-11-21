#!/bin/bash
# Antrean pustaka suara tanpa batas: lengkapi semua suara, lalu kerjakan stok-*.txt satu per satu.
# Stok yang sudah selesai dicatat di projects/suara/stok/.selesai (tidak diulang).
# Kalau semua stok habis -> "SEMUA SELESAI" (pemeriksaan rutin lalu menulis stok baru & menjalankan ulang).
cd /home/user/AdriyMine; PY=.venv-tts/bin/python; SUARA="adriy ongky hasan mia"
D=projects/suara/stok/.selesai; touch $D
echo "MULAI LENGKAPI"; $PY projects/suara/lengkapi_pustaka.py --suara hasan mia adriy ongky
while true; do
  f=""; for x in projects/suara/stok/stok-*.txt; do grep -qxF "$x" $D || { f=$x; break; }; done
  [ -z "$f" ] && break
  echo "MULAI STOK $f"
  for s in $SUARA; do $PY projects/suara/pustaka_suara.py tambah --file "$f" --suara $s; python3 projects/suara/pustaka_suara.py kirim; done
  echo "$f" >> $D
done
echo "SEMUA SELESAI"
