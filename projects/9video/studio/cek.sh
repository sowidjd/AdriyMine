#!/bin/bash
# cek.sh v01 → out/cek-v01.png (1 gambar per adegan) + out/thumb-v01.png
cd "$(dirname "$0")"; v=$1; n=${v:1}; BX=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out/cek-$v; rm -f out/cek-$v/*.png
FR=$(python3 - "$v" <<'P'
import json,re,sys
v=sys.argv[1]; t=json.load(open(f'src/{v}/timeline.json'));K=t['kalimat'];T=t['total']
aw=[int(m) for m in re.findall(r'\{ k: \[(\d+), \d+\]', open(f'src/{v}/data.tsx').read())]
S=[0]+[round(K[a-1]['mulai']*30)-6 for a in aw[1:]]; E=S[1:]+[round((T+1.5)*30)]
print(' '.join(str(int(a+(b-a)*0.7)) for a,b in zip(S,E)))
P
)
npx remotion bundle src/index.ts --out-dir=out/bundle --log=error >/dev/null 2>&1
i=0; for f in $FR; do i=$((i+1)); npx remotion still out/bundle Video$n out/cek-$v/$(printf %02d $i).png --frame=$f --browser-executable=$BX --scale=0.3 --log=error >/dev/null 2>&1 || echo "gagal $i"; done
npx remotion still out/bundle Thumb$n out/thumb-$v.png --browser-executable=$BX --log=error >/dev/null 2>&1 || echo "gagal thumb"
/home/user/AdriyMine/.venv-tts/bin/python -c "
from PIL import Image;import glob
fs=sorted(glob.glob('out/cek-$v/*.png'));ims=[Image.open(f) for f in fs];w,h=ims[0].size;c=6;r=(len(ims)+c-1)//c
s=Image.new('RGB',(w*c,h*r),'white');[s.paste(im,((i%c)*w,(i//c)*h)) for i,im in enumerate(ims)];s.save('out/cek-$v.png')"
echo out/cek-$v.png
