import React from "react";
import { Composition } from "remotion";
import { Stapler } from "./Stapler";
export const Root: React.FC = () => <Composition id="Stapler" component={Stapler} durationInFrames={360} fps={30} width={1080} height={1920} />;
