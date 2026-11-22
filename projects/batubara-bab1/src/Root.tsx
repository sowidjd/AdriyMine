import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import tl from "./timeline.json";
export const Root: React.FC = () => <Composition id="Batubara" component={Video} durationInFrames={tl.durasi} fps={30} width={1080} height={1920} />;
