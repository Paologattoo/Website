# Remotion – grafica animata per i reel

Remotion crea il video finale con la grafica animata:
- **sottotitoli** parola per parola, con la parola detta che si accende;
- **gancio** in un riquadro colorato nei primi secondi;
- **zoom a scatto** sulle parole importanti;
- **emoji** che compaiono;
- **effetti sonori** (`public/sfx/whoosh.wav`, `pop.wav`, `ding.wav`);
- **barra di avanzamento**;
- **schermata finale**.

## Preparazione (a ogni nuova sessione)
```bash
cd remotion && npm ci            # Remotion
pip install -r requirements.txt  # trascrizione (sherpa-onnx)
```
La trascrizione usa **NVIDIA Parakeet TDT 0.6B v3** (italiano compreso, tempi di ogni parola) tramite sherpa-onnx. La prima volta scarica il modello (~490 MB) dalle release GitHub di `k2-fsa/sherpa-onnx` in `~/.cache/modelli`: non serve Hugging Face.

## Flusso
1. `python3 trascrivi.py ../montaggi/[titolo]/lavoro/base-A.mp4 ../montaggi/[titolo]/lavoro/parole-A.json` → tempi di ogni parola. Correggi a mano nomi e parole sbagliate e aggiungi `"evidenzia": true` alle parole chiave. In `reel.json` puoi mettere `"parole": "lavoro/parole-A.json"`.
2. Scrivi `montaggi/[titolo]/reel.json` (vedi sotto). I tempi sono in **secondi del file `sorgente`**.
3. `node render.mjs ../montaggi/[titolo]/reel.json` → `montaggi/[titolo]/finale-A.mp4`, `finale-B.mp4` (1080×1920, 30 fps, -14 LUFS).
4. Per vedere e regolare a mano: `npm run studio`.

## reel.json
```json
{
  "sorgente": "lavoro/base-A.mp4",
  "inizio": 0, "fine": 14.1,
  "parole": [{"testo": "Che", "inizio": 0.2, "fine": 0.4}, {"testo": "taglia", "inizio": 0.4, "fine": 0.8, "evidenzia": true}],
  "paroleInsieme": 3,
  "gancio": {"testo": "La nonna chiede la taglia", "durata": 2},
  "zoom": [{"a": 0.4, "scala": 1.15, "durata": 0.6}],
  "zoomLento": true,
  "emoji": [{"emoji": "🎁", "a": 3.2, "durata": 1.2, "x": 760, "y": 520}],
  "suoni": [{"file": "sfx/whoosh.wav", "a": 0.35, "volume": 0.6}],
  "finale": {"testo": "SEGUICI", "sottotesto": "Una mini guida a settimana", "durata": 2},
  "colori": {"evidenzia": "#FFC93C", "barra": "#FFC93C", "sfondoFinale": "#111111"},
  "filtro": "saturate(1.1) contrast(1.05) sepia(0.06)",
  "barra": true,
  "varianti": {"A": {}, "B": {"sorgente": "lavoro/base-B.mp4", "gancio": {"testo": "Altro gancio"}}}
}
```
Ogni variante sovrascrive solo i campi che indica. `"layout": "sfondo-sfocato"` mette un video orizzontale intero al centro su sfondo sfocato (utile per video orizzontali o a bassa risoluzione). Zone sicure: i sottotitoli partono a 1330 px dall'alto (1290 con sfondo sfocato), il gancio a 300 px, entrambi lontani dai pulsanti delle app.
