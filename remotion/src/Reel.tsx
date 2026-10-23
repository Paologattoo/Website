import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Parola, ReelProps} from './tipi';

const FONT = 'Montserrat, sans-serif';
const BIANCO_CONTORNO = '0 0 2px #000, 0 0 2px #000, 0 4px 0 #000, 0 0 18px rgba(0,0,0,.55)';

export const Reel: React.FC<ReelProps> = (p) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const durataVideo = Math.round((p.fine - p.inizio) * fps);
  const t = frame / fps; // secondi sulla timeline del reel
  const evidenzia = p.colori?.evidenzia ?? '#FFC93C';
  const sfocato = p.layout === 'sfondo-sfocato';

  // Zoom: leggero avvicinamento continuo + "punch" a molla nei momenti indicati
  const lento = p.zoomLento === false ? 1 : interpolate(frame, [0, durataVideo], [1, 1.06]);
  const punch = (p.zoom ?? []).reduce((acc, z) => {
    const f0 = Math.round((z.a - p.inizio) * fps);
    if (frame < f0) return acc;
    const durata = Math.round((z.durata ?? 0.6) * fps);
    const su = spring({frame: frame - f0, fps, config: {damping: 12, stiffness: 180}});
    const giu = interpolate(frame, [f0 + durata, f0 + durata + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return acc * (1 + ((z.scala ?? 1.15) - 1) * su * (1 - giu));
  }, 1);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence durationInFrames={durataVideo}>
        {sfocato ? (
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(p.video)} trimBefore={Math.round(p.inizio * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.55) saturate(1.2)', transform: 'scale(1.2)'}} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={sfocato ? {top: 430, height: 810, overflow: 'hidden', borderRadius: 28, left: 0, right: 0, boxShadow: '0 20px 60px rgba(0,0,0,.6)'} : undefined}>
          <AbsoluteFill style={{transform: `scale(${lento * punch})`, transformOrigin: sfocato ? '50% 40%' : '50% 35%'}}>
            <OffthreadVideo
              src={staticFile(p.video)}
              trimBefore={Math.round(p.inizio * fps)}
              volume={p.volumeVideo ?? 1}
              style={{width: '100%', height: '100%', objectFit: 'cover', filter: p.filtro ?? 'saturate(1.1) contrast(1.05) sepia(0.06)'}}
            />
          </AbsoluteFill>
        </AbsoluteFill>
        {p.gancio ? <Gancio testo={p.gancio.testo} durata={p.gancio.durata ?? 2} colore={evidenzia} /> : null}
        <Sottotitoli parole={p.parole} inizio={p.inizio} t={t} gruppo={p.paroleInsieme ?? 3} colore={evidenzia} top={sfocato ? 1290 : 1180} />
        {(p.emoji ?? []).map((e, i) => (
          <Sequence key={i} from={Math.round((e.a - p.inizio) * fps)} durationInFrames={Math.round((e.durata ?? 1.2) * fps)}>
            <EmojiPop emoji={e.emoji} x={e.x ?? 760} y={e.y ?? 520} />
          </Sequence>
        ))}
        {p.barra === false ? null : (
          <div style={{position: 'absolute', left: 0, bottom: 0, height: 12, width: `${(frame / durataVideo) * 100}%`, background: p.colori?.barra ?? evidenzia}} />
        )}
      </Sequence>
      {(p.suoni ?? []).map((s, i) => (
        <Sequence key={i} from={Math.round((s.a - p.inizio) * fps)}>
          <Audio src={staticFile(s.file)} volume={s.volume ?? 0.6} />
        </Sequence>
      ))}
      {p.finale ? (
        <Sequence from={durataVideo}>
          <Finale testo={p.finale.testo} sottotesto={p.finale.sottotesto} colore={evidenzia} sfondo={p.colori?.sfondoFinale ?? '#111'} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

// Sottotitoli a gruppi di parole: la parola detta in quel momento si accende e "salta"
const Sottotitoli: React.FC<{parole: Parola[]; inizio: number; t: number; gruppo: number; colore: string; top: number}> = ({parole, inizio, t, gruppo, colore, top}) => {
  const {fps} = useVideoConfig();
  const ts = t + inizio; // secondi del girato originale
  const gruppi: Parola[][] = [];
  for (let i = 0; i < parole.length; i += gruppo) gruppi.push(parole.slice(i, i + gruppo));
  const g = gruppi.find((gr, i) => ts >= gr[0].inizio && ts < (gruppi[i + 1]?.[0].inizio ?? gr[gr.length - 1].fine + 0.4));
  if (!g) return null;
  const entrata = spring({frame: Math.round((ts - g[0].inizio) * fps), fps, config: {damping: 14, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top, left: 70, right: 170, textAlign: 'center', transform: `scale(${0.85 + 0.15 * entrata})`}}>
      {g.map((w, i) => {
        const attiva = ts >= w.inizio && ts < w.fine + 0.05;
        const pop = attiva ? spring({frame: Math.round((ts - w.inizio) * fps), fps, config: {damping: 10, stiffness: 260}}) : 0;
        return (
          <span key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: 86, lineHeight: 1.15, textTransform: 'uppercase', color: attiva || w.evidenzia ? colore : '#fff', textShadow: BIANCO_CONTORNO, display: 'inline-block', margin: '0 18px', transformOrigin: '50% 60%', transform: `scale(${1 + 0.07 * pop}) rotate(${w.evidenzia && attiva ? -3 : 0}deg)`}}>
            {w.testo}
          </span>
        );
      })}
    </div>
  );
};

const Gancio: React.FC<{testo: string; durata: number; colore: string}> = ({testo, durata, colore}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 12}});
  const esce = interpolate(frame, [durata * fps - 6, durata * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 300, left: 60, right: 170, display: 'flex', justifyContent: 'center', opacity: esce}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 78, lineHeight: 1.1, textAlign: 'center', color: '#111', background: colore, padding: '18px 30px', borderRadius: 18, transform: `scale(${entra}) rotate(-2deg)`, boxShadow: '0 10px 30px rgba(0,0,0,.35)'}}>
        {testo}
      </div>
    </div>
  );
};

const EmojiPop: React.FC<{emoji: string; x: number; y: number}> = ({emoji, x, y}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 8, stiffness: 220}});
  const esce = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return <div style={{position: 'absolute', left: x, top: y, fontSize: 150, transform: `scale(${s * esce}) rotate(${(1 - s) * -30}deg)`}}>{emoji}</div>;
};

const Finale: React.FC<{testo: string; sottotesto?: string; colore: string; sfondo: string}> = ({testo, sottotesto, colore, sfondo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{background: sfondo, justifyContent: 'center', alignItems: 'center', padding: 80, opacity: interpolate(frame, [0, 6], [0, 1])}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 96, color: colore, textAlign: 'center', transform: `scale(${s})`}}>{testo}</div>
      {sottotesto ? <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 52, color: '#fff', textAlign: 'center', marginTop: 30, opacity: s}}>{sottotesto}</div> : null}
    </AbsoluteFill>
  );
};
