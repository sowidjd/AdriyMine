#!/bin/bash
# Isi pustaka suara: lengkapi semua suara, lalu tambah stok kalimat baru (projects/suara/stok/*.txt) untuk semua suara.
# Aman dijalankan ulang (yang sudah jadi dilewati). Pakai: nohup setsid bash projects/suara/jalan_pustaka.sh >> log.txt 2>&1 &
cd /home/user/AdriyMine
PY=.venv-tts/bin/python
SUARA="adriy ongky hasan mia"
$PY projects/suara/lengkapi_pustaka.py --suara hasan
echo "MULAI MIA"
$PY projects/suara/lengkapi_pustaka.py --suara mia
for f in projects/suara/stok/stok-*.txt; do
  echo "MULAI STOK $f"
  for s in $SUARA; do $PY projects/suara/pustaka_suara.py tambah --file "$f" --suara $s; python3 projects/suara/pustaka_suara.py kirim; done
done
echo "SEMUA SELESAI"
