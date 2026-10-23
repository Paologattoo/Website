// Struttura del file montaggi/[titolo]/reel.json (vedi README.md)
export type Parola = {testo: string; inizio: number; fine: number; evidenzia?: boolean};
export type Zoom = {a: number; scala?: number; durata?: number};
export type Emoji = {emoji: string; a: number; durata?: number; x?: number; y?: number};
export type Suono = {file: string; a: number; volume?: number};

export type ReelProps = {
  video: string; // percorso dentro public/ (lo imposta render.mjs)
  inizio: number; // secondo del girato da cui partire
  fine: number; // secondo del girato in cui finire
  parole: Parola[]; // tempi in secondi del girato originale
  paroleInsieme?: number; // quante parole per riga di sottotitolo
  gancio?: {testo: string; durata?: number};
  zoom?: Zoom[];
  zoomLento?: boolean;
  emoji?: Emoji[];
  suoni?: Suono[];
  finale?: {testo: string; sottotesto?: string; durata?: number};
  colori?: {evidenzia?: string; barra?: string; sfondoFinale?: string};
  filtro?: string; // filtro CSS per il colore, es. "saturate(1.1) contrast(1.05)"
  barra?: boolean;
  volumeVideo?: number;
};
