"""Trascrive un video parola per parola e scrive la lista "parole" per reel.json.

Uso: python3 trascrivi.py ../montaggi/[titolo]/lavoro/base-A.mp4 ../montaggi/[titolo]/lavoro/parole-A.json

Modello: NVIDIA Parakeet TDT 0.6B v3 (25 lingue europee, italiano compreso) tramite sherpa-onnx.
La prima volta lo scarica (~490 MB) dalle release GitHub di k2-fsa/sherpa-onnx in ~/.cache/modelli.
"""
import json
import pathlib
import subprocess
import sys
import tarfile
import urllib.request

import numpy as np
import sherpa_onnx

NOME = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8"
URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{NOME}.tar.bz2"
CACHE = pathlib.Path.home() / ".cache" / "modelli"
PUNTEGGIATURA = set(",.;:!?…")


def modello() -> pathlib.Path:
    cartella = CACHE / NOME
    if not (cartella / "tokens.txt").exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        archivio = CACHE / f"{NOME}.tar.bz2"
        print("Scarico il modello di trascrizione (~490 MB)...")
        urllib.request.urlretrieve(URL, archivio)
        with tarfile.open(archivio) as t:
            t.extractall(CACHE, filter="data")
        archivio.unlink()
    return cartella


def trascrivi(video: str) -> list[dict]:
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", video, "-map", "0:a:0", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
        check=True, capture_output=True,
    ).stdout
    audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    d = modello()
    r = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(d / "encoder.int8.onnx"), decoder=str(d / "decoder.int8.onnx"),
        joiner=str(d / "joiner.int8.onnx"), tokens=str(d / "tokens.txt"),
        model_type="nemo_transducer", num_threads=4,
    )
    s = r.create_stream()
    s.accept_waveform(16000, audio)
    r.decode_stream(s)

    # I token che iniziano con uno spazio aprono una nuova parola; la punteggiatura resta attaccata
    parole: list[dict] = []
    for tok, t in zip(s.result.tokens, s.result.timestamps):
        if tok.startswith(" ") or not parole:
            parole.append({"testo": tok.strip(), "inizio": round(t, 2)})
        else:
            parole[-1]["testo"] += tok
    durata = len(audio) / 16000
    for i, p in enumerate(parole):
        prossima = parole[i + 1]["inizio"] if i + 1 < len(parole) else min(p["inizio"] + 0.6, durata)
        p["fine"] = round(min(prossima, p["inizio"] + 1.0), 2)
    return [p for p in parole if p["testo"] and not set(p["testo"]) <= PUNTEGGIATURA]


if __name__ == "__main__":
    video, uscita = sys.argv[1], sys.argv[2]
    parole = trascrivi(video)
    with open(uscita, "w", encoding="utf-8") as f:
        json.dump(parole, f, ensure_ascii=False, indent=1)
    testo = " ".join(p["testo"] for p in parole)
    # solo un assaggio: il testo intero si legge dal JSON, a pezzi (token saver)
    print(f"{len(parole)} parole → {uscita}")
    print(testo if len(testo) <= 400 else testo[:400] + " …")
