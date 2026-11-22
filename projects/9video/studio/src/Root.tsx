import React from "react";
import { Composition, Still } from "remotion";
import { VideoMesin, ThumbMesin, durasiVideo } from "./mesin/inti";
import { DATA as D01 } from "./v01/data";
import { DATA as D02 } from "./v02/data";
import { DATA as D03 } from "./v03/data";
import { DATA as D04 } from "./v04/data";
import { DATA as D05 } from "./v05/data";
import { DATA as D06 } from "./v06/data";
import { DATA as D07 } from "./v07/data";
import { DATA as D08 } from "./v08/data";
import { DATA as D09 } from "./v09/data";
const V01 = () => <VideoMesin data={D01} />;
const T01 = () => <ThumbMesin data={D01} />;
const V02 = () => <VideoMesin data={D02} />;
const T02 = () => <ThumbMesin data={D02} />;
const V03 = () => <VideoMesin data={D03} />;
const T03 = () => <ThumbMesin data={D03} />;
const V04 = () => <VideoMesin data={D04} />;
const T04 = () => <ThumbMesin data={D04} />;
const V05 = () => <VideoMesin data={D05} />;
const T05 = () => <ThumbMesin data={D05} />;
const V06 = () => <VideoMesin data={D06} />;
const T06 = () => <ThumbMesin data={D06} />;
const V07 = () => <VideoMesin data={D07} />;
const T07 = () => <ThumbMesin data={D07} />;
const V08 = () => <VideoMesin data={D08} />;
const T08 = () => <ThumbMesin data={D08} />;
const V09 = () => <VideoMesin data={D09} />;
const T09 = () => <ThumbMesin data={D09} />;

export const Root: React.FC = () => (
  <>
    <Composition id="Video01" component={V01} durationInFrames={durasiVideo(D01)} fps={30} width={1080} height={1920} />
    <Still id="Thumb01" component={T01} width={1080} height={1920} />
    <Composition id="Video02" component={V02} durationInFrames={durasiVideo(D02)} fps={30} width={1080} height={1920} />
    <Still id="Thumb02" component={T02} width={1080} height={1920} />
    <Composition id="Video03" component={V03} durationInFrames={durasiVideo(D03)} fps={30} width={1080} height={1920} />
    <Still id="Thumb03" component={T03} width={1080} height={1920} />
    <Composition id="Video04" component={V04} durationInFrames={durasiVideo(D04)} fps={30} width={1080} height={1920} />
    <Still id="Thumb04" component={T04} width={1080} height={1920} />
    <Composition id="Video05" component={V05} durationInFrames={durasiVideo(D05)} fps={30} width={1080} height={1920} />
    <Still id="Thumb05" component={T05} width={1080} height={1920} />
    <Composition id="Video06" component={V06} durationInFrames={durasiVideo(D06)} fps={30} width={1080} height={1920} />
    <Still id="Thumb06" component={T06} width={1080} height={1920} />
    <Composition id="Video07" component={V07} durationInFrames={durasiVideo(D07)} fps={30} width={1080} height={1920} />
    <Still id="Thumb07" component={T07} width={1080} height={1920} />
    <Composition id="Video08" component={V08} durationInFrames={durasiVideo(D08)} fps={30} width={1080} height={1920} />
    <Still id="Thumb08" component={T08} width={1080} height={1920} />
    <Composition id="Video09" component={V09} durationInFrames={durasiVideo(D09)} fps={30} width={1080} height={1920} />
    <Still id="Thumb09" component={T09} width={1080} height={1920} />
  </>
);
