# Note di montaggio – video-2

Origine: ripresa caricata in chat, 6,2 s, 480×360 orizzontale (compressa dal caricamento). Non c'è una scheda in `schede/`.

- **Base** (ffmpeg): pulizia dell'audio (filtro passa-alto 80 Hz, riduzione rumore) → `lavoro/base.mp4`.
- **Grafica** (Remotion, `reel.json`):
  - taglio 0,3-6,23 s;
  - zoom a scatto all'inizio di ognuna delle 4 frasi (0,38 / 2,57 / 4,44 / 5,72 s, trovate con `silencedetect`) e whoosh;
  - 👋 con pop sul saluto (4,45 s);
  - barra di avanzamento e colore leggermente più caldo;
  - volume -14,3 LUFS.
- **Variabile A/B:** il formato. A = video orizzontale intero al centro su sfondo sfocato (perde meno qualità). B = ritaglio verticale a tutto schermo (volto più grande, più sfocato).
- **Sottotitoli**: trascritti con Parakeet (`lavoro/parole.json`): "Allora, monta questo video, scrivi qua qualcosa, fai un zoom e basta." Evidenziate: video, qualcosa, zoom. Zoom forte (1,35×) sulla parola "zoom", ✍️ su "scrivi", 🔍 su "zoom".
- **Regola minori:** OK, compare solo un ragazzo che sembra maggiorenne.
