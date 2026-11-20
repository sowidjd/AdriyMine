#!/usr/bin/env bash
# Ambil aset tokoh ADRIY dari repo privat sowidjd/Adriy-aset-karakter ke projects/karakter/aset/ (tidak masuk git).
# Pakai: bash projects/karakter/ambil_aset.sh [branch]   (default: ccr-a6f601eb-m17nbt)
set -euo pipefail
cd "$(dirname "$0")"
BRANCH="${1:-ccr-a6f601eb-m17nbt}"
if [ -d aset/.git ]; then
  git -C aset fetch --depth 1 origin "$BRANCH" && git -C aset checkout -q FETCH_HEAD
else
  git clone --depth 1 -b "$BRANCH" https://github.com/sowidjd/Adriy-aset-karakter aset
fi
echo "Aset ADRIY siap di projects/karakter/aset/ (pose PNG: <outfit>/pose/, peta pose: <outfit>/peta.json)"
