import React from "react";
import { Composition } from "remotion";
import { MagnetBedah, DURASI } from "./MagnetBedah";

export const Root: React.FC = () => (
  <Composition
    id="MagnetBedah"
    component={MagnetBedah}
    durationInFrames={DURASI}
    fps={30}
    width={1080}
    height={1920}
  />
);
