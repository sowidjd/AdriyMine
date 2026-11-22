"""Tulis src/Root.tsx: daftarkan VideoNN & ThumbNN untuk tiap src/vNN/data.tsx yang ada."""
import glob, os
S = os.path.dirname(os.path.abspath(__file__))
vs = sorted(os.path.basename(os.path.dirname(p)) for p in glob.glob(f"{S}/src/v*/data.tsx"))
imp = "\n".join(f'import {{ DATA as D{v[1:]} }} from "./{v}/data";' for v in vs)
# data berisi fungsi → tidak boleh lewat props (props diserialisasi), jadi dibungkus komponen
bung = "\n".join(f"const V{v[1:]} = () => <VideoMesin data={{D{v[1:]}}} />;\nconst T{v[1:]} = () => <ThumbMesin data={{D{v[1:]}}} />;" for v in vs)
comp = "\n".join(
    f'    <Composition id="Video{v[1:]}" component={{V{v[1:]}}} durationInFrames={{durasiVideo(D{v[1:]})}} fps={{30}} width={{1080}} height={{1920}} />\n'
    f'    <Still id="Thumb{v[1:]}" component={{T{v[1:]}}} width={{1080}} height={{1920}} />'
    for v in vs)
open(f"{S}/src/Root.tsx", "w").write(f'''import React from "react";
import {{ Composition, Still }} from "remotion";
import {{ VideoMesin, ThumbMesin, durasiVideo }} from "./mesin/inti";
{imp}
{bung}

export const Root: React.FC = () => (
  <>
{comp}
  </>
);
''')
print("Root:", vs)
