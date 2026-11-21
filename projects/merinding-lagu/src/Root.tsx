import React from "react";
import { Composition } from "remotion";
import { DURASI, Merinding } from "./Video";

export const Root: React.FC = () => (
  <Composition id="Merinding" component={Merinding} durationInFrames={DURASI} fps={30} width={1080} height={1920} />
);
