# Clawd mengejar kupu-kupu (15 detik)

Dibuat dengan `repos/ClaudeAnimationBase`. Untuk merender ulang:

```sh
cd repos/ClaudeAnimationBase
git apply ../../projects/clawd-kupu-kupu/kit.patch      # durasi 15 s, scene butterfly.js, render tanpa menunggu jaringan
cp ../../projects/clawd-kupu-kupu/butterfly.js src/scenes/
cp ../../projects/clawd-kupu-kupu/STORYBOARD.md .
npm install
node render.mjs --clip --out=out/video.mp4
```
