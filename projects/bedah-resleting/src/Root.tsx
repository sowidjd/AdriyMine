import React from "react";
import { Composition } from "remotion";
import { DURASI, Video } from "./Video";

export const Root: React.FC = () => (
  <Composition id="Video" component={Video} durationInFrames={DURASI} fps={30} width={1080} height={1920} />
);
