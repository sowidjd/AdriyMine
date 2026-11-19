import React from 'react';
import {Composition} from 'remotion';
import {Intro} from './Intro';

// Animasi pembuka CatatanByAdriy: 1080x2160 (rasio HP), 30 fps, 3,4 detik
export const Root: React.FC = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={102} fps={30} width={1080} height={2160} defaultProps={{dark: false}} />
    <Composition id="IntroDark" component={Intro} durationInFrames={102} fps={30} width={1080} height={2160} defaultProps={{dark: true}} />
  </>
);
