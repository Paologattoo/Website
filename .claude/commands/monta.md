---
description: Monta davvero un reel dalle clip girate (selezione, montaggio, effetti, sottotitoli) in due versioni A/B
argument-hint: [titolo scheda, es. "che-taglia-porta"]
---

Scheda da montare: $ARGUMENTS

Lavora sempre in **italiano**. Il reparto montaggio monta **solo il materiale girato** con ffmpeg: non genera immagini o video con l'intelligenza artificiale.

## 1. Controlla prima di partire
- Leggi `brand/negozio.md` e `brand/montaggio.md`.
- Trova la scheda `schede/*-[titolo].md`. Se $ARGUMENTS è vuoto o non corrisponde a nessuna scheda, mostra l'elenco delle schede e chiedi quale montare.
- Controlla che `girato/[titolo]/` contenga le clip (`.mp4`, `.mov`, `.m4v`). Se è vuota o non esiste, **fermati** e spiega come caricarle: nomi come nella tabella del Regista (`scena1.mp4`, `scena2.mp4`…), caricate nella cartella `girato/[titolo]/` del repository da GitHub (dal sito, max 25 MB a file: meglio girare in 1080p) oppure con un link di download diretto (Google Drive pubblico, WeTransfer, Dropbox) che scarichi tu in quella cartella.
- Controlla che ffmpeg ci sia (`ffmpeg -version`; se manca `apt-get install -y ffmpeg`), installa Remotion (`cd remotion && npm ci`) e la trascrizione (`pip install -r remotion/requirements.txt`).
- Se il video arriva in chat con risoluzione bassa (sotto 1080 px di larghezza in verticale), avvisa che il risultato sarà sfocato e chiedi l'originale con un link (WeTransfer, Google Drive, Dropbox).

## 2. Lancia gli agenti in ordine
Strumento Agent, un `subagent_type` dopo l'altro. Ogni agente parte senza memoria: nel prompt passagli **il titolo, il percorso della scheda, la cartella del girato e il testo completo** di quello che hanno prodotto gli agenti precedenti.

1. **`trend-montaggio`** – solo se in `report/` non c'è un `*-trend-montaggio.md` degli ultimi 30 giorni (data nel nome file) o se la richiesta lo chiede.
2. **`selezionatore-clip`** → `montaggi/[titolo]/scaletta.md`.
   - Se segnala scene **da rigirare** essenziali, fermati e mostrami cosa rigirare e come.
   - Se segnala **Regola minori: ATTENZIONE** e non c'è modo di tagliare o sfocare, fermati e chiedi: rigirare oppure confermare per iscritto che c'è il consenso scritto dei genitori (da annotare in `girato/[titolo]/consensi.md`, senza nomi).
3. **`montatore`** → `lavoro/base-A.mp4`, `lavoro/base-B.mp4` + sezione Montaggio in `note-montaggio.md`.
4. **`effetti-visivi`** → zoom, emoji, suoni, colore e finale in `reel.json` (+ eventuali sfocature e velocità con ffmpeg).
5. **`sottotitolatore`** (sempre per ultimo) → trascrizione, `.srt`, `parole` e `gancio` in `reel.json`, esportazione Remotion di `finale-A.mp4` e `finale-B.mp4` + controllo finale.

Se l'ultimo controllo dice **Regola minori: ATTENZIONE**, non consegnare: fai correggere all'agente indicato e ricontrolla.

## 3. Consegna
- Verifica tu con `ffprobe` che i due finali esistano, siano 1080×1920 e abbiano l'audio.
- Mandami `finale-A.mp4`, `finale-B.mp4` e i due `.srt` (strumento SendUserFile).
- Mostra: durata di A e B, **cosa cambia tra A e B**, effetti usati, cosa fare alla pubblicazione (musica dall'app se prevista, caricare l'`.srt`, didascalia e hashtag dalla scheda) e come pubblicarle per il test (es. funzione "Prova" dei Reel, oppure A su Instagram e B su TikTok, oppure a una settimana di distanza alla stessa ora).
- Ricorda di compilare `statistiche/[titolo].md` dal modello dopo 48 ore e 7 giorni e poi lanciare `/performance [titolo]`.
- I video non vanno nel repository (`.gitignore`); scaletta, note e sottotitoli sì.
