# Token saver

Il Mac fa il lavoro pesante gratis; Claude legge solo una pagina di riepilogo e al massimo due immagini.

| Script | Cosa sostituisce | Uscita |
|---|---|---|
| `prep_video.py` | decine di frame letti uno per uno (selezione clip, controllo minori, controllo finale, video di esempio) | `riepilogo.md`, `foglio.jpg`, `volti.jpg` |
| `prep_trascrizione.py` | la trascrizione parola per parola letta tutta (podcast, interviste) | `riepilogo.md`, `frasi.tsv` |

```bash
python3 token-saver/prep_video.py girato/[titolo]/          # cartella di clip → girato/[titolo]/prep/
python3 token-saver/prep_video.py montaggi/[titolo]/finale-A.mp4
python3 token-saver/prep_trascrizione.py podcast.mp4         # oppure parole.json / .srt
```

Requisiti: `python3` e `ffmpeg` (se ffmpeg non è nel PATH: `FFMPEG=/percorso/ffmpeg`).
Volti e testo a schermo usano Apple Vision tramite `vision.swift`: funziona solo sul Mac e richiede
gli Strumenti da riga di comando di Xcode (ci sono già se `git` funziona). Per velocizzarlo, una volta sola:
`swiftc -O token-saver/vision.swift -o token-saver/vision`.

Regole per Claude:
- leggere `riepilogo.md` e le immagini elencate, **mai** i frame in `prep/frame/`;
- in `frasi.tsv` cercare solo i tratti che servono (`awk`, `grep`), mai leggerlo tutto;
- `volti.jpg` serve al controllo minori: un volto segnalato si guarda lì, ingrandito.
