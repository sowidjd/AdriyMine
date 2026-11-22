import React from "react";
import { Composition } from "remotion";
import { Materi, MateriProps } from "./Materi";
const contoh: MateriProps = { judul: "Contoh", tema: "bongkah", audio: "", durasi: 150,
  bagian: [{ judul: "Pembuka", a: 0, b: 150 }], kalimat: [{ teks: "Ini contoh kalimat.", a: 10, b: 140, bagian: 0 }] };
export const Root: React.FC = () => (
  <Composition id="Materi" component={Materi} width={1080} height={1920} fps={30} durationInFrames={150} defaultProps={contoh}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(30, props.durasi) })} />
);
