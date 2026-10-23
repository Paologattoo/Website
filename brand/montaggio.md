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

## Ordine di lavoro
`trend-montaggio` (se serve) → `selezionatore-clip` → `montatore` (`lavoro/base-*.mp4`) → `effetti-visivi` (`lavoro/fx-*.mp4`) → `sottotitolatore` (`finale-*.mp4`).
I sottotitoli vanno **per ultimi**: se si applicano zoom o ritagli dopo, il testo viene ingrandito e tagliato.

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
- Font: `DejaVu Sans Bold` (installato; percorso `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`).
- Sottotitoli: bianco, contorno nero 4 px, max 2 righe, max ~32 caratteri per riga.
- Testo a schermo del gancio: grande (90-110 px), su riquadro semitrasparente, nei primi 2 s.

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
