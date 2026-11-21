import React from "react";
import { Composition } from "remotion";
import { MagnetBedah } from "./MagnetBedah";

export const Root: React.FC = () => (
  <Composition
    id="MagnetBedah"
    component={MagnetBedah}
    durationInFrames={1800}
    fps={30}
    width={1080}
    height={1920}
  />
);
