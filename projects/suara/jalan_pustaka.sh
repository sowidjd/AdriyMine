#!/bin/bash
# Isi pustaka suara: hasan -> 2 kalimat penutup -> mia. Aman dijalankan ulang (yang sudah jadi dilewati).
# nohup setsid bash projects/suara/jalan_pustaka.sh >> log.txt 2>&1 &
cd /home/user/AdriyMine
PY=.venv-tts/bin/python
$PY projects/suara/lengkapi_pustaka.py --suara hasan
$PY projects/suara/pustaka_suara.py tambah "Yang kelihatan sederhana ternyata jauh lebih rumit dari bayangan kita." "Kalau ini bisa terjadi di alam, apa lagi yang belum kita tahu?" --suara adriy ongky hasan
python3 projects/suara/pustaka_suara.py kirim
echo "MULAI MIA"
$PY projects/suara/lengkapi_pustaka.py --suara mia
echo "SEMUA SELESAI"
