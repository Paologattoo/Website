import {Composition} from 'remotion';
import {Reel} from './Reel';
import type {ReelProps} from './tipi';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';

export const FPS = 30;

const esempio: ReelProps = {
  video: 'clips/esempio.mp4',
  inizio: 0,
  fine: 5,
  parole: [],
};

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={150}
    defaultProps={esempio}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.round((props.fine - props.inizio + (props.finale ? props.finale.durata ?? 2 : 0)) * FPS),
    })}
  />
);
