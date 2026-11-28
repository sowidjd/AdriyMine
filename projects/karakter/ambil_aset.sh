#!/usr/bin/env bash
# Tarik aset karakter dari repo sowidjd/Adriy-aset-karakter ke projects/karakter/aset/ (tidak masuk git).
#   bash projects/karakter/ambil_aset.sh            # tokoh orang (8 outfit) + hewan + benda
# Folder suara/ dan sfx/ repo itu sengaja tidak diambil (suara pakai projects/suara/pustaka, SFX pakai projects/sfx-bebas).
set -euo pipefail
SINI="$(cd "$(dirname "$0")" && pwd)"
SUMBER="${ASET_SUMBER:-/home/user/sowidjd/adriy-aset-karakter}"
URL="https://github.com/sowidjd/adriy-aset-karakter"
if [ ! -d "$SUMBER/.git" ]; then
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 "$URL" "$SUMBER"
else
  git -C "$SUMBER" pull -q --ff-only || echo "(gagal memperbarui, pakai salinan yang ada)"
fi
TUJUAN="$SINI/aset"; mkdir -p "$TUJUAN"
for d in santai travel arkeolog formal angkasa penyelam lab konstruksi objek; do
  rm -rf "$TUJUAN/$d"; cp -a "$SUMBER/$d" "$TUJUAN/$d"
done
cp "$SUMBER/README.md" "$TUJUAN/README-sumber.md"
echo "Selesai: $(find "$TUJUAN" -name '*.png' | wc -l) gambar di $TUJUAN ($(du -sh "$TUJUAN" | cut -f1))"
