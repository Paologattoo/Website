"""Trascrive un video parola per parola e scrive la lista "parole" per reel.json.

Uso: python3 trascrivi.py ../montaggi/[titolo]/lavoro/base-A.mp4 ../montaggi/[titolo]/lavoro/parole-A.json [modello]
Modello: small (predefinito, veloce) oppure medium (più preciso, più lento).
Serve accesso a huggingface.co per scaricare il modello la prima volta.
"""
import json
import subprocess
import sys
import tempfile

from faster_whisper import WhisperModel

video, uscita = sys.argv[1], sys.argv[2]
modello = sys.argv[3] if len(sys.argv) > 3 else "small"

with tempfile.NamedTemporaryFile(suffix=".wav") as wav:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-map", "0:a:0", "-ac", "1", "-ar", "16000", wav.name], check=True)
    m = WhisperModel(modello, device="cpu", compute_type="int8")
    segmenti, info = m.transcribe(wav.name, language="it", word_timestamps=True, vad_filter=True)
    parole = [
        {"testo": w.word.strip(), "inizio": round(w.start, 2), "fine": round(w.end, 2)}
        for s in segmenti
        for w in s.words
        if w.word.strip()
    ]

with open(uscita, "w", encoding="utf-8") as f:
    json.dump(parole, f, ensure_ascii=False, indent=1)
print(f"{len(parole)} parole → {uscita}")
print(" ".join(p["testo"] for p in parole))
