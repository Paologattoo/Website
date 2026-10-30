# Stile reel del podcast – "parole impilate"

> Ricavato il 2026-10-30 dal video di esempio mandato da Paolo (reel TikTok di 25 s su un'intervista da podcast).
> Vale per le clip del podcast (ramo `podcast-reel`). Il motore è Remotion (`remotion/`): questo stile va aggiunto come nuovo layout dei testi, oltre ai sottotitoli a 3 parole già esistenti.

## L'idea in una riga
Non sottotitoli classici in basso, ma **tipografia cinetica**: la frase si costruisce parola per parola, **impilata** in un blocco al centro o accanto al volto di chi parla, con parole forti enormi e parole di collegamento piccole.

## Testo
- **Parole forti** (verbi, nomi, la parola chiave): grandissime, **bastoni condensati extra-bold in corsivo** (es. `Barlow Condensed` Black Italic o `Archivo` Black Italic da Google Fonts), interlinea strettissima, le righe quasi si toccano.
- **Parole di collegamento** ("e", "il", "che", "di", "sto ancora"): piccole, **con grazie, tonde e dritte** (es. `DM Serif Display` o `Libre Caslon`), infilate tra una parola grande e l'altra, a volte in piccolo sopra o sotto.
- Il blocco cresce **una parola alla volta, a tempo con la voce**: ogni parola compare con un pop veloce (scala 0.85 → 1 in circa 4 frame) e resta finché la frase non finisce; poi il blocco si svuota e ne parte uno nuovo.
- Ogni frase occupa 2-5 righe, centrate o allineate accanto al volto. Il testo non va mai sopra la faccia di chi parla.
- **Colori**: quasi tutto bianco. **Una sola parola chiave per frase** è colorata, con un colore diverso per ogni frase: magenta `#E0218A`, giallo `#F2D21B`, verde acqua `#5ED6A0`, lilla `#B9A7F0`, oro `#D9B860`, azzurro `#9CC3F5`.
- Ombra leggera sotto le parole (niente contorno nero spesso), così stanno bene anche sopra il video.

## Montaggio
1. **Gancio (0-2 s)**: chi parla a tutto schermo, con 1-2 parole enormi accanto ("Il consiglio", "Il segreto").
2. **Frase manifesto**: per la frase più forte, **schermo nero** con solo la tipografia che si costruisce. Una volta per clip, massimo due.
3. **Risposta**: chi parla a tutto schermo e la frase impilata accanto. Un leggero zoom lento.
4. **Chiusura**: schermo nero con la frase finale in **piccolo, tutta su una riga**, in un contrasto calmo con il resto. Poi 1-2 s di logo/nome.

- **Split-screen**: si usa solo nel momento della domanda, con chi chiede sopra e chi risponde sotto. Durante la risposta va a tutto schermo chi parla, perché in questo stile il testo ha bisogno di spazio accanto al volto.
- **Niente spezzoni di film o cartoni.** Il video di esempio li usa, ma sono materiale coperto da diritti e non girato da noi. Al loro posto usiamo: schermi neri tipografici, l'altro ospite che ascolta e zoom sul volto di chi parla.

## Audio
- La voce resta in primo piano, normalizzata a -14 LUFS.
- **Musica di sottofondo** morbida (piano o pad emotivo), circa 18-20 dB sotto la voce, che continua anche sul finale nero. Va scelta senza diritti, oppure si aggiunge dall'app al momento di pubblicare. La musica non si genera con l'IA.
- Effetti sonori quasi assenti: al massimo un `whoosh` leggero quando entra lo schermo nero. Niente pop sulle parole, perché il ritmo lo dà già la tipografia.

## Formato
1080×1920, 30 fps, come in `brand/montaggio.md`. Il testo resta tra 250 e 1470 px in verticale e lontano dai 160 px a destra.
