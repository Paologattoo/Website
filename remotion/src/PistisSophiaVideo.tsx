/**
 * PistisSophiaVideo – video verticale 1080x1920, 30 fps, 3600 frame (120 s).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DOVE METTERE LE TUE IMMAGINI
 *   Metti i file in `remotion/public/pistis/` con questi nomi (sostituisci i
 *   segnaposto già presenti). Formato consigliato: verticale, almeno 1440x2560,
 *   così gli zoom e le panoramiche non sgranano.
 *     scene1.jpg   – il Pleroma (universo frattale di luce)
 *     scene1b.jpg  – la griglia / gabbia digitale (il Pleroma sfuma in questa)
 *     scene2.jpg   – Pistis Sophia che precipita nell'abisso (meglio se molto alta)
 *     scene3.jpg   – Yaldabaoth con gli Arconti
 *     scene4.jpg   – gli Arconti che plasmano l'uomo; la scintilla nel petto
 *                    deve stare circa al centro, un po' sopra (vedi SPARK_ORIGIN)
 *     scene5.jpg   – la città oscura
 *     scene5b.jpg  – il tunnel di luce (dissolvenza incrociata dalla città)
 *     scene6.jpg   – la persona in meditazione che si illumina
 *   Per cambiare nomi o percorsi modifica l'oggetto `IMMAGINI` qui sotto.
 *
 * DOVE METTERE LA VOCE (E LA MUSICA)
 *   Metti la traccia in `remotion/public/pistis/` (es. `voce.mp3`) e passala
 *   come prop `voce: "pistis/voce.mp3"` (vedi defaultProps in Root.tsx, oppure
 *   `--props` dalla riga di comando). Stessa cosa per `musica`.
 *   La voce deve partire al frame 0 e seguire i tempi delle sequenze qui sotto.
 *   I sottotitoli sono distribuiti in modo proporzionale alla lunghezza del
 *   testo: quando hai la voce vera, trascrivila (es. `python3 trascrivi.py`
 *   oppure `whisper-cli`) e sostituisci `testoVoce` con i tempi reali se vuoi
 *   una sincronia perfetta.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/cinzel/700.css';

// ── Impostazioni generali ────────────────────────────────────────────────────
export const PS_FPS = 30;
export const PS_DURATA = 3600; // 120 s
export const PS_LARGHEZZA = 1080;
export const PS_ALTEZZA = 1920;

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

// ▼▼▼ INSERISCI QUI LE TUE IMMAGINI (percorsi relativi a remotion/public/) ▼▼▼
const IMMAGINI = {
  pleroma: 'pistis/scene1.jpg',
  gabbia: 'pistis/scene1b.jpg',
  sophia: 'pistis/scene2.jpg',
  demiurgo: 'pistis/scene3.jpg',
  scintilla: 'pistis/scene4.jpg',
  citta: 'pistis/scene5.jpg',
  tunnel: 'pistis/scene5b.jpg',
  risveglio: 'pistis/scene6.jpg',
};
// ▲▲▲────────────────────────────────────────────────────────────────────▲▲▲

/** Punto (in % dell'immagine) dove si trova la scintilla nel petto (scena 4). */
const SPARK_ORIGIN = '50% 42%';
/** Frame locale della scena 6 in cui il vetro si rompe. */
const ROTTURA = 390;
/** Frame di dissolvenza al nero all'inizio e alla fine di ogni sequenza. */
const DISSOLVENZA = 12;

// ── Timeline esatta ──────────────────────────────────────────────────────────
type Scena = {from: number; durata: number; testoVoce: string};

const SCENE = {
  pleroma: {
    from: 0,
    durata: 450,
    testoVoce:
      "Guarda il mondo intorno a te. E se ti dicessero che tutto ciò che tocchi, vedi e ami è solo una simulazione, una gabbia cosmica progettata per tenerti prigioniero? Tu non appartieni a questo piano materiale. Tu provieni dal Pleroma, il regno della pura Luce infinita.",
  },
  sophia: {
    from: 450,
    durata: 600,
    testoVoce:
      "Tutto è iniziato con un'emanazione divina chiamata Pistis Sophia, la Saggezza. Desiderosa di comprendere il mistero assoluto del Creatore senza il Suo consenso, generò un'anomalia. Questo errore cosmico la fece precipitare dal paradiso direttamente nelle profondità oscure del Caos.",
  },
  demiurgo: {
    from: 1050,
    durata: 600,
    testoVoce:
      "Da questo errore è nato Yaldabaoth, il Demiurgo. Una mostruosità con il corpo di serpente e la testa di leone. Cieco, arrogante e folle, urlò nel vuoto: 'Io sono l'unico Dio'. Iniziò a generare gli Arconti, parassiti dimensionali al suo servizio.",
  },
  scintilla: {
    from: 1650,
    durata: 750,
    testoVoce:
      "Gli Arconti non possono creare la vita vera, possono solo imitare. Hanno forgiato questo universo materiale e il corpo umano, usandolo come una prigione di carne. Ma a loro insaputa, una scintilla della luce divina di Sophia è rimasta intrappolata dentro di te. Sei un dio frammentato, chiuso in una cella biologica.",
  },
  ciclo: {
    from: 2400,
    durata: 600,
    testoVoce:
      "Questi esseri si nutrono delle tue emozioni a bassa frequenza: paura, dolore, rabbia. Hanno costruito la società e il ciclo delle reincarnazioni come un sistema di raccolta energetica. Quando muori, quella luce bianca che vedi è un inganno degli Arconti per cancellare la tua memoria e rimandarti nella Matrix.",
  },
  risveglio: {
    from: 3000,
    durata: 600,
    testoVoce:
      "Ma c'è una via d'uscita. Pistis Sophia si è pentita e ha inviato la 'Gnosi', la conoscenza segreta. La salvezza non arriva pregando i falsi dèi, ma ricordando chi sei veramente. Il velo si sta strappando. Tu... sei pronto a uscire dalla Matrix?",
  },
} satisfies Record<string, Scena>;

// ── Stili testo (CSS-in-JS) ──────────────────────────────────────────────────
const stili = {
  titoloBase: {
    position: 'absolute',
    left: 60,
    right: 60,
    textAlign: 'center',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 900,
    lineHeight: 1.02,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    // Ombra scura sotto + alone: leggibile anche su fondi chiari.
    textShadow: '0 6px 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9)',
  },
  bagliore: (colore: string, forza = 1): React.CSSProperties => ({
    color: '#FFFFFF',
    textShadow: [
      '0 6px 18px rgba(0,0,0,0.9)',
      '0 0 3px rgba(0,0,0,0.9)',
      `0 0 ${18 * forza}px ${colore}`,
      `0 0 ${42 * forza}px ${colore}`,
      `0 0 ${90 * forza}px ${colore}`,
    ].join(', '),
  }),
  didascalia: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: 330, // sopra la zona dei pulsanti di Reels/TikTok
    textAlign: 'center',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 58,
    lineHeight: 1.2,
    color: '#FFFFFF',
    WebkitTextStroke: '2px rgba(0,0,0,0.65)',
    paintOrder: 'stroke fill',
    textShadow: '0 4px 0 rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.9), 0 0 2px #000',
  },
} satisfies Record<string, React.CSSProperties | ((...a: never[]) => React.CSSProperties)>;

// ── Componenti di base ───────────────────────────────────────────────────────

/** Immagine a tutto schermo con trasformazione CSS libera. */
const Sfondo: React.FC<{src: string; style?: React.CSSProperties}> = ({src, style}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img
      src={staticFile(src)}
      style={{width: '100%', height: '100%', objectFit: 'cover', ...style}}
    />
  </AbsoluteFill>
);

/** Vignettatura per dare profondità e far risaltare il testo. */
const Vignetta: React.FC<{forza?: number}> = ({forza = 0.75}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${forza}) 100%)`,
    }}
  />
);

/** Dissolvenza dal/al nero ai bordi di ogni sequenza. */
const Dissolvenza: React.FC<{durata: number}> = ({durata}) => {
  const f = useCurrentFrame();
  const opacita = interpolate(
    f,
    [0, DISSOLVENZA, durata - DISSOLVENZA, durata],
    [1, 0, 0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return <AbsoluteFill style={{backgroundColor: '#000', opacity: opacita}} />;
};

/**
 * Sottotitoli: divide il testo in blocchi da ~5 parole e li distribuisce sulla
 * durata della scena in proporzione al numero di caratteri.
 * Sostituisci con tempi reali (da trascrizione) per sincronia perfetta.
 */
const Sottotitoli: React.FC<{testo: string; durata: number}> = ({testo, durata}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const blocchi = React.useMemo(() => {
    const parole = testo.split(/\s+/);
    const out: string[] = [];
    let corrente: string[] = [];
    for (const p of parole) {
      corrente.push(p);
      const fineFrase = /[.?!:]$/.test(p);
      if (corrente.length >= 5 || (fineFrase && corrente.length >= 2)) {
        out.push(corrente.join(' '));
        corrente = [];
      }
    }
    if (corrente.length) out.push(corrente.join(' '));
    // Tempi proporzionali ai caratteri, lasciando un po' di respiro ai bordi.
    const margine = 10;
    const utile = durata - margine * 2;
    const totale = out.reduce((s, b) => s + b.length, 0);
    let t = margine;
    return out.map((b) => {
      const d = (b.length / totale) * utile;
      const blocco = {testo: b, da: Math.round(t), a: Math.round(t + d)};
      t += d;
      return blocco;
    });
  }, [testo, durata]);

  const attivo = blocchi.find((b) => frame >= b.da && frame < b.a);
  if (!attivo) return null;

  const entrata = spring({frame: frame - attivo.da, fps, config: {damping: 14, stiffness: 220}});
  return (
    <div
      style={{
        ...stili.didascalia,
        opacity: entrata,
        transform: `translateY(${(1 - entrata) * 30}px) scale(${0.9 + entrata * 0.1})`,
      }}
    >
      {attivo.testo}
    </div>
  );
};

// ── SEQUENZA 1 · Il Pleroma e l'Illusione (0-450) ────────────────────────────
const ScenaPleroma: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d, fps} = useVideoConfig();
  // Zoom out lento dalla luce verso la gabbia.
  const scala = interpolate(f, [0, d], [1.7, 1.0], {easing: Easing.out(Easing.cubic)});
  // La gabbia compare da metà scena.
  const gabbia = interpolate(f, [d * 0.4, d * 0.85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titolo = spring({frame: f - 20, fps, config: {damping: 200}, durationInFrames: 50});
  const pulsazione = 1 + Math.sin(f / 12) * 0.15;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sfondo src={IMMAGINI.pleroma} style={{transform: `scale(${scala})`}} />
      <AbsoluteFill style={{opacity: gabbia}}>
        <Sfondo src={IMMAGINI.gabbia} style={{transform: `scale(${scala * 1.05})`}} />
      </AbsoluteFill>
      <Vignetta />
      <div
        style={{
          ...stili.titoloBase,
          ...stili.bagliore('rgba(190,220,255,0.95)', pulsazione),
          top: '40%',
          fontSize: 132,
          opacity: titolo,
          transform: `scale(${0.85 + titolo * 0.15})`,
          letterSpacing: `${0.25 - titolo * 0.2}em`,
        }}
      >
        La gabbia cosmica
      </div>
    </AbsoluteFill>
  );
};

// ── SEQUENZA 2 · La Caduta di Sophia (450-1050) ──────────────────────────────
const ScenaSophia: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  // Panoramica continua verso il basso: l'immagine sale.
  const y = interpolate(f, [0, d], [14, -14], {easing: Easing.inOut(Easing.sin)});
  const rotazione = interpolate(f, [0, d], [-2, 5]);
  const titolo = interpolate(f, [30, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // Verso la fine (la caduta nel Caos) l'immagine si scurisce.
  const buio = interpolate(f, [d * 0.6, d], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sfondo
        src={IMMAGINI.sophia}
        style={{transform: `scale(1.45) translateY(${y}%) rotate(${rotazione}deg)`}}
      />
      <AbsoluteFill style={{backgroundColor: '#05000f', opacity: buio}} />
      <Vignetta forza={0.8} />
      <div
        style={{
          ...stili.titoloBase,
          ...stili.bagliore('rgba(170,150,255,0.9)', 0.8),
          top: '17%',
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: 120,
          letterSpacing: `${0.3 - titolo * 0.12}em`,
          opacity: titolo,
          transform: `translateY(${(1 - titolo) * -30}px)`,
        }}
      >
        Pistis Sophia
      </div>
    </AbsoluteFill>
  );
};

// ── SEQUENZA 3 · Il Demiurgo e gli Arconti (1050-1650) ───────────────────────
/** Frame locali dei "ruggiti" (scossa + pulsazione). Il primo è su "urlò nel vuoto". */
const RUGGITI = [20, 330];

const ScenaDemiurgo: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d, fps} = useVideoConfig();
  const scalaLenta = interpolate(f, [0, d], [1.0, 1.25]);

  // Intensità del ruggito: sale di colpo e si smorza.
  const ruggito = RUGGITI.reduce((max, r) => {
    if (f < r) return max;
    const decadimento = Math.exp(-(f - r) / 14);
    return Math.max(max, decadimento);
  }, 0);
  const scossaX = (random(`dx${f}`) - 0.5) * 50 * ruggito;
  const scossaY = (random(`dy${f}`) - 0.5) * 50 * ruggito;
  const pulsa = 1 + ruggito * 0.08;

  const entrata = spring({frame: f - 25, fps, config: {damping: 9, stiffness: 160}});
  // Glitch: separazione dei canali RGB che salta a scatti.
  const glitchAttivo = random(`g${Math.floor(f / 3)}`) > 0.72 || ruggito > 0.3;
  const sep = glitchAttivo ? 6 + random(`s${f}`) * 14 : 2;
  const taglio = glitchAttivo ? (random(`c${f}`) - 0.5) * 30 : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sfondo
        src={IMMAGINI.demiurgo}
        style={{transform: `translate(${scossaX}px, ${scossaY}px) scale(${scalaLenta * pulsa})`}}
      />
      {/* Lampo rosso sul ruggito */}
      <AbsoluteFill style={{backgroundColor: '#ff0000', mixBlendMode: 'overlay', opacity: ruggito * 0.6}} />
      <Vignetta forza={0.9} />
      <div
        style={{
          ...stili.titoloBase,
          top: '14%',
          fontSize: 150,
          color: '#E3001B',
          opacity: Math.min(1, entrata),
          transform: `scale(${entrata}) translateX(${taglio}px)`,
          textShadow: [
            `${sep}px 0 0 rgba(0,255,255,0.7)`,
            `${-sep}px 0 0 rgba(255,0,80,0.8)`,
            '0 8px 24px rgba(0,0,0,0.95)',
            '0 0 40px rgba(255,0,0,0.7)',
          ].join(', '),
        }}
      >
        Il Demiurgo
      </div>
    </AbsoluteFill>
  );
};

// ── SEQUENZA 4 · La Creazione dell'Uomo e la Scintilla (1650-2400) ───────────
const ScenaScintilla: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d, fps} = useVideoConfig();
  // Zoom lento verso la scintilla nel petto.
  const scala = interpolate(f, [0, d], [1.0, 2.3], {easing: Easing.inOut(Easing.quad)});
  const luce = interpolate(f, [d * 0.45, d], [0.15, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const battito = 0.85 + Math.sin(f / 9) * 0.15;
  const titolo = spring({frame: f - 300, fps, config: {damping: 200}, durationInFrames: 45});

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sfondo
        src={IMMAGINI.scintilla}
        style={{transform: `scale(${scala})`, transformOrigin: SPARK_ORIGIN}}
      />
      {/* Bagliore dorato al centro (la scintilla). */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(255,214,90,${luce * battito}) 0%, rgba(255,170,30,${luce * 0.4}) 18%, rgba(0,0,0,0) 45%)`,
          mixBlendMode: 'screen',
        }}
      />
      <Vignetta forza={0.85} />
      <div
        style={{
          ...stili.titoloBase,
          ...stili.bagliore('rgba(255,190,40,0.95)', battito),
          color: '#FFE08A',
          top: '15%',
          fontSize: 116,
          opacity: titolo,
          transform: `scale(${1.2 - titolo * 0.2})`,
        }}
      >
        La scintilla divina
      </div>
    </AbsoluteFill>
  );
};

// ── SEQUENZA 5 · La Trappola della Reincarnazione (2400-3000) ────────────────
const ScenaCiclo: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d, fps} = useVideoConfig();
  // Dissolvenza incrociata città → tunnel di luce (su "Quando muori...").
  const tunnel = interpolate(f, [d * 0.55, d * 0.75], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scalaCitta = interpolate(f, [0, d], [1.1, 1.3]);
  const scalaTunnel = interpolate(f, [d * 0.55, d], [1.0, 1.6], {extrapolateLeft: 'clamp'});
  const pulsa = 1 + Math.sin((f / fps) * Math.PI * 2 * 0.8) * 0.06;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sfondo src={IMMAGINI.citta} style={{transform: `scale(${scalaCitta})`, filter: 'saturate(0.6) contrast(1.1)'}} />
      <AbsoluteFill style={{opacity: tunnel}}>
        <Sfondo src={IMMAGINI.tunnel} style={{transform: `scale(${scalaTunnel})`}} />
      </AbsoluteFill>
      <Vignetta forza={0.8 - tunnel * 0.3} />
      <div
        style={{
          ...stili.titoloBase,
          ...stili.bagliore('rgba(120,200,255,0.9)', pulsa),
          top: '15%',
          fontSize: 124,
          opacity: interpolate(f, [15, 45], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `scale(${pulsa})`,
        }}
      >
        Il ciclo infinito
      </div>
    </AbsoluteFill>
  );
};

// ── SEQUENZA 6 · La Gnosi e il Risveglio (3000-3600) ─────────────────────────
/** Schegge di vetro: poligoni (in %) che volano via dopo la rottura. */
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

const ScenaRisveglio: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Zoom in veloce all'inizio, poi lento fino alla rottura.
  const zoomRapido = spring({frame: f, fps, config: {damping: 18, stiffness: 60}});
  const scala = 1 + zoomRapido * 0.35 + interpolate(f, [0, ROTTURA], [0, 0.2], {extrapolateRight: 'clamp'});
  const luceInterna = interpolate(f, [0, ROTTURA], [0.1, 0.9], {extrapolateRight: 'clamp'});

  const dopo = f - ROTTURA;
  const rotto = dopo >= 0;
  const esplosione = rotto ? spring({frame: dopo, fps, config: {damping: 30, stiffness: 50}}) : 0;
  const scossa = rotto ? Math.exp(-dopo / 10) : 0;
  const sx = (random(`rx${f}`) - 0.5) * 70 * scossa;
  const sy = (random(`ry${f}`) - 0.5) * 70 * scossa;
  const lampo = rotto ? interpolate(dopo, [0, 3, 25], [0, 1, 0], {extrapolateRight: 'clamp'}) : 0;

  // "SVEGLIATI" vibra sempre, più forte dopo la rottura.
  const vibrazione = 3 + scossa * 18;
  const tx = (random(`vx${f}`) - 0.5) * vibrazione;
  const ty = (random(`vy${f}`) - 0.5) * vibrazione;
  const titolo = spring({frame: f - 40, fps, config: {damping: 12, stiffness: 180}});

  const immagine = (
    <Img
      src={staticFile(IMMAGINI.risveglio)}
      style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scala})`}}
    />
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#000', transform: `translate(${sx}px, ${sy}px) scale(1.06)`}}>
      {/* Dietro al vetro: pura luce. */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #ffffff 0%, #fff4d6 35%, #c9b8ff 100%)'}} />
      {!rotto ? (
        <AbsoluteFill style={{overflow: 'hidden'}}>{immagine}</AbsoluteFill>
      ) : (
        SCHEGGE.map((s, i) => (
          <AbsoluteFill
            key={i}
            style={{
              overflow: 'hidden',
              clipPath: `polygon(${s.poligono})`,
              transform: `translate(${s.dx * esplosione * 12}px, ${s.dy * esplosione * 12}px) rotate(${s.rot * esplosione}deg) scale(${1 + esplosione * 0.3})`,
              opacity: 1 - esplosione * 0.9,
            }}
          >
            {immagine}
          </AbsoluteFill>
        ))
      )}
      {/* Luce interiore che cresce. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(255,250,220,${luceInterna}) 0%, rgba(255,240,200,${luceInterna * 0.35}) 25%, rgba(0,0,0,0) 55%)`,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill style={{backgroundColor: '#fff', opacity: lampo}} />
      <Vignetta forza={0.6 * (1 - esplosione)} />
      <div
        style={{
          ...stili.titoloBase,
          ...stili.bagliore('rgba(255,255,255,0.95)', 1 + scossa),
          top: '38%',
          left: 20,
          right: 20,
          fontSize: 140,
          letterSpacing: '0.02em',
          opacity: Math.min(1, titolo),
          transform: `translate(${tx}px, ${ty}px) scale(${titolo * (1 + scossa * 0.15)})`,
          textShadow: [
            '0 8px 24px rgba(0,0,0,0.9)',
            '0 0 4px rgba(0,0,0,0.9)',
            `0 0 30px rgba(255,255,255,0.9)`,
            `0 0 80px rgba(200,180,255,0.9)`,
          ].join(', '),
        }}
      >
        Svegliati
      </div>
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

export const PistisSophiaVideo: React.FC<PistisSophiaProps> = ({
  voce,
  musica,
  volumeMusica = 0.18,
  sottotitoli = true,
}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    {elenco.map(({chiave, nome, Componente}) => {
      const s = SCENE[chiave];
      return (
        <Sequence key={chiave} name={nome} from={s.from} durationInFrames={s.durata}>
          <Componente />
          {sottotitoli && <Sottotitoli testo={s.testoVoce} durata={s.durata} />}
          <Dissolvenza durata={s.durata} />
        </Sequence>
      );
    })}

    {/* ▼ AUDIO: metti i file in public/pistis/ e passali come props. ▼ */}
    {voce ? <Audio src={staticFile(voce)} volume={1} /> : null}
    {musica ? <Audio src={staticFile(musica)} volume={volumeMusica} /> : null}
  </AbsoluteFill>
);
