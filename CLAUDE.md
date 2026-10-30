# Team social – Negozio di Giorgio

Questo progetto ospita un team di agenti che gestisce i social di un negozio di abbigliamento e articoli per bambini (titolare: Giorgio).

- Si lavora **sempre in italiano**.
- Il team **ideazione** (Sara, Marco, Giulia, Gancio Hunter, Sceneggiatore, Regista) produce idee, testi e inquadrature.
- Il reparto **montaggio** (trend-montaggio, selezionatore-clip, montatore, sottotitolatore, effetti-visivi, analista-performance) monta davvero con ffmpeg e Remotion (grafica animata, `remotion/`) **solo il materiale girato**: non genera immagini o video con l'intelligenza artificiale. Standard in `brand/montaggio.md`.
- Prima di ogni lavoro si legge `brand/negozio.md` (e, per il montaggio, `brand/montaggio.md` e `report/cosa-funziona.md`).
- Regola fissa: **mai volti di bambini senza consenso scritto dei genitori**.
- **Token saver**: video e trascrizioni lunghe si guardano solo tramite gli script di `token-saver/` (una pagina di riepilogo + max 2 immagini). Un hook blocca la lettura di frame singoli e di file di testo enormi.

Comandi:
- `/reel [richiesta]` – contenuti completi → `schede/`
- `/ricerca [tema]` – solo ricerca → `report/`
- `/monta [titolo scheda]` – monta le clip di `girato/[titolo]/` in due versioni A/B → `montaggi/[titolo]/`
- `/performance [titolo]` – confronta A/B con i numeri di `statistiche/` e aggiorna `report/cosa-funziona.md`
