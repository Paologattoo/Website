# Strumento: SupoClip (MCP)

> Appunti per il reparto montaggio. Fonte: `mcp/src/supoclip_mcp/server.py` incollato da Giorgio il 2026-10-30 (mancano `client.py` e `config.py`, quindi il server non è ancora installato).

## Cos'è
Servizio che prende un video lungo e ne ricava da solo clip corte verticali con sottotitoli.
- API: `https://api.supoclip.com` (oppure self-hosted con `SUPOCLIP_API_URL`).
- Autenticazione: chiave API (`sk_...`) in `SUPOCLIP_API_KEY`.
- I piani si pagano a **minuti di video sorgente al mese**: si scala la durata intera del video, arrotondata al minuto.
- File scaricati in `SUPOCLIP_DOWNLOAD_DIR` (default `./supoclip-downloads`).

## Flusso
1. `supoclip_create_clip_task(url=...)` → `task_id` (lavoro asincrono).
2. `supoclip_wait_for_task(task_id)` finché lo stato è `completed` / `error` / `cancelled`.
3. `supoclip_list_clips(task_id)` → clip con `start_time`, `end_time`, `virality_score`.
4. `supoclip_export_clip(task_id, clip_id, preset="reels"|"tiktok"|"shorts")` → MP4 1080×1920 H.264 (oppure `supoclip_download_clip` per il file originale).

## Opzioni di `supoclip_create_clip_task`
| Parametro | Valori | Default |
|---|---|---|
| `url` | link YouTube o link diretto al video (**niente file locali**) | obbligatorio |
| `title` | titolo del task | – |
| `processing_mode` | `fast`, `balanced`, `quality` | `fast` |
| `output_format` | `vertical`, `vertical_fit` (inquadratura intera su 9:16), `vertical_pan`, `vertical_split` (due persone impilate), `original` | `vertical` |
| `clip_length` | `auto` (15-60 s), `short` (15-30 s), `medium` (30-60 s), `long` (60-120 s) | `auto` |
| `add_subtitles` | sottotitoli impressi | `true` |
| `caption_template` | id da `supoclip_list_caption_templates` (es. `default`, `hormozi`, `mrbeast`) | `default` |
| `font_family` / `font_size` (12-72) / `font_color` (`#RRGGBB`) | stile dei sottotitoli | – |
| `cut_long_pauses` | accorcia i silenzi | `true` |
| `remove_filler_words` | toglie "ehm", "uh" | `true` |
| `include_broll` | aggiunge B-roll automatico | `false` |

## Altri strumenti
- Senza autenticazione: `supoclip_health`, `supoclip_list_caption_templates`, `supoclip_list_transitions`, `supoclip_broll_status`.
- Con autenticazione: `supoclip_list_fonts`, `supoclip_billing_summary` (minuti rimasti, risoluzione 720/1080), `supoclip_list_tasks`, `supoclip_get_task`, `supoclip_cancel_task`, `supoclip_resume_task`, `supoclip_delete_task` (definitivo).

## Come si incastra col nostro flusso dei reel del podcast
- ✅ Copre: 9:16 1080p, split-screen (`vertical_split`), taglio di pause ed "ehm", sottotitoli impressi, durata 30-60 s (`medium`).
- ❌ Non c'è il passaggio di approvazione: sceglie e monta tutto da solo e i minuti si consumano sull'intero video.
- ❌ Non fa la struttura **gancio → domanda → risposta completa**.
- ❌ Non usa il nostro `.srt` e non accetta file locali, solo URL.
- ⚠️ `include_broll` aggiunge materiale non girato da noi: va contro la regola "solo materiale girato" del reparto montaggio. **Tenerlo a `false`.**

**Uso consigliato:** come secondo parere. Si confrontano i suoi `virality_score` e timecode con i momenti scelti da noi nella trascrizione. Il montaggio vero resta con ffmpeg e Remotion, secondo `brand/montaggio.md`.

## Per attivarlo
1. Repo completo del server MCP (o server già installato come MCP nella sessione).
2. `SUPOCLIP_API_KEY` nei secrets dell'ambiente.
3. Rete dell'ambiente aperta verso `api.supoclip.com` (il 2026-10-30 era bloccato).
