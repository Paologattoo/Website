# Stile reel del podcast

> Ricavato il 2026-10-30 da due video di esempio mandati da Paolo (reel TikTok da interviste podcast).
> Vale per le clip del podcast (ramo `podcast-reel`). Il motore è Remotion (`remotion/`): i due stili vanno aggiunti come nuovi layout dei testi.
> **Stile principale = "Status" (versione A)**. "Parole impilate" è la **versione B** per il test A/B: secondo `brand/montaggio.md` cambia una sola variabile, cioè lo stile dei testi. Musica e tagli restano uguali.

---

## A · "Status" (stile principale, scelto da Paolo)
Sensazione: serio, potente, da "mentalità vincente". Musica cupa e profonda, pochissimo testo, pause drammatiche.

### Testo
- **Sottotitoli a una parola alla volta**, al centro dello schermo (circa a metà altezza, sotto il volto, sopra il microfono). Sono piccoli: bianchi, **bastoni larghi extra-bold** (es. `Archivo` Expanded Black o `Unbounded` Black, da Google Fonts), ombra morbida e niente riquadro.
- Ogni **parola chiave** ("successo", "futuro", "punto", "te") viene ingrandita 2-3 volte, con la parola che la precede in piccolo sopra (es. "il tuo" piccolo / "SUCCESSO" grande). Al massimo una ogni 3-4 secondi.
- **Cartello domanda su nero**: la domanda chiave della clip, su schermo nero, scritta mescolando due font sulla stessa riga:
  - parole "di struttura" in **bastone largo extra-bold** bianco;
  - parole "emotive" in **corsivo scritto a mano** (es. `Caveat Brush` o `Kaushan Script`);
  - le parole entrano una alla volta con una **dissolvenza dal grigio al bianco** (circa 6 frame), a tempo con la voce;
  - l'ultima parola chiave è più grande, in corsivo a mano (es. "*schermo?*").
- Niente colori: **solo bianco e grigio**. Lo status lo danno il bianco e nero e la musica, non i colori.

### Montaggio
1. **Gancio (0-3 s)**: chi parla, inquadratura stretta, con la prima frase forte a parole singole.
2. **Pausa drammatica**: circa 0,4 s di silenzio totale, con la musica che si stacca, e taglio sul **cartello domanda nero** mentre la voce continua.
3. **Risposta**: tagli secchi tra i due ospiti (e tra inquadrature larghe e strette, se ci sono), un leggero **zoom lento** continuo e **colore desaturato a contrasto alto** (saturazione circa -30%, neri profondi).
4. **Picco**: sulla frase più forte un **rallenty** breve (80%) o un fermo immagine di 0,5 s sul volto, zoom a scatto 1.15.
5. **Chiusura**: la musica sfuma e resta 1-2 s di nero con nome o logo.

- **Split-screen**: solo nel momento della domanda. Durante la risposta va a tutto schermo chi parla.
- **Niente spezzoni di altri (calciatori, film, partite).** Il video di esempio li usa come B-roll di "status", ma sono coperti da diritti e non girati da noi. Al loro posto: rallenty, primi piani, bianco e nero e cartelli neri, tutto preso dal podcast stesso.

### Musica ("senso di status")
- Il carattere dell'esempio: **base cupa e profonda**, con molti bassi continui (tipo 808/sub) e un tappeto scuro sopra. Ricorda un'**epica cinematografica lenta**, un piano scuro o un phonk/trap rallentato. Tempo lento, minore.
- La musica copre tutta la clip, sta circa **12-15 dB sotto la voce** (più presente che nello stile B) e si **stacca di colpo** nella pausa drammatica, poi riparte.
- Volume finale -14 LUFS.
- La musica non si genera con l'IA. Per gli mp4 di prova si usa un brano **senza diritti** con licenza che permetta l'uso sui social (es. Pixabay Music, YouTube Audio Library), e la fonte va scritta in `note-montaggio.md`. Quando si pubblica, conviene usare un audio di tendenza "status/sigma" dalla libreria di Instagram/TikTok.
- Effetti sonori: solo un **boom/impatto basso** sul cartello nero e un whoosh leggero sugli zoom a scatto.

---

## B · "Parole impilate" (variante per il test A/B)
Sensazione: emotivo, ispirazionale, colorato.

- Niente sottotitoli classici: la frase si costruisce **parola per parola**, **impilata** accanto al volto.
- **Parole forti** grandissime in **bastone condensato extra-bold corsivo** (es. `Barlow Condensed` Black Italic). **Parole di collegamento** piccole **con grazie** (es. `DM Serif Display`) infilate in mezzo. Interlinea strettissima.
- Ogni parola entra con un pop (scala 0.85 → 1 in circa 4 frame). Quando la frase è finita, il blocco si svuota.
- Tutto bianco tranne **una parola chiave per frase**, colorata ogni volta in modo diverso: magenta `#E0218A`, giallo `#F2D21B`, verde acqua `#5ED6A0`, lilla `#B9A7F0`, oro `#D9B860`.
- La frase più forte va su **schermo nero** con la sola tipografia. Il finale è una frase piccola su una riga, su nero.
- Stessa musica e stessi tagli della A, per confrontare solo lo stile dei testi.

---

## Per tutti e due
- 1080×1920, 30 fps, -14 LUFS, come in `brand/montaggio.md`. Il testo resta tra 250 e 1470 px in verticale e lontano dai 160 px a destra.
- Struttura: gancio 2-4 s → domanda → risposta completa. 30-60 s, al massimo 90.
- Il testo non va mai sopra la faccia di chi parla.
