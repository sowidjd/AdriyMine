#!/bin/bash
# Render satu still per adegan (titik 70%) lalu gabung jadi lembar cek
BX=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
FR=$(python3 - <<'P'
import json,math
k=json.load(open('src/timeline.json'));K=k['kalimat'];fk=lambda n:round(K[n-1]['mulai']*30)
A=[[1,1],[2,2],[3,4],[5,6],[7,7],[8,10],[11,12],[13,13],[14,16],[17,18],[19,21],[22,24],[25,26]]
D=math.ceil((k['total']+1.8)*30); m=lambda i:0 if i==0 else fk(A[i][0])-6
e=lambda i:D if i==len(A)-1 else m(i+1)
print(' '.join(str(int(m(i)+(e(i)-m(i))*0.72)) for i in range(len(A))))
P
)
mkdir -p out/still; rm -f out/still/*.png
for f in $FR; do npx remotion still src/index.ts Merinding out/still/$(printf %05d $f).png --frame=$f --browser-executable=$BX --scale=0.4 --log=error; done
/home/user/AdriyMine/.venv-tts/bin/python -c "
from PIL import Image; import glob
fs=sorted(glob.glob('out/still/*.png')); ims=[Image.open(f) for f in fs]; w,h=ims[0].size
C=7; R=(len(ims)+C-1)//C; sh=Image.new('RGB',(w*C,h*R),'white')
for i,im in enumerate(ims): sh.paste(im,((i%C)*w,(i//C)*h))
sh.save('/tmp/claude-0/-home-user/67076e17-60c5-5402-b7ea-d872a098786f/scratchpad/merinding_cek.png')"
