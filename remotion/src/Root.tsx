import {Composition} from 'remotion';
import {Reel} from './Reel';
import type {ReelProps} from './tipi';
import {
  PistisSophiaVideo,
  PS_ALTEZZA,
  PS_DURATA,
  PS_FPS,
  PS_LARGHEZZA,
  type PistisSophiaProps,
} from './PistisSophiaVideo';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';

export const FPS = 30;

const esempio: ReelProps = {
  video: 'clips/esempio.mp4',
  inizio: 0,
  fine: 5,
  parole: [],
};

// Props di default del video Pistis Sophia.
// ▼ Quando hai la voce, metti il file in public/pistis/ e scrivi qui il percorso,
//   es. voce: 'pistis/voce.mp3'  (e, se vuoi, musica: 'pistis/musica.mp3').
const pistisDefault: PistisSophiaProps = {
  voce: '',
  musica: '',
  volumeMusica: 0.18,
  sottotitoli: true,
};

export const Root: React.FC = () => (
  <>
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
    {/* 1080x1920 verticale · 30 fps · 3600 frame = 120 secondi */}
    <Composition
      id="PistisSophia"
      component={PistisSophiaVideo}
      width={PS_LARGHEZZA}
      height={PS_ALTEZZA}
      fps={PS_FPS}
      durationInFrames={PS_DURATA}
      defaultProps={pistisDefault}
    />
  </>
);
