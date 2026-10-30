"""Prepara un video (o una cartella di clip) in locale, prima che Claude lo guardi.

Uso: python3 prep_video.py girato/[titolo]/            → prep/ dentro la cartella
     python3 prep_video.py clip.mp4 --out cartella/
     FFMPEG=/percorso/ffmpeg python3 prep_video.py ...  (se ffmpeg non è nel PATH)

Scrive al massimo:
  riepilogo.md  una pagina: dati tecnici, tratti bui/mossi, volti, testo a schermo, audio
  foglio.jpg    un foglio provini (una clip: 40 frame; cartella: una riga da 8 frame per clip)
  volti.jpg     solo se Apple Vision trova volti: i volti ingranditi, per il controllo minori
I frame grezzi restano in prep/frame/ e NON vanno letti da Claude.
Serve solo ffmpeg. Volti e testo a schermo richiedono un Mac (Apple Vision, vision.swift).
"""
import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

QUI = pathlib.Path(__file__).resolve().parent
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
ESTENSIONI = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi"}
LATO_MAX = 1568          # oltre, l'immagine viene comunque rimpicciolita e i token non scendono
PASSO_VISION = 1.0       # secondi tra un frame analizzato e l'altro (solo in locale)
SOGLIA_BUIO = 45         # luminosità media (0-255) sotto cui un frame è "buio"
SOGLIA_MOSSO = 2.5       # "mosso" = blurdetect oltre 2,5 volte la mediana della clip


def ff(*argomenti, controlla=True):
    r = subprocess.run([FFMPEG, "-hide_banner", *argomenti], capture_output=True, text=True)
    if controlla and r.returncode:
        raise RuntimeError(r.stderr[-800:])
    return r


def info(video):
    err = ff("-i", str(video), controlla=False).stderr
    durata = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    d = int(durata[1]) * 3600 + int(durata[2]) * 60 + float(durata[3]) if durata else 0.0
    v = re.search(r"Video: .*?(\d{2,5})x(\d{2,5})", err)
    w, h = (int(v[1]), int(v[2])) if v else (0, 0)
    if re.search(r"rotation of -?90", err):
        w, h = h, w
    fps = re.search(r"([\d.]+) fps", err)
    return {"durata": d, "w": w, "h": h, "fps": float(fps[1]) if fps else 0.0,
            "audio": "Audio:" in err}


def token_immagine(w, h):
    # Stima del costo di un'immagine per Claude: circa (larghezza x altezza) / 750, dopo il ridimensionamento
    s = min(1.0, LATO_MAX / max(w, h), (1_150_000 / (w * h)) ** 0.5)
    return int(w * s * h * s / 750)


def misura(percorso):
    err = ff("-i", str(percorso), controlla=False).stderr
    m = re.search(r"Video: .*?(\d{2,5})x(\d{2,5})", err)
    return (int(m[1]), int(m[2])) if m else (0, 0)


def riduci(percorso):
    w, h = misura(percorso)
    if max(w, h) > LATO_MAX:
        tmp = percorso.with_name("_" + percorso.name)
        ff("-y", "-i", str(percorso), "-vf", f"scale={LATO_MAX if w >= h else -2}:{-2 if w >= h else LATO_MAX}",
           "-q:v", "3", str(tmp))
        tmp.replace(percorso)


def estrai_frame(video, cartella, passo):
    cartella.mkdir(parents=True, exist_ok=True)
    for f in cartella.glob("f_*.jpg"):
        f.unlink()
    ff("-y", "-i", str(video), "-vf", f"fps=1/{passo},scale='if(gt(iw,ih),960,-2)':'if(gt(iw,ih),-2,960)'",
       "-q:v", "4", str(cartella / "f_%04d.jpg"))
    return sorted(cartella.glob("f_*.jpg"))


def qualita(video, passo):
    """Luminosità (e nitidezza, se c'è blurdetect) di un frame ogni `passo` secondi."""
    for filtri in (f"fps=1/{passo},blurdetect,signalstats", f"fps=1/{passo},signalstats"):
        r = ff("-i", str(video), "-vf", filtri + ",metadata=print:file=-", "-an", "-f", "null", "-",
               controlla=False)
        if r.returncode == 0:
            break
    righe, cur = [], {}
    for riga in r.stdout.splitlines():
        if riga.startswith("frame:"):
            cur = {"t": float(re.search(r"pts_time:([\d.]+)", riga)[1])}
            righe.append(cur)
        elif "lavfi.signalstats.YAVG=" in riga:
            cur["luce"] = float(riga.split("=")[1])
        elif "lavfi.blur=" in riga:
            cur["mosso"] = float(riga.split("=")[1])
    return righe


def audio(video):
    r = ff("-i", str(video), "-af", "silencedetect=n=-35dB:d=0.7,ebur128", "-vn", "-f", "null", "-",
           controlla=False).stderr
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)
    silenzi = [(float(a), float(b)) for a, b in
               zip(re.findall(r"silence_start: ([\d.]+)", r), re.findall(r"silence_end: ([\d.]+)", r))]
    return {"lufs": float(lufs[-1]) if lufs else None, "silenzi": silenzi}


def vision(frame):
    """Apple Vision sul Mac; altrove restituisce None."""
    if sys.platform != "darwin" or not frame:
        return None
    binario = QUI / "vision"
    cmd = [str(binario)] if binario.exists() else ["swift", str(QUI / "vision.swift")]
    r = subprocess.run(cmd + [str(f) for f in frame], capture_output=True, text=True)
    if r.returncode:
        print("Apple Vision non disponibile:", r.stderr[-300:], file=sys.stderr)
        return None
    return {x["file"]: x for x in json.loads(r.stdout)}


def tratti(tempi, passo):
    """[1, 2, 3, 7] → '1-4 s, 7-8 s' (un tempo copre `passo` secondi)."""
    if not tempi:
        return "nessuno"
    gruppi, inizio, prec = [], tempi[0], tempi[0]
    for t in tempi[1:] + [None]:
        if t is None or t - prec > passo * 1.5:
            gruppi.append(f"{inizio:.0f}-{prec + passo:.0f} s")
            if t is not None:
                inizio = t
        if t is not None:
            prec = t
    return ", ".join(gruppi)


def si_toccano(a, b):
    return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]


def analizza(video, lavoro):
    i = info(video)
    passo = PASSO_VISION if i["durata"] <= 180 else i["durata"] / 180
    frame = estrai_frame(video, lavoro / "frame" / video.stem, passo)
    q = qualita(video, passo)
    a = audio(video) if i["audio"] else None
    v = vision(frame)

    buio = [x["t"] for x in q if x.get("luce", 255) < SOGLIA_BUIO]
    sfocature = sorted(x["mosso"] for x in q if x.get("mosso", float("nan")) == x.get("mosso"))
    mediana = sfocature[len(sfocature) // 2] if sfocature else 0
    mosso = [x["t"] for x in q if mediana and x.get("mosso", 0) > SOGLIA_MOSSO * mediana]
    volti, testi, coperti, candidati = [], {}, [], []
    if v is not None:
        for n, f in enumerate(frame):
            t, x = n * passo, v.get(f.name, {})
            if x.get("volti"):
                volti.append(t)
                grande = max(x["volti"], key=lambda b: b[2] * b[3])
                candidati.append((t, f, grande))
            for blocco in x.get("testo", []):
                testi.setdefault(blocco["t"].strip(), []).append(t)
                # zona della bocca: terzo inferiore del volto
                if any(si_toccano(blocco["box"], [b[0], b[1] + b[3] * 0.6, b[2], b[3] * 0.4]) for b in x["volti"]):
                    coperti.append(t)
    return {"video": video, "info": i, "passo": passo, "qualita": q, "audio": a, "vision": v is not None,
            "buio": buio, "mosso": mosso, "volti": volti, "testi": testi, "coperti": sorted(set(coperti)),
            "candidati_volto": candidati}


def foglio_singolo(video, i, uscita):
    verticale = i["h"] >= i["w"]
    colonne, righe = (8, 5) if verticale else (5, 8)
    n = colonne * righe
    if i["durata"] < n * 0.5:
        n = max(1, int(i["durata"] * 2))
        righe = -(-n // colonne)
    intervallo = i["durata"] / n
    larghezza = 190 if verticale else 300
    base = f"fps=1/{intervallo:.4f},scale={larghezza}:-2"
    scritta = ",drawtext=text='%{pts\\:hms}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6"
    for etichetta in (scritta, ""):
        r = ff("-y", "-i", str(video), "-vf", f"{base}{etichetta},tile={colonne}x{righe}",
               "-frames:v", "1", "-q:v", "3", str(uscita), controlla=False)
        if r.returncode == 0:
            break
    riduci(uscita)
    return f"{colonne} colonne x {righe} righe, un frame ogni {intervallo:.1f} s, da sinistra a destra"


def foglio_cartella(analisi, uscita, lavoro):
    file_righe = []
    for k, x in enumerate(analisi):
        riga = lavoro / f"_riga{k}.jpg"
        ff("-y", "-i", str(x["video"]), "-vf",
           f"fps=8/{max(x['info']['durata'], 0.1):.3f},scale=190:338:force_original_aspect_ratio=decrease,"
           "pad=190:338:(ow-iw)/2:(oh-ih)/2,tile=8x1", "-frames:v", "1", str(riga))
        file_righe.append(riga)
    ingressi = sum((["-i", str(r)] for r in file_righe), [])
    filtro = "".join(f"[{k}]" for k in range(len(file_righe))) + f"vstack=inputs={len(file_righe)}"
    if len(file_righe) == 1:
        filtro = "null"
    ff("-y", *ingressi, "-filter_complex", filtro, "-q:v", "3", str(uscita))
    for r in file_righe:
        r.unlink()
    riduci(uscita)
    return "una riga per clip (nell'ordine del riepilogo), 8 frame distribuiti su tutta la durata"


def foglio_volti(candidati, uscita, lavoro):
    """Fino a 12 volti ingranditi, distribuiti nel tempo, con il secondo e la clip."""
    if not candidati:
        return []
    scelti = candidati if len(candidati) <= 12 else [candidati[round(k * (len(candidati) - 1) / 11)] for k in range(12)]
    for f in lavoro.glob("_volto*.jpg"):
        f.unlink()
    for k, (nome, t, f, b) in enumerate(scelti, 1):
        fw, fh = misura(f)
        x, y = max(0, (b[0] - b[2] * 0.4) * fw), max(0, (b[1] - b[3] * 0.4) * fh)
        w, h = min(fw - x, b[2] * 1.8 * fw), min(fh - y, b[3] * 1.8 * fh)
        ff("-y", "-i", str(f), "-vf", f"crop={int(w)}:{int(h)}:{int(x)}:{int(y)},"
           "scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2",
           str(lavoro / f"_volto{k:02d}.jpg"))
    ff("-y", "-start_number", "1", "-i", str(lavoro / "_volto%02d.jpg"), "-vf", "tile=4x3",
       "-frames:v", "1", "-q:v", "3", str(uscita))
    for f in lavoro.glob("_volto*.jpg"):
        f.unlink()
    return [f"{nome} {t:.0f}s" for nome, t, _, _ in scelti]


def sezione(x):
    i, righe = x["info"], []
    righe.append(f"### {x['video'].name}")
    righe.append(f"- {i['durata']:.1f} s · {i['w']}x{i['h']} ({'verticale' if i['h'] >= i['w'] else 'orizzontale'})"
                 f" · {i['fps']:g} fps · audio {'sì' if i['audio'] else 'NO'}")
    righe.append(f"- Bui (luce < {SOGLIA_BUIO}): {tratti(x['buio'], x['passo'])}")
    if any("mosso" in q for q in x["qualita"]):
        righe.append(f"- Mossi/sfocati: {tratti(x['mosso'], x['passo'])}")
    if x["audio"]:
        lufs = x["audio"]["lufs"]
        sil = ", ".join(f"{a:.1f}-{b:.1f}" for a, b in x["audio"]["silenzi"][:8]) or "nessuno"
        righe.append(f"- Audio: {lufs if lufs is not None else '?'} LUFS (obiettivo -14) · silenzi: {sil}")
    if x["vision"]:
        righe.append(f"- Volti: {tratti(x['volti'], x['passo'])}")
        if x["coperti"]:
            righe.append(f"- ⚠️ Testo sopra la bocca: {tratti(x['coperti'], x['passo'])}")
        testi = sorted(x["testi"].items(), key=lambda kv: kv[1][0])[:10]
        for t, tempi in testi:
            righe.append(f"- Testo a schermo {tempi[0]:.0f}-{tempi[-1] + x['passo']:.0f} s: «{t[:80]}»")
    return righe


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("sorgente", type=pathlib.Path)
    p.add_argument("--out", type=pathlib.Path)
    a = p.parse_args()

    if a.sorgente.is_dir():
        video = sorted(f for f in a.sorgente.iterdir() if f.suffix.lower() in ESTENSIONI)
        uscita = a.out or a.sorgente / "prep"
    else:
        video = [a.sorgente]
        uscita = a.out or a.sorgente.with_name(a.sorgente.stem + "-prep")
    if not video:
        sys.exit("Nessun video trovato.")
    uscita.mkdir(parents=True, exist_ok=True)

    analisi = [analizza(v, uscita) for v in video]
    immagini = []
    if len(analisi) == 1:
        legenda = foglio_singolo(video[0], analisi[0]["info"], uscita / "foglio.jpg")
    else:
        legenda = foglio_cartella(analisi[:6], uscita / "foglio.jpg", uscita)
    immagini.append(("foglio.jpg", legenda))

    candidati = [(x["video"].stem, t, f, b) for x in analisi for t, f, b in x["candidati_volto"]]
    elenco_volti = foglio_volti(candidati, uscita / "volti.jpg", uscita)
    if elenco_volti:
        immagini.append(("volti.jpg", "4x3 volti ingranditi: " + ", ".join(elenco_volti)))
    elif len(analisi) > 6:
        foglio_cartella(analisi[6:12], uscita / "volti.jpg", uscita)
        (uscita / "volti.jpg").rename(uscita / "foglio-2.jpg")
        immagini.append(("foglio-2.jpg", "clip dalla 7 alla 12, una riga per clip"))

    totale = sum(token_immagine(*misura(uscita / n)) for n, _ in immagini)
    righe = [f"# Riepilogo video: {a.sorgente.name}", ""]
    righe.append("Leggi questa pagina e le immagini elencate. NON leggere i frame in `frame/`.")
    if not analisi[0]["vision"]:
        righe.append("Apple Vision non usato (serve un Mac): volti e testo a schermo vanno controllati sul foglio.")
    righe.append("")
    righe.append("## Immagini")
    for n, legenda in immagini:
        righe.append(f"- `{n}` ({token_immagine(*misura(uscita / n))} token circa): {legenda}")
    if len(analisi) > 12:
        righe.append(f"- Le clip dalla 13 in poi non sono nei fogli: lancia di nuovo su una sottocartella.")
    righe.append("")
    righe.append("## Clip")
    for x in analisi:
        righe += sezione(x)
    righe += ["", f"_Costo per Claude: questa pagina + {totale} token di immagini._"]
    (uscita / "riepilogo.md").write_text("\n".join(righe) + "\n", encoding="utf-8")
    print(f"Pronto: {uscita / 'riepilogo.md'} + {', '.join(n for n, _ in immagini)} (~{totale} token di immagini)")


if __name__ == "__main__":
    main()
