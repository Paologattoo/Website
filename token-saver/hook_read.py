"""Hook PreToolUse su Read: blocca le letture che sprecano token e indica lo script da usare.

- immagini dentro una cartella frame/ (frame grezzi estratti da un video)
- file di testo oltre SOGLIA byte letti per intero (senza offset/limit)
Le uscite di token-saver (riepilogo.md, foglio.jpg, volti.jpg, foglio-2.jpg) passano sempre.
"""
import json
import os
import sys

SOGLIA = 60_000
IMMAGINI = (".jpg", ".jpeg", ".png", ".webp")
SEMPRE_OK = {"riepilogo.md", "foglio.jpg", "foglio-2.jpg", "volti.jpg"}


def nega(motivo):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                             "permissionDecisionReason": motivo}}))
    sys.exit(0)


dati = json.load(sys.stdin)
ingresso = dati.get("tool_input", {})
percorso = ingresso.get("file_path", "")
nome = os.path.basename(percorso)
if nome in SEMPRE_OK:
    sys.exit(0)

parti = percorso.replace("\\", "/").lower().split("/")
if nome.lower().endswith(IMMAGINI) and any(p in ("frame", "frames") for p in parti[:-1]):
    nega("Token saver: non leggere i frame uno per uno. Esegui `python3 token-saver/prep_video.py <video o cartella>` "
         "e leggi riepilogo.md + foglio.jpg (+ volti.jpg se c'è).")

if not nome.lower().endswith(IMMAGINI + (".pdf", ".ipynb")) and "limit" not in ingresso and "offset" not in ingresso:
    try:
        grandezza = os.path.getsize(percorso)
    except OSError:
        sys.exit(0)
    if grandezza > SOGLIA:
        consiglio = ("per una trascrizione usa `python3 token-saver/prep_trascrizione.py` e leggi riepilogo.md; "
                     if nome.lower().endswith((".json", ".srt", ".vtt", ".txt", ".ass")) else "")
        nega(f"Token saver: {nome} pesa {grandezza // 1000} KB (circa {grandezza // 3500}k token). "
             f"{consiglio}altrimenti cerca con grep o leggi solo una parte con offset/limit.")
