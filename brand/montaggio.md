# Standard di montaggio – Negozio di Giorgio

> Lo leggono **tutti gli agenti del reparto montaggio** prima di lavorare, insieme a `brand/negozio.md`.
> Le scelte di stile (font, colori) seguono `brand/negozio.md`: se lì sono `[DA COMPILARE]`, si usano i valori provvisori qui sotto e lo si segnala.

## Cartelle

| Cartella | Cosa contiene | Chi la riempie |
|---|---|---|
| `girato/[titolo-scheda]/` | clip grezze girate col telefono, chiamate come nella scheda del Regista (`scena1.mp4`, `scena2a.mp4`, `scena2b.mp4`…). Facoltativo: `consensi.md` | Giorgio / chi gira |
| `montaggi/[titolo-scheda]/` | `scaletta.md`, `note-montaggio.md`, sottotitoli `.srt` e `.ass`, video esportati | reparto montaggio |
| `montaggi/[titolo-scheda]/lavoro/` | frame estratti, spezzoni, prove (non salvati nel repository) | reparto montaggio |
| `statistiche/` | numeri dei video pubblicati (vedi `statistiche/MODELLO.md`) | Giorgio |
| `report/` | report trend di montaggio e analisi delle performance | trend-montaggio, analista-performance |
| `report/cosa-funziona.md` | regole imparate dai risultati reali: **si leggono prima di montare** | analista-performance |

`[titolo-scheda]` è il nome del file in `schede/` senza data e senza `.md` (es. `schede/2026-10-23-che-taglia-porta.md` → `che-taglia-porta`).

## Ordine di lavoro e strumenti
`trend-montaggio` (se serve) → `selezionatore-clip` → `montatore` (ffmpeg: `lavoro/base-*.mp4`) → `effetti-visivi` (scrive zoom, emoji, suoni, colore e finale in `reel.json`) → `sottotitolatore` (trascrive, completa `reel.json` ed esporta i `finale-*.mp4` con **Remotion**).
- **ffmpeg**: tagli, unione delle clip, formato, pulizia audio.
- **Remotion** (`remotion/`, istruzioni in `remotion/README.md`): tutta la grafica animata (sottotitoli parola per parola, gancio, zoom a scatto, emoji, effetti sonori, barra, schermata finale). La grafica si applica sopra gli zoom, quindi il testo non viene mai tagliato.
- **Token saver** (`token-saver/README.md`): video e clip si guardano solo tramite `prep_video.py` (una pagina + max 2 immagini), trascrizioni lunghe tramite `prep_trascrizione.py`. Mai leggere frame singoli o JSON di trascrizione interi: un hook lo blocca.
- **Trascrizione**: `remotion/trascrivi.py` (Parakeet v3 via sherpa-onnx, modello scaricato da GitHub). Se non funziona, si usa il testo della scheda o quello dettato da Giorgio, e lo si segnala.

## Formato di esportazione (uguale per Reel e TikTok)
- **1080×1920, 9:16, 30 fps**, H.264 (`libx264`, `-crf 20 -preset medium`, `-pix_fmt yuv420p`, `-movflags +faststart`).
- Audio **AAC 128 kb/s, 48 kHz**, volume normalizzato con `loudnorm=I=-14:TP=-1.5:LRA=11`.
- Clip orizzontali o con altro rapporto: `scale` + `crop` al centro (o sul soggetto), mai deformare.
- Durata: quella della scheda (di norma 15-30 s). Mai oltre 90 s.

## Zone sicure (dove non mettere testo)
L'interfaccia di Instagram e TikTok copre parte dello schermo. Su 1080×1920:
- **in alto**: primi 250 px;
- **in basso**: ultimi 450 px (didascalia, pulsanti);
- **a destra**: ultimi 160 px (like, commenti, condividi).
Testi e sottotitoli stanno nella fascia centrale, tra 250 e 1470 px in verticale.

## Stile provvisorio (finché `brand/negozio.md` non ha colori e font)
- Font: **Montserrat Black** (in Remotion); con ffmpeg `DejaVu Sans Bold`.
- Sottotitoli: maiuscolo, bianco con contorno nero, 3 parole alla volta, la parola detta si accende in giallo `#FFC93C`.
- Gancio: riquadro giallo con testo nero nei primi 2 s.
- Effetti sonori: whoosh sugli zoom, pop sulle emoji, ding sulla schermata finale (volume basso).

## Varianti A/B
Ogni montaggio esce in **due versioni** che differiscono per **una sola variabile**, così si capisce cosa ha fatto la differenza:
- **A** = fedele alla scheda (gancio "⭐ Scelto");
- **B** = cambia solo una cosa: il gancio alternativo (se è stato girato), oppure apertura, ritmo dei tagli o stile dei sottotitoli.
La variabile cambiata va scritta in `note-montaggio.md`. Nomi file: `finale-A.mp4`, `finale-B.mp4`.

## ⚠️ Regola minori nel montaggio
Vale la regola fissa di `brand/negozio.md`: **mai volti di bambini senza consenso scritto dei genitori.**
- Il Selezionatore controlla i frame di ogni clip; il reparto non usa nessuna clip con un volto di bambino riconoscibile, a meno che `girato/[titolo]/consensi.md` non indichi per quella scena "consenso scritto: sì".
- `consensi.md` contiene solo `scena → consenso scritto sì/no` e la data: **niente nomi, niente copie dei documenti** nel repository.
- Se un volto compare per pochi frame, si taglia quel tratto o si sfoca la zona (filtro `boxblur` sulla zona del volto); se non è possibile, la clip si scarta e si chiede di rigirarla.
- Anche con consenso: niente nomi, scuole o luoghi riconoscibili del bambino (insegne, divise, targhe), né nel video né nei sottotitoli.
