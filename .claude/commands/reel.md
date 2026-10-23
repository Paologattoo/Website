---
description: Crea contenuti social completi (idea, frase, gancio, sceneggiatura, inquadrature) per il negozio di bimbi di Giorgio
argument-hint: [richiesta, es. "3 reel per Halloween per portare gente in negozio"]
---

Richiesta: $ARGUMENTS

Lavora sempre in **italiano**. Il team produce solo idee, testi e inquadrature: non montare, non modificare e non generare video o immagini.

## 1. Leggi il brand
Leggi `brand/negozio.md`. Se ci sono campi `[DA COMPILARE]` importanti (nome, città, prodotti di punta), segnalalo in una riga e prosegui.

## 2. Controlla la richiesta
Servono tre informazioni:
- **numero di contenuti**;
- **occasione** (es. festa, cambio stagione, nuovi arrivi, saldi, evento);
- **obiettivo** (es. visite in negozio, messaggi, follower, notorietà).

Se ne manca anche solo una, chiedile **tutte insieme in un'unica domanda** e aspetta la risposta prima di proseguire.

## 3. Lancia gli agenti in ordine
Usa lo strumento Agent con questi `subagent_type`, uno dopo l'altro. Ogni agente parte senza memoria: nel prompt passagli **la richiesta, numero/occasione/obiettivo e il testo completo** di quello che hanno prodotto gli agenti precedenti.

1. **`sara-strategist`** – solo se la richiesta chiede esplicitamente una ricerca **oppure** in `report/` non c'è un report degli ultimi 30 giorni (guarda la data nel nome file). Altrimenti salta Sara e usa il brief del report più recente.
2. **`marco-ideatore`** – passagli il brief di Sara (o il brief del report recente; se non c'è niente, dì che deve proporre lui).
3. **`giulia-voce`** – passagli le idee di Marco.
4. **`gancio-hunter`** – passagli idee di Marco + frasi di Giulia.
5. **`sceneggiatore`** – passagli idee + frasi + ganci (con il migliore indicato) + hashtag dal report, se ci sono.
6. **`regista`** – passagli la sceneggiatura completa con le scene numerate.

Se il Regista segnala **"Regola minori: ATTENZIONE"**, correggi la scena indicata secondo la sua alternativa prima di salvare.

## 4. Salva le schede
Crea **una scheda per ogni contenuto** in `schede/AAAA-MM-GG-[titolo].md` (data di oggi, titolo in minuscolo con trattini, senza accenti). Struttura:

```markdown
# [Titolo]

**Formato:** ... · **Durata:** ... · **Occasione:** ... · **Obiettivo:** ...
**Prodotto protagonista:** ...

## Idea
(da Marco: idea + perché funziona ora)

## Frase di Giulia
> "..."

## Gancio
**⭐ Scelto:** tipo – frase / testo a schermo / gancio visivo
**Alternativa 1:** ...
**Alternativa 2:** ...

## Sceneggiatura per secondi
(tabella dello Sceneggiatore, Scena 1…N, con invito finale)

## Inquadrature e nomi file
(tabella del Regista: scena, nome file, inquadratura, movimento, durata, luce, transizione)
**Consigli per girare:** ...
**Regola minori:** OK / note

## Didascalia e hashtag
(didascalia max 3 righe)

#... #... #...
```

## 5. Chiudi
Mostra l'elenco dei file creati e, per ogni contenuto, una riga con titolo + frase di Giulia + gancio scelto.
