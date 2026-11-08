/**
 * PistisSophiaVideo – video verticale 1080x1920, 30 fps, 3600 frame (120 s).
 *
 * Tutto è generato con il codice, niente immagini IA:
 *  - gli SFONDI sono creati da `strumenti/genera-immagini-pistis.py` (frattali,
 *    nebulose, vortici, città, tunnel) e stanno in `public/pistis/`;
 *  - le FIGURE (Sophia, Demiurgo, Arconti, uomo, meditante) sono disegnate in SVG
 *    qui sotto e animate frame per frame.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DOVE METTERE LE TUE IMMAGINI
 *   Se vuoi usare immagini tue al posto degli sfondi generati, mettile in
 *   `remotion/public/pistis/` e cambia i percorsi nell'oggetto `IMMAGINI`.
 *   Formato consigliato: verticale, almeno 1440x2560 (gli zoom arrivano a 2.5x).
 *
 * DOVE METTERE LA VOCE (E LA MUSICA)
 *   Metti la traccia in `remotion/public/pistis/` (es. `voce.mp3`) e passala come
 *   prop `voce: "pistis/voce.mp3"` (defaultProps in Root.tsx). Uguale per `musica`.
 *   La voce parte al frame 0 e segue i tempi delle sequenze (SCENE, sotto).
 *   I sottotitoli sono distribuiti in proporzione al testo: con la voce vera si
 *   possono allineare parola per parola (python3 trascrivi.py / whisper-cli).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/cinzel/700.css';

// ── Impostazioni generali ────────────────────────────────────────────────────
export const PS_FPS = 30;
export const PS_DURATA = 3600; // 120 s
export const PS_LARGHEZZA = 1080;
export const PS_ALTEZZA = 1920;
const W = PS_LARGHEZZA;
const H = PS_ALTEZZA;

export type PistisSophiaProps = {
  /** Traccia voce in public/, es. "pistis/voce.mp3". Vuota = nessun audio. */
  voce?: string;
  /** Musica di sottofondo in public/, es. "pistis/musica.mp3". */
  musica?: string;
  /** Volume musica (0-1), la voce resta a 1. */
  volumeMusica?: number;
  /** Mostra i sottotitoli della voce. */
  sottotitoli?: boolean;
};

// ▼▼▼ IMMAGINI DI SFONDO (percorsi relativi a remotion/public/) ▼▼▼
const IMMAGINI = {
  pleroma: 'pistis/pleroma.jpg',
  gabbia: 'pistis/gabbia.jpg',
  nebulosa: 'pistis/nebulosa.jpg',
  abisso: 'pistis/abisso.jpg',
  caos: 'pistis/caos.jpg',
  oro: 'pistis/oro.jpg',
  citta: 'pistis/citta.jpg',
  tunnel: 'pistis/tunnel.jpg',
  luce: 'pistis/luce.jpg',
};
// ▲▲▲───────────────────────────────────────────────────────────▲▲▲

// ── Timeline esatta ──────────────────────────────────────────────────────────
const SCENE = {
  pleroma: {
    from: 0,
    durata: 450,
    colore: '#9FE7FF',
    testoVoce:
      "Guarda il mondo intorno a te. E se ti dicessero che tutto ciò che tocchi, vedi e ami è solo una simulazione, una gabbia cosmica progettata per tenerti prigioniero? Tu non appartieni a questo piano materiale. Tu provieni dal Pleroma, il regno della pura Luce infinita.",
  },
  sophia: {
    from: 450,
    durata: 600,
    colore: '#D4B8FF',
    testoVoce:
      "Tutto è iniziato con un'emanazione divina chiamata Pistis Sophia, la Saggezza. Desiderosa di comprendere il mistero assoluto del Creatore senza il Suo consenso, generò un'anomalia. Questo errore cosmico la fece precipitare dal paradiso direttamente nelle profondità oscure del Caos.",
  },
  demiurgo: {
    from: 1050,
    durata: 600,
    colore: '#FF2A2A',
    testoVoce:
      "Da questo errore è nato Yaldabaoth, il Demiurgo. Una mostruosità con il corpo di serpente e la testa di leone. Cieco, arrogante e folle, urlò nel vuoto: 'Io sono l'unico Dio'. Iniziò a generare gli Arconti, parassiti dimensionali al suo servizio.",
  },
  scintilla: {
    from: 1650,
    durata: 750,
    colore: '#FFC93C',
    testoVoce:
      "Gli Arconti non possono creare la vita vera, possono solo imitare. Hanno forgiato questo universo materiale e il corpo umano, usandolo come una prigione di carne. Ma a loro insaputa, una scintilla della luce divina di Sophia è rimasta intrappolata dentro di te. Sei un dio frammentato, chiuso in una cella biologica.",
  },
  ciclo: {
    from: 2400,
    durata: 600,
    colore: '#7FD4FF',
    testoVoce:
      "Questi esseri si nutrono delle tue emozioni a bassa frequenza: paura, dolore, rabbia. Hanno costruito la società e il ciclo delle reincarnazioni come un sistema di raccolta energetica. Quando muori, quella luce bianca che vedi è un inganno degli Arconti per cancellare la tua memoria e rimandarti nella Matrix.",
  },
  risveglio: {
    from: 3000,
    durata: 600,
    colore: '#FFFFFF',
    testoVoce:
      "Ma c'è una via d'uscita. Pistis Sophia si è pentita e ha inviato la 'Gnosi', la conoscenza segreta. La salvezza non arriva pregando i falsi dèi, ma ricordando chi sei veramente. Il velo si sta strappando. Tu... sei pronto a uscire dalla Matrix?",
  },
};

// ── Utilità ──────────────────────────────────────────────────────────────────
const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const morbido = Easing.inOut(Easing.cubic);

/** Valore da `da` ad `a` tra i frame f0 e f1 (bloccato fuori). */
const tra = (f: number, f0: number, f1: number, da: number, a: number, easing = morbido) =>
  interpolate(f, [f0, f1], [da, a], {...CL, easing});

/** Scossa morbida: decade dopo ciascun evento. */
const scossa = (f: number, eventi: number[], forza = 40, decadimento = 10) => {
  let k = 0;
  for (const e of eventi) if (f >= e) k = Math.max(k, Math.exp(-(f - e) / decadimento));
  return {
    x: (Math.sin(f * 2.1) + Math.sin(f * 3.7 + 1.3)) * 0.5 * forza * k,
    y: (Math.cos(f * 2.7) + Math.sin(f * 4.3 + 0.7)) * 0.5 * forza * k,
    k,
  };
};

// ── Stili testo (CSS-in-JS) ──────────────────────────────────────────────────
const stili = {
  titolo: {
    position: 'absolute',
    left: 40,
    right: 40,
    textAlign: 'center',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 900,
    lineHeight: 1.0,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  didascalia: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 1250, // fascia sicura, sopra i pulsanti di Reels/TikTok
    textAlign: 'center',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 900,
    fontSize: 66,
    lineHeight: 1.15,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    WebkitTextStroke: '3px rgba(0,0,0,0.85)',
    paintOrder: 'stroke fill',
    textShadow: '0 5px 0 rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.95)',
  },
} satisfies Record<string, React.CSSProperties>;

const alone = (colore: string, forza = 1) =>
  [
    '0 6px 16px rgba(0,0,0,0.9)',
    '0 0 3px rgba(0,0,0,0.95)',
    `0 0 ${16 * forza}px ${colore}`,
    `0 0 ${40 * forza}px ${colore}`,
    `0 0 ${90 * forza}px ${colore}`,
  ].join(', ');

// ── Elementi di base ─────────────────────────────────────────────────────────

type Mossa = {s: [number, number]; x?: [number, number]; y?: [number, number]; r?: [number, number]; origine?: string};

/** Sfondo con movimento di camera (scala, spostamento in %, rotazione). */
const Sfondo: React.FC<{src: string; mossa: Mossa; filtro?: string; opacita?: number}> = ({src, mossa, filtro, opacita = 1}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const s = tra(f, 0, d, ...mossa.s);
  const x = mossa.x ? tra(f, 0, d, ...mossa.x) : 0;
  const y = mossa.y ? tra(f, 0, d, ...mossa.y) : 0;
  const r = mossa.r ? tra(f, 0, d, ...mossa.r, Easing.linear) : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: opacita}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${x}%, ${y}%) rotate(${r}deg) scale(${s})`,
          transformOrigin: mossa.origine ?? '50% 50%',
          filter: filtro,
        }}
      />
    </AbsoluteFill>
  );
};

/** Particelle luminose: salgono, scendono, vengono verso la camera o vengono risucchiate. */
const Particelle: React.FC<{
  n?: number;
  colore: string;
  moto: 'su' | 'giu' | 'verso' | 'risucchio';
  seme: string;
  dimensione?: number;
  velocita?: number;
  opacita?: number;
}> = ({n = 70, colore, moto, seme, dimensione = 8, velocita = 1, opacita = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: opacita}}>
      {new Array(n).fill(0).map((_, i) => {
        const rx = random(`${seme}x${i}`);
        const ry = random(`${seme}y${i}`);
        const rv = 0.4 + random(`${seme}v${i}`) * 1.2;
        const rs = 0.4 + random(`${seme}s${i}`) * 1.4;
        let x = rx * W;
        let y = ry * H;
        let size = dimensione * rs;
        let op = 0.5 + 0.5 * Math.sin(f / 8 + i);
        if (moto === 'su' || moto === 'giu') {
          const dy = f * 3 * rv * velocita;
          y = (((moto === 'su' ? ry * H - dy : ry * H + dy) % H) + H) % H;
          x += Math.sin(f / 30 + i) * 20;
        } else {
          // radiale: t va da 0 (centro) a 1 (bordo)
          let t = (((f * 0.006 * rv * velocita + ry) % 1) + 1) % 1;
          if (moto === 'risucchio') t = 1 - t;
          const ang = rx * Math.PI * 2;
          const dist = t * t * 1500;
          x = W / 2 + Math.cos(ang) * dist;
          y = H / 2 + Math.sin(ang) * dist;
          size *= 0.3 + t * 2.2;
          op *= Math.min(1, t * 4) * Math.min(1, (1 - t) * 6 + 0.3);
        }
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: colore,
              opacity: op,
              boxShadow: `0 0 ${size * 2}px ${size * 0.6}px ${colore}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Lampo sui tagli. */
const Lampi: React.FC<{frames: number[]; colore?: string; forza?: number}> = ({frames, colore = '#fff', forza = 0.85}) => {
  const f = useCurrentFrame();
  let o = 0;
  for (const t of frames) o = Math.max(o, interpolate(f, [t - 2, t, t + 9], [0, forza, 0], CL));
  return <AbsoluteFill style={{backgroundColor: colore, opacity: o, mixBlendMode: 'screen'}} />;
};

const Vignetta: React.FC<{forza?: number}> = ({forza = 0.75}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${forza}) 100%)`}} />
);

/** Grana pellicola animata. */
const Grana: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <filter id="grana">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 30} />
        </filter>
        <rect width={W} height={H} filter="url(#grana)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Dissolvenza dal/al nero ai bordi della scena. */
const Dissolvenza: React.FC<{durata: number; entrata?: number; uscita?: number}> = ({durata, entrata = 8, uscita = 8}) => {
  const f = useCurrentFrame();
  const o = Math.max(
    entrata ? interpolate(f, [0, entrata], [1, 0], CL) : 0,
    uscita ? interpolate(f, [durata - uscita, durata], [0, 1], CL) : 0,
  );
  return <AbsoluteFill style={{backgroundColor: '#000', opacity: o}} />;
};

// ── Titolo cinetico: lettere che entrano a scatto, poi il titolo sale in alto ──
type StileTitolo = 'luce' | 'elegante' | 'glitch' | 'oro' | 'pulsa' | 'vibra';

const TitoloCinetico: React.FC<{
  testo: string;
  stile: StileTitolo;
  colore: string;
  dimensione: number;
  inizio?: number;
  /** Frame in cui il titolo sale in alto e si rimpicciolisce (null = resta al centro). */
  sali?: number | null;
}> = ({testo, stile, colore, dimensione, inizio = 10, sali = 100}) => {
  const f = useCurrentFrame() - inizio;
  const {fps} = useVideoConfig();
  if (f < 0) return null;

  const salita = sali === null ? 0 : spring({frame: f - (sali - inizio), fps, config: {damping: 16, stiffness: 120}});
  const top = interpolate(salita, [0, 1], [760, 250]);
  const scala = interpolate(salita, [0, 1], [1, 0.62]);
  const pulsa = stile === 'pulsa' ? 1 + Math.sin(f / 5) * 0.05 : 1;
  const vib = stile === 'vibra' ? 6 : stile === 'glitch' ? 2 : 0;
  const glitchOn = stile === 'glitch' && random(`gl${Math.floor(f / 3)}`) > 0.6;
  const sep = glitchOn ? 8 + random(`gs${f}`) * 16 : 3;

  let indice = 0;
  const parole = testo.split(' ');
  return (
    <div
      style={{
        ...stili.titolo,
        top,
        fontSize: dimensione,
        fontFamily: stile === 'elegante' ? 'Cinzel, serif' : stili.titolo.fontFamily,
        fontWeight: stile === 'elegante' ? 700 : 900,
        letterSpacing: stile === 'elegante' ? `${tra(f, 0, 90, 0.4, 0.12)}em` : '0.02em',
        transform: `translate(${(random(`tx${f}`) - 0.5) * vib}px, ${(random(`ty${f}`) - 0.5) * vib}px) scale(${scala * pulsa})`,
        transformOrigin: '50% 0%',
      }}
    >
      {parole.map((parola, pi) => (
        <span key={pi} style={{display: 'inline-block', whiteSpace: 'nowrap', margin: '0 0.18em'}}>
          {parola.split('').map((lettera, li) => {
            const i = indice++;
            const e = spring({frame: f - i * 2, fps, config: {damping: 11, stiffness: 170}});
            const sfoca = interpolate(e, [0, 1], [18, 0], CL);
            const dy = (random(`dy${testo}${i}`) - 0.5) * 300 * (1 - e);
            const rot = (random(`rot${testo}${i}`) - 0.5) * 70 * (1 - e);
            const sc = interpolate(e, [0, 1], [2.6, 1]);
            const shadow =
              stile === 'glitch'
                ? `${sep}px 0 0 rgba(0,255,255,0.75), ${-sep}px 0 0 rgba(255,0,60,0.85), 0 8px 24px rgba(0,0,0,0.95), 0 0 40px ${colore}`
                : alone(colore, stile === 'pulsa' ? pulsa : 1);
            return (
              <span
                key={li}
                style={{
                  display: 'inline-block',
                  opacity: Math.min(1, e * 1.4),
                  transform: `translateY(${dy}px) rotate(${rot}deg) scale(${sc})`,
                  filter: `blur(${sfoca}px)`,
                  color: stile === 'oro' ? '#FFE08A' : stile === 'glitch' ? colore : '#FFFFFF',
                  textShadow: shadow,
                }}
              >
                {lettera}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

// ── Sottotitoli parola per parola (3 alla volta, la parola detta si accende) ──
const Sottotitoli: React.FC<{testo: string; durata: number; colore: string}> = ({testo, durata, colore}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const blocchi = React.useMemo(() => {
    const parole = testo.split(/\s+/);
    // peso = lettere + pausa dopo la punteggiatura
    const pesi = parole.map((p) => p.length + 2 + (/[.?!]$/.test(p) ? 6 : /[,:;]$/.test(p) ? 3 : 0));
    const totale = pesi.reduce((a, b) => a + b, 0);
    const margine = 8;
    const utile = durata - margine * 2;
    let t = margine;
    const tempi = parole.map((p, i) => {
      const da = t;
      t += (pesi[i] / totale) * utile;
      return {testo: p, da: Math.round(da), a: Math.round(t)};
    });
    const gruppi: (typeof tempi)[] = [];
    let g: typeof tempi = [];
    for (const w of tempi) {
      g.push(w);
      if (g.length >= 3 || /[.?!,:]$/.test(w.testo)) {
        gruppi.push(g);
        g = [];
      }
    }
    if (g.length) gruppi.push(g);
    return gruppi;
  }, [testo, durata]);

  const gruppo = blocchi.find((g) => frame >= g[0].da && frame < g[g.length - 1].a);
  if (!gruppo) return null;
  const e = spring({frame: frame - gruppo[0].da, fps, config: {damping: 12, stiffness: 260}});

  return (
    <div style={{...stili.didascalia, transform: `scale(${0.7 + e * 0.3})`, opacity: Math.min(1, e * 2)}}>
      {gruppo.map((w, i) => {
        const attiva = frame >= w.da && frame < w.a;
        return (
          <React.Fragment key={i}>
          {i > 0 ? ' ' : null}
          <span
            style={{
              display: 'inline-block',
              margin: '0 0.08em',
              color: attiva ? colore : '#FFFFFF',
              transform: `scale(${attiva ? 1.08 : 1}) translateY(${attiva ? -4 : 0}px)`,
              textShadow: attiva ? `${stili.didascalia.textShadow}, 0 0 30px ${colore}` : stili.didascalia.textShadow,
            }}
          >
            {w.testo}
          </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── FIGURE in SVG ────────────────────────────────────────────────────────────

/** Pistis Sophia: figura di luce stellare con le braccia alzate. */
const FiguraSophia: React.FC<{luce?: number}> = ({luce = 1}) => {
  const f = useCurrentFrame();
  const onda = Math.sin(f / 14) * 12;
  return (
    <svg viewBox="0 0 400 1000" width="100%" height="100%" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="corpoSophia" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#E6D6FF" />
          <stop offset="100%" stopColor="#7A4DFF" stopOpacity="0.15" />
        </radialGradient>
        <filter id="luceSophia" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10 + 8 * luce} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#luceSophia)" opacity={0.6 + 0.4 * luce}>
        {/* braccia alzate */}
        <path d={`M185 260 C150 210 130 140 ${105 + onda * 0.3} 40`} stroke="url(#corpoSophia)" strokeWidth="22" strokeLinecap="round" fill="none" />
        <path d={`M215 260 C250 210 270 140 ${295 - onda * 0.3} 40`} stroke="url(#corpoSophia)" strokeWidth="22" strokeLinecap="round" fill="none" />
        {/* testa e capelli */}
        <circle cx="200" cy="185" r="44" fill="url(#corpoSophia)" />
        <path d={`M160 190 C150 260 140 330 ${120 + onda} 420 L200 300 L${280 - onda} 420 C260 330 250 260 240 190 Z`} fill="#CDB6FF" opacity="0.55" />
        {/* veste che si dissolve */}
        <path
          d={`M200 230 C168 245 160 310 165 390 C150 530 ${110 + onda} 720 ${50 + onda * 2} 990 L${350 - onda * 2} 990 C${290 - onda} 720 250 530 235 390 C240 310 232 245 200 230 Z`}
          fill="url(#corpoSophia)"
        />
      </g>
      {/* stelle dentro la figura */}
      {new Array(40).fill(0).map((_, i) => (
        <circle
          key={i}
          cx={130 + random(`ss${i}`) * 140 + Math.sin(f / 10 + i) * 4}
          cy={230 + random(`sy${i}`) * 740}
          r={1.5 + random(`sr${i}`) * 3}
          fill="#fff"
          opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 7 + i))}
        />
      ))}
    </svg>
  );
};

/** Yaldabaoth: testa di leone con criniera di fuoco e corpo di serpente. */
const FiguraDemiurgo: React.FC<{ruggito: number; occhi: number}> = ({ruggito, occhi}) => {
  const f = useCurrentFrame();
  const raggi = 34;
  const criniera = new Array(raggi)
    .fill(0)
    .map((_, i) => {
      const a = (i / raggi) * Math.PI * 2;
      const lungo = 230 + Math.sin(f / 4 + i * 1.7) * 25 + ruggito * 60 + (i % 2) * 40;
      const corto = 140;
      const a2 = a + Math.PI / raggi;
      return `${300 + Math.cos(a) * lungo},${300 + Math.sin(a) * lungo} ${300 + Math.cos(a2) * corto},${300 + Math.sin(a2) * corto}`;
    })
    .join(' ');
  // corpo di serpente che ondeggia
  const punti = new Array(9).fill(0).map((_, i) => {
    const y = 470 + i * 150;
    const x = 300 + Math.sin(f / 12 + i * 0.9) * (60 + i * 18);
    return [x, y] as const;
  });
  const corpo = punti.reduce((d, [x, y], i) => (i === 0 ? `M${x} ${y}` : `${d} S${x + 80} ${y - 70} ${x} ${y}`), '');
  const bocca = 20 + ruggito * 70;
  return (
    <svg viewBox="0 0 600 1800" width="100%" height="100%" style={{overflow: 'visible'}}>
      <defs>
        <filter id="fuoco" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="squame" x1="0" x2="1">
          <stop offset="0" stopColor="#1a0505" />
          <stop offset="0.5" stopColor="#5a0f0a" />
          <stop offset="1" stopColor="#1a0505" />
        </linearGradient>
        <radialGradient id="faccia" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#3a0a06" />
          <stop offset="1" stopColor="#070101" />
        </radialGradient>
      </defs>
      {/* corpo di serpente */}
      <path d={corpo} stroke="#ff3a10" strokeWidth="120" fill="none" strokeLinecap="round" opacity="0.35" filter="url(#fuoco)" />
      <path d={corpo} stroke="url(#squame)" strokeWidth="100" fill="none" strokeLinecap="round" />
      <path d={corpo} stroke="#ff5a20" strokeWidth="6" fill="none" strokeDasharray="18 22" opacity="0.6" />
      {/* criniera di fuoco */}
      <polygon points={criniera} fill="#ff4a10" filter="url(#fuoco)" opacity={0.85} />
      <polygon points={criniera} fill="#ffb030" opacity={0.35} transform="translate(300 300) scale(0.8) translate(-300 -300)" />
      {/* muso */}
      <ellipse cx="300" cy="310" rx="150" ry="170" fill="url(#faccia)" stroke="#ff3a10" strokeWidth="4" />
      {/* sopracciglia aggrottate */}
      <path d="M180 215 L285 250 L280 232 Z" fill="#ff3a10" />
      <path d="M420 215 L315 250 L320 232 Z" fill="#ff3a10" />
      {/* muso da leone */}
      <path d="M300 285 C270 285 255 330 250 365 C270 385 330 385 350 365 C345 330 330 285 300 285 Z" fill="#1a0202" stroke="#ff3a10" strokeWidth="3" />
      <path d="M300 385 L300 405" stroke="#ff3a10" strokeWidth="4" />
      {/* fauci che si spalancano sul ruggito, con le zanne */}
      <path d={`M215 405 Q300 ${395 - ruggito * 10} 385 405 L360 ${430 + bocca} Q300 ${450 + bocca * 1.4} 240 ${430 + bocca} Z`} fill="#120000" stroke="#ff3a10" strokeWidth="3" />
      <path d={`M240 ${430 + bocca} Q300 ${450 + bocca * 1.4} 360 ${430 + bocca} Q300 ${420 + bocca * 0.6} 240 ${430 + bocca} Z`} fill="#ff2a00" opacity={0.3 + ruggito * 0.7} filter="url(#fuoco)" />
      {[245, 355].map((x) => (
        <path key={x} d={`M${x - 12} 408 L${x + 12} 408 L${x} ${440 + bocca * 0.5} Z`} fill="#f4e6c8" />
      ))}
      {/* occhi ardenti */}
      {[230, 370].map((cx) => (
        <g key={cx} filter="url(#fuoco)" opacity={occhi}>
          <ellipse cx={cx} cy="260" rx={34} ry={14 + ruggito * 6} fill="#ff2a00" />
          <ellipse cx={cx} cy="260" rx={14} ry={7} fill="#fff4b0" />
        </g>
      ))}
    </svg>
  );
};

/** Arconte: sagoma incappucciata con occhi rossi. */
const FiguraArconte: React.FC<{seme: number}> = ({seme}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 18 + seme) * 14;
  const occhi = 0.6 + 0.4 * Math.abs(Math.sin(f / 9 + seme * 3));
  return (
    <svg viewBox="0 0 200 520" width="100%" height="100%" style={{overflow: 'visible', transform: `translateY(${bob}px)`}}>
      <defs>
        <linearGradient id={`manto${seme}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0b10" />
          <stop offset="1" stopColor="#0b0b10" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M100 0 C40 0 20 60 22 130 L-10 520 L210 520 L178 130 C180 60 160 0 100 0 Z" fill={`url(#manto${seme})`} stroke="#5a1010" strokeWidth="3" />
      <ellipse cx="100" cy="110" rx="52" ry="60" fill="#000" />
      <circle cx="80" cy="110" r="8" fill="#ff2020" opacity={occhi} style={{filter: 'drop-shadow(0 0 10px #ff0000)'}} />
      <circle cx="120" cy="110" r="8" fill="#ff2020" opacity={occhi} style={{filter: 'drop-shadow(0 0 10px #ff0000)'}} />
    </svg>
  );
};

/** Corpo umano di materia oscura, con la scintilla nel petto. */
const FiguraUomo: React.FC<{formazione: number; scintilla: number}> = ({formazione, scintilla}) => {
  const f = useCurrentFrame();
  const battito = 0.8 + 0.2 * Math.sin(f / 6);
  return (
    <svg viewBox="0 0 400 1000" width="100%" height="100%" style={{overflow: 'visible'}}>
      <defs>
        <filter id="bordoViola" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="scintilla">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.25" stopColor="#FFE08A" />
          <stop offset="0.6" stopColor="#FFB020" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FF8000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity={formazione} filter="url(#bordoViola)">
        <circle cx="200" cy="110" r="62" fill="#07040c" stroke="#8a5cff" strokeWidth="3" />
        <path
          d="M200 180 C140 180 110 200 100 260 L60 520 L95 530 L135 320 L140 560 L120 960 L185 960 L200 620 L215 960 L280 960 L260 560 L265 320 L305 530 L340 520 L300 260 C290 200 260 180 200 180 Z"
          fill="#07040c"
          stroke="#8a5cff"
          strokeWidth="3"
        />
      </g>
      {/* raggi della scintilla */}
      <g opacity={scintilla} transform={`rotate(${f * 0.8} 200 300)`}>
        {new Array(12).fill(0).map((_, i) => (
          <rect key={i} x="197" y={300 - 260 * scintilla} width="6" height={260 * scintilla} fill="#FFD25A" opacity="0.35" transform={`rotate(${i * 30} 200 300)`} />
        ))}
      </g>
      <circle cx="200" cy="300" r={120 * scintilla * battito} fill="url(#scintilla)" />
      <circle cx="200" cy="300" r={14 * scintilla} fill="#fff" />
    </svg>
  );
};

/** Persona in meditazione che si illumina dal cuore. */
const FiguraMeditante: React.FC<{luce: number}> = ({luce}) => {
  const f = useCurrentFrame();
  return (
    <svg viewBox="0 0 600 700" width="100%" height="100%" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="aura">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.3" stopColor="#FFF1C9" stopOpacity="0.8" />
          <stop offset="1" stopColor="#B49CFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="330" r={180 + luce * 260 + Math.sin(f / 6) * 10} fill="url(#aura)" opacity={0.3 + luce * 0.7} />
      <g fill="#0a0812" stroke={`rgba(255,240,200,${0.3 + luce * 0.7})`} strokeWidth="4">
        <circle cx="300" cy="150" r="58" />
        <path d="M300 215 C230 215 200 250 190 330 L170 470 C120 490 60 520 60 570 C60 610 140 620 300 620 C460 620 540 610 540 570 C540 520 480 490 430 470 L410 330 C400 250 370 215 300 215 Z" />
      </g>
      <circle cx="300" cy="320" r={10 + luce * 40} fill="#fff" style={{filter: `drop-shadow(0 0 ${20 + luce * 60}px #fff)`}} />
    </svg>
  );
};

/** Sbarre della gabbia che cadono a scatto. */
const Sbarre: React.FC<{colore: string}> = ({colore}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = 9;
  return (
    <AbsoluteFill>
      {new Array(n).fill(0).map((_, i) => {
        const e = spring({frame: f - i * 3, fps, config: {damping: 12, stiffness: 200}});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 40 + (i * (W - 80)) / (n - 1) - 9,
              top: 0,
              width: 18,
              height: H,
              background: `linear-gradient(90deg, rgba(0,0,0,0), ${colore}, rgba(0,0,0,0))`,
              boxShadow: `0 0 30px ${colore}`,
              transform: `translateY(${(1 - e) * -H}px)`,
              opacity: 0.75,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Pioggia animata. */
const Pioggia: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.35}}>
      <svg width={W} height={H}>
        {new Array(120).fill(0).map((_, i) => {
          const x = random(`px${i}`) * W;
          const y = ((random(`py${i}`) * H + f * 55 * (0.8 + random(`pv${i}`) * 0.5)) % (H + 100)) - 100;
          return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 70} stroke="#cfd8e6" strokeWidth="2" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ── SEQUENZA 1 · Il Pleroma e l'Illusione (0-450) ────────────────────────────
const ScenaPleroma: React.FC = () => {
  const f = useCurrentFrame();
  const sc = scossa(f, [262, 268, 274], 30, 6);
  return (
    <AbsoluteFill style={{backgroundColor: '#000', transform: `translate(${sc.x}px, ${sc.y}px)`}}>
      <Sequence durationInFrames={130} name="1a · dentro la luce">
        <Sfondo src={IMMAGINI.pleroma} mossa={{s: [2.8, 1.9], r: [0, 12]}} filtro="brightness(0.75) contrast(1.15) saturate(1.3)" />
        <Particelle colore="#FFF4D0" moto="verso" seme="p1" dimensione={7} velocita={1.6} />
      </Sequence>
      <Sequence from={130} durationInFrames={130} name="1b · zoom indietro">
        <Sfondo src={IMMAGINI.pleroma} mossa={{s: [1.7, 1.12], r: [-6, 0]}} />
        <Particelle colore="#E8D8FF" moto="su" seme="p2" />
      </Sequence>
      <Sequence from={250} durationInFrames={200} name="1c · la gabbia">
        <Sfondo src={IMMAGINI.gabbia} mossa={{s: [1.7, 1.0], y: [-3, 0]}} />
        <Sequence from={10}>
          <Sbarre colore="#5CFFE0" />
        </Sequence>
        <Particelle colore="#7CFFE8" moto="giu" seme="p3" dimensione={5} />
      </Sequence>
      <Lampi frames={[130]} />
      <Lampi frames={[250]} colore="#7CFFE8" forza={1} />
      <Vignetta />
      <TitoloCinetico testo="La gabbia cosmica" stile="luce" colore="rgba(170,230,255,0.95)" dimensione={128} inizio={12} sali={110} />
    </AbsoluteFill>
  );
};

// ── SEQUENZA 2 · La Caduta di Sophia (450-1050) ──────────────────────────────
const ScenaSophia: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence durationInFrames={200} name="2a · Sophia sale verso la luce">
        <Sfondo src={IMMAGINI.nebulosa} mossa={{s: [1.35, 1.15], y: [6, -3]}} />
        <Particelle colore="#E2D2FF" moto="su" seme="s1" />
        <AbsoluteFill style={{left: 290, top: tra(f, 0, 200, 1050, 820), width: 500, height: 1250}}>
          <FiguraSophia luce={tra(f, 0, 200, 0.4, 1)} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={200} durationInFrames={130} name="2b · primo piano, rotazione">
        <AbsoluteFill style={{transform: `rotate(${tra(f, 200, 330, -3, 4)}deg)`}}>
          <Sfondo src={IMMAGINI.nebulosa} mossa={{s: [1.9, 1.6], origine: '50% 15%'}} />
          <AbsoluteFill style={{left: 140, top: tra(f, 200, 330, 520, 380), width: 800, height: 2000}}>
            <FiguraSophia luce={1} />
          </AbsoluteFill>
          <Particelle colore="#FFFFFF" moto="verso" seme="s2" velocita={1.4} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={330} durationInFrames={270} name="2c · la caduta nel Caos">
        {(() => {
          const l = f - 330;
          const caduta = spring({frame: l, fps, config: {damping: 30, stiffness: 18}});
          return (
            <AbsoluteFill>
              {/* panoramica continua verso il basso + rotazione */}
              <Sfondo src={IMMAGINI.abisso} mossa={{s: [1.5, 1.8], r: [0, 140], y: [8, -6]}} />
              <Particelle colore="#C9A8FF" moto="risucchio" seme="s3" velocita={1.8} />
              <AbsoluteFill
                style={{
                  left: 340,
                  top: interpolate(caduta, [0, 1], [-200, 760]),
                  width: 400,
                  height: 1000,
                  transform: `rotate(${caduta * 620}deg) scale(${interpolate(caduta, [0, 1], [1.1, 0.12])})`,
                  opacity: interpolate(l, [200, 260], [1, 0], CL),
                }}
              >
                <FiguraSophia luce={1 - caduta * 0.5} />
              </AbsoluteFill>
              <AbsoluteFill style={{backgroundColor: '#05000f', opacity: tra(l, 120, 270, 0, 0.5)}} />
            </AbsoluteFill>
          );
        })()}
      </Sequence>
      <Lampi frames={[200]} colore="#F0E6FF" />
      <Lampi frames={[330]} colore="#B18CFF" forza={1} />
      <Vignetta forza={0.8} />
      <TitoloCinetico testo="Pistis Sophia" stile="elegante" colore="rgba(190,160,255,0.95)" dimensione={124} inizio={14} sali={120} />
    </AbsoluteFill>
  );
};

// ── SEQUENZA 3 · Il Demiurgo e gli Arconti (1050-1650) ───────────────────────
/** Frame locali dei ruggiti: il primo su "urlò nel vuoto: Io sono l'unico Dio". */
const RUGGITI = [262, 380];

const ScenaDemiurgo: React.FC = () => {
  const f = useCurrentFrame();
  const sc = scossa(f, RUGGITI, 55, 14);
  const ruggito = sc.k;
  const occhi = tra(f, 50, 70, 0, 1);
  return (
    <AbsoluteFill style={{backgroundColor: '#000', transform: `translate(${sc.x}px, ${sc.y}px) scale(${1.04 + ruggito * 0.06})`}}>
      <Sequence durationInFrames={220} name="3a · il Demiurgo emerge">
        <Sfondo src={IMMAGINI.caos} mossa={{s: [1.1, 1.3]}} />
        <Particelle colore="#FF6A20" moto="su" seme="d1" dimensione={6} velocita={1.5} />
        <AbsoluteFill
          style={{
            left: 140,
            top: tra(f, 0, 220, 600, 420),
            width: 800,
            height: 2400,
            opacity: tra(f, 0, 50, 0, 1),
            transform: `scale(${tra(f, 0, 220, 0.85, 1.05)})`,
          }}
        >
          <FiguraDemiurgo ruggito={0} occhi={occhi} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={220} durationInFrames={200} name="3b · il ruggito">
        <Sfondo src={IMMAGINI.caos} mossa={{s: [1.5, 1.7], origine: '50% 30%'}} filtro="saturate(1.3)" />
        <AbsoluteFill style={{left: -60, top: 260, width: 1200, height: 3600}}>
          <FiguraDemiurgo ruggito={ruggito} occhi={1} />
        </AbsoluteFill>
        <Particelle colore="#FF3A10" moto="verso" seme="d2" velocita={2} />
      </Sequence>
      <Sequence from={420} durationInFrames={180} name="3c · gli Arconti">
        <Sfondo src={IMMAGINI.caos} mossa={{s: [1.3, 1.15]}} filtro="brightness(0.45) saturate(0.8)" />
        <AbsoluteFill style={{left: 390, top: 330, width: 300, height: 900, opacity: 0.55}}>
          <FiguraDemiurgo ruggito={0} occhi={1} />
        </AbsoluteFill>
        {[
          [60, 760, 1.0],
          [810, 760, 1.0],
          [300, 900, 1.3],
          [580, 900, 1.3],
          [-40, 1050, 1.6],
          [800, 1050, 1.6],
        ].map(([x, y, s], i) => {
          const e = tra(f, 420 + i * 8, 450 + i * 8, 0, 1);
          return (
            <AbsoluteFill key={i} style={{left: x, top: y + (1 - e) * 200, width: 260 * s, height: 680 * s, opacity: e}}>
              <FiguraArconte seme={i} />
            </AbsoluteFill>
          );
        })}
      </Sequence>
      <AbsoluteFill style={{backgroundColor: '#ff0000', mixBlendMode: 'overlay', opacity: ruggito * 0.7}} />
      <Lampi frames={[60]} colore="#ff3000" forza={0.5} />
      <Lampi frames={[220, 420]} colore="#ff2a00" />
      <Vignetta forza={0.9} />
      <TitoloCinetico testo="Il Demiurgo" stile="glitch" colore="#E3001B" dimensione={150} inizio={20} sali={120} />
    </AbsoluteFill>
  );
};

// ── SEQUENZA 4 · La Creazione dell'Uomo e la Scintilla (1650-2400) ───────────
const ScenaScintilla: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const accensione = spring({frame: f - 320, fps, config: {damping: 14, stiffness: 60}});
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence durationInFrames={300} name="4a · gli Arconti plasmano il corpo">
        <Sfondo src={IMMAGINI.abisso} mossa={{s: [1.2, 1.35], r: [0, 20]}} filtro="grayscale(0.6) brightness(0.35)" />
        <Particelle colore="#3a2a5a" moto="risucchio" seme="u1" n={110} dimensione={10} velocita={1.3} />
        <AbsoluteFill style={{left: 290, top: 380, width: 500, height: 1250}}>
          <FiguraUomo formazione={tra(f, 20, 260, 0, 1)} scintilla={0} />
        </AbsoluteFill>
        {[
          {x: -120, specchio: false},
          {x: 760, specchio: true},
        ].map(({x, specchio}, i) => (
          <AbsoluteFill
            key={i}
            style={{left: x, top: 520, width: 440, height: 1150, transform: `${specchio ? 'scaleX(-1) ' : ''}rotate(${8 + Math.sin(f / 20) * 3}deg)`}}
          >
            <FiguraArconte seme={i + 10} />
          </AbsoluteFill>
        ))}
      </Sequence>
      <Sequence from={300} durationInFrames={180} name="4b · la scintilla si accende">
        <AbsoluteFill style={{transform: `scale(${tra(f, 300, 480, 1, 2.6, Easing.in(Easing.cubic))})`, transformOrigin: '50% 39%'}}>
          <Sfondo src={IMMAGINI.abisso} mossa={{s: [1.35, 1.4]}} filtro="grayscale(0.6) brightness(0.3)" />
          <AbsoluteFill style={{left: 290, top: 380, width: 500, height: 1250}}>
            <FiguraUomo formazione={1} scintilla={accensione} />
          </AbsoluteFill>
          <Particelle colore="#FFD25A" moto="verso" seme="u2" opacita={accensione} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={480} durationInFrames={270} name="4c · dentro la scintilla">
        <Sfondo src={IMMAGINI.oro} mossa={{s: [1.1, 2.4], r: [0, -15]}} />
        <Particelle colore="#FFE08A" moto="verso" seme="u3" velocita={1.8} />
      </Sequence>
      <Lampi frames={[300]} colore="#8a5cff" forza={0.5} />
      <Lampi frames={[322]} colore="#FFD25A" forza={0.9} />
      <Lampi frames={[480]} colore="#FFE9A8" forza={1} />
      <Vignetta forza={0.85} />
      <TitoloCinetico testo="La scintilla divina" stile="oro" colore="rgba(255,185,40,0.95)" dimensione={116} inizio={18} sali={110} />
    </AbsoluteFill>
  );
};

// ── SEQUENZA 5 · La Trappola della Reincarnazione (2400-3000) ────────────────
const ScenaCiclo: React.FC = () => {
  const f = useCurrentFrame();
  // Verso la fine il tunnel "si guasta": è la trappola degli Arconti.
  const glitch = tra(f, 520, 540, 0, 1) * (random(`c5${Math.floor(f / 2)}`) > 0.4 ? 1 : 0.3);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence durationInFrames={170} name="5a · la città">
        <Sfondo src={IMMAGINI.citta} mossa={{s: [1.15, 1.3], y: [2, -2]}} filtro="saturate(0.7) contrast(1.1)" />
        <Pioggia />
      </Sequence>
      <Sequence from={170} durationInFrames={170} name="5b · la città da vicino">
        <Sfondo src={IMMAGINI.citta} mossa={{s: [1.8, 2.0], x: [-6, 4], origine: '50% 45%'}} filtro="saturate(0.7) contrast(1.15)" />
        <Pioggia />
        <AbsoluteFill style={{backgroundColor: '#ff0000', mixBlendMode: 'overlay', opacity: 0.15 + 0.15 * Math.sin(f / 4)}} />
      </Sequence>
      {/* Dissolvenza incrociata città → tunnel di luce (su "Quando muori...") */}
      <Sequence from={310} durationInFrames={290} name="5c · il tunnel di luce">
        <AbsoluteFill style={{opacity: tra(f, 310, 350, 0, 1)}}>
          <Sfondo src={IMMAGINI.tunnel} mossa={{s: [1.0, 2.6], r: [0, 45]}} filtro={`hue-rotate(${glitch * 160}deg) saturate(${1 + glitch * 2})`} />
          <Particelle colore="#FFFFFF" moto="verso" seme="c3" velocita={2.2} />
        </AbsoluteFill>
      </Sequence>
      <Lampi frames={[170]} colore="#ff2a2a" forza={0.5} />
      <AbsoluteFill style={{backgroundColor: '#00ff66', mixBlendMode: 'overlay', opacity: glitch * 0.35}} />
      <Vignetta forza={0.8} />
      <TitoloCinetico testo="Il ciclo infinito" stile="pulsa" colore="rgba(120,200,255,0.95)" dimensione={124} inizio={14} sali={110} />
    </AbsoluteFill>
  );
};

// ── SEQUENZA 6 · La Gnosi e il Risveglio (3000-3600) ─────────────────────────
/** Frame locale della rottura del vetro (su "Il velo si sta strappando"). */
const ROTTURA = 400;

const SCHEGGE: {poligono: string; dx: number; dy: number; rot: number}[] = [
  {poligono: '0% 0%, 55% 0%, 48% 40%', dx: -40, dy: -70, rot: -25},
  {poligono: '55% 0%, 100% 0%, 100% 30%, 48% 40%', dx: 60, dy: -60, rot: 30},
  {poligono: '100% 30%, 100% 70%, 52% 47%, 48% 40%', dx: 80, dy: 5, rot: 18},
  {poligono: '100% 70%, 100% 100%, 60% 100%, 52% 47%', dx: 60, dy: 70, rot: -20},
  {poligono: '60% 100%, 20% 100%, 52% 47%', dx: -5, dy: 85, rot: 12},
  {poligono: '20% 100%, 0% 100%, 0% 62%, 52% 47%', dx: -70, dy: 60, rot: 26},
  {poligono: '0% 62%, 0% 25%, 48% 40%, 52% 47%', dx: -85, dy: 0, rot: -15},
  {poligono: '0% 25%, 0% 0%, 48% 40%', dx: -60, dy: -40, rot: 35},
];

/** La realtà prima della rottura (riusata dentro ogni scheggia). */
const RealtaPrima: React.FC<{f: number; luce: number; zoom: number}> = ({f, luce, zoom}) => (
  <AbsoluteFill style={{transform: `scale(${zoom})`}}>
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(IMMAGINI.citta)}
        style={{width: '100%', height: '100%', objectFit: 'cover', filter: `brightness(${0.35 + luce * 0.3}) saturate(0.5)`, transform: `scale(${1.2 + f * 0.0005})`}}
      />
    </AbsoluteFill>
    <AbsoluteFill style={{left: 140, top: 560, width: 800, height: 930}}>
      <FiguraMeditante luce={luce} />
    </AbsoluteFill>
    {/* crepe che si allargano dal cuore */}
    <svg width={W} height={H} style={{position: 'absolute'}}>
      {new Array(10).fill(0).map((_, i) => {
        const ang = (i / 10) * Math.PI * 2 + random(`cr${i}`);
        const lung = tra(f, 280 + i * 6, ROTTURA, 0, 900 + random(`cl${i}`) * 500);
        const mx = 540 + Math.cos(ang + 0.2) * lung * 0.5;
        const my = 990 + Math.sin(ang + 0.2) * lung * 0.5;
        return (
          <polyline
            key={i}
            points={`540,990 ${mx},${my} ${540 + Math.cos(ang) * lung},${990 + Math.sin(ang) * lung}`}
            stroke="#fff"
            strokeWidth="4"
            fill="none"
            style={{filter: 'drop-shadow(0 0 8px #fff)'}}
          />
        );
      })}
    </svg>
  </AbsoluteFill>
);

const ScenaRisveglio: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Zoom in veloce all'inizio, poi lento fino alla rottura.
  const zoom = 1 + spring({frame: f, fps, config: {damping: 16, stiffness: 50}}) * 0.25 + tra(f, 0, ROTTURA, 0, 0.25, Easing.in(Easing.quad));
  const luce = tra(f, 0, ROTTURA, 0.1, 1, Easing.in(Easing.quad));
  const dopo = f - ROTTURA;
  const rotto = dopo >= 0;
  const esplosione = rotto ? spring({frame: dopo, fps, config: {damping: 30, stiffness: 45}}) : 0;
  const sc = scossa(f, [ROTTURA], 80, 12);

  return (
    <AbsoluteFill style={{backgroundColor: '#000', transform: `translate(${sc.x}px, ${sc.y}px) scale(1.08)`}}>
      {/* Dietro al vetro: pura luce. */}
      <Sequence from={ROTTURA - 5} name="6b · oltre il velo">
        <Sfondo src={IMMAGINI.luce} mossa={{s: [1.7, 1.3], r: [0, 12]}} filtro="brightness(0.85) contrast(1.2) saturate(1.6)" />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 22% at 50% 42%, rgba(20,5,40,0.75), rgba(20,5,40,0) 100%)'}} />
        <Particelle colore="#FFF6DD" moto="verso" seme="r2" velocita={2.4} n={90} />
      </Sequence>
      <Sequence durationInFrames={ROTTURA + 120} name="6a · meditazione e rottura">
        {!rotto ? (
          <>
            <RealtaPrima f={f} luce={luce} zoom={zoom} />
            <Particelle colore="#FFE9B0" moto="su" seme="r1" opacita={luce} />
          </>
        ) : (
          SCHEGGE.map((s, i) => (
            <AbsoluteFill
              key={i}
              style={{
                clipPath: `polygon(${s.poligono})`,
                transform: `translate(${s.dx * esplosione * 14}px, ${s.dy * esplosione * 14}px) rotate(${s.rot * esplosione}deg) scale(${1 + esplosione * 0.4})`,
                opacity: 1 - esplosione,
              }}
            >
              <RealtaPrima f={ROTTURA} luce={1} zoom={zoom} />
            </AbsoluteFill>
          ))
        )}
      </Sequence>
      <Lampi frames={[ROTTURA]} forza={1} />
      <Vignetta forza={0.5 * (1 - esplosione)} />
      {/* SVEGLIATI: vibra in alto, poi esplode al centro alla rottura */}
      {rotto ? (
        <TitoloCinetico key="centro" testo="Svegliati" stile="vibra" colore="rgba(255,255,255,0.95)" dimensione={160} inizio={ROTTURA} sali={null} />
      ) : (
        <TitoloCinetico key="alto" testo="Svegliati" stile="vibra" colore="rgba(255,255,255,0.95)" dimensione={120} inizio={30} sali={95} />
      )}
    </AbsoluteFill>
  );
};

// ── Composizione principale ──────────────────────────────────────────────────
const elenco: {chiave: keyof typeof SCENE; nome: string; Componente: React.FC}[] = [
  {chiave: 'pleroma', nome: "1 · Il Pleroma e l'Illusione", Componente: ScenaPleroma},
  {chiave: 'sophia', nome: '2 · La Caduta di Sophia', Componente: ScenaSophia},
  {chiave: 'demiurgo', nome: '3 · Il Demiurgo e gli Arconti', Componente: ScenaDemiurgo},
  {chiave: 'scintilla', nome: "4 · La Creazione dell'Uomo", Componente: ScenaScintilla},
  {chiave: 'ciclo', nome: '5 · La Trappola della Reincarnazione', Componente: ScenaCiclo},
  {chiave: 'risveglio', nome: '6 · La Gnosi e il Risveglio', Componente: ScenaRisveglio},
];

export const PistisSophiaVideo: React.FC<PistisSophiaProps> = ({voce, musica, volumeMusica = 0.18, sottotitoli = true}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    {elenco.map(({chiave, nome, Componente}, i) => {
      const s = SCENE[chiave];
      return (
        <Sequence key={chiave} name={nome} from={s.from} durationInFrames={s.durata}>
          <Componente />
          {sottotitoli && <Sottotitoli testo={s.testoVoce} durata={s.durata} colore={s.colore} />}
          <Dissolvenza durata={s.durata} entrata={i === 0 ? 12 : 4} uscita={i === elenco.length - 1 ? 20 : 4} />
        </Sequence>
      );
    })}
    <Grana />

    {/* ▼ AUDIO: metti i file in public/pistis/ e passali come props. ▼ */}
    {voce ? <Audio src={staticFile(voce)} volume={1} /> : null}
    {musica ? <Audio src={staticFile(musica)} volume={volumeMusica} /> : null}
  </AbsoluteFill>
);
