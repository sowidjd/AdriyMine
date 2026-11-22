#!/bin/bash
# cek.sh — 1 gambar contoh per adegan (frame 70% adegan) → out/cek.png
cd "$(dirname "$0")"; BX=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out/cek; rm -f out/cek/*.png
FR=$(python3 - <<'P'
import json,re
t=json.load(open('src/timeline.json'));K=t['kalimat'];T=t['total']
src=open('src/MagnetBedah.tsx').read()
aw=[int(m) for m in re.findall(r'^  \[(\d+), \d+, ', src, re.M)]
S=[0]+[round(K[a-1]['mulai']*30)-6 for a in aw[1:]]; E=S[1:]+[round((T+2)*30)]
print(' '.join(str(int(a+(b-a)*0.7)) for a,b in zip(S,E)))
P
)
i=0; for f in $FR; do i=$((i+1)); npx remotion still src/index.ts MagnetBedah out/cek/$(printf %02d $i).png --frame=$f --browser-executable=$BX --scale=0.3 --log=error >/dev/null 2>&1 || echo "gagal $i"; done
/home/user/AdriyMine/.venv-tts/bin/python -c "
from PIL import Image;import glob
fs=sorted(glob.glob('out/cek/*.png'));ims=[Image.open(f) for f in fs];w,h=ims[0].size;c=6;r=(len(ims)+c-1)//c
s=Image.new('RGB',(w*c,h*r),'white');[s.paste(im,((i%c)*w,(i//c)*h)) for i,im in enumerate(ims)];s.save('out/cek.png')"
echo out/cek.png
