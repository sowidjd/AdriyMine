import React from "react";
import { Composition } from "remotion";
import { Stapler, DURASI } from "./Stapler";
export const Root: React.FC = () => <Composition id="Stapler" component={Stapler} durationInFrames={DURASI} fps={30} width={1080} height={1920} />;
