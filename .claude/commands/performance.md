---
description: Confronta le versioni A/B pubblicate e aggiorna le regole su cosa funziona
argument-hint: [titolo scheda, oppure vuoto per l'analisi di tutti i video]
---

Video da analizzare: $ARGUMENTS

Lavora sempre in **italiano**.

1. Controlla che in `statistiche/` ci siano i numeri (`statistiche/[titolo].md`, modello in `statistiche/MODELLO.md`). Se mancano, spiegami dove trovarli su Instagram e TikTok e fermati.
   - Se $ARGUMENTS chiede un **parere prima di pubblicare**, i numeri non servono: basta che esistano `montaggi/[titolo]/finale-A.mp4` e `finale-B.mp4`.
2. Lancia l'agente **`analista-performance`** (strumento Agent) passandogli il titolo (o "tutti i video"), i percorsi delle statistiche, della scheda e di `note-montaggio.md`.
3. Mostrami: percorso del report, verdetto (A, B o pareggio) con il perché, le regole aggiornate in `report/cosa-funziona.md` e il prossimo test da fare.
