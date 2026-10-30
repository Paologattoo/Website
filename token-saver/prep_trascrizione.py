"""Riduce una trascrizione lunga a una pagina, prima che Claude la legga.

Uso: python3 prep_trascrizione.py podcast.mp4            (trascrive in locale con remotion/trascrivi.py)
     python3 prep_trascrizione.py parole.json            (uscita di trascrivi.py o JSON di Whisper)
     python3 prep_trascrizione.py sottotitoli.srt  [--out cartella/]

Scrive:
  riepilogo.md  una pagina: dati, indice per blocchi con parole chiave, migliori candidati clip
  frasi.tsv     una frase per riga "inizio<TAB>fine<TAB>testo": da cercare con grep/awk,
                MAI da leggere tutto (es. awk -F'\\t' '$1>=600 && $1<=660' frasi.tsv)
"""
import argparse
import collections
import json
import pathlib
import re
import sys

QUI = pathlib.Path(__file__).resolve().parent
CLIP_MIN, CLIP_MAX = 20, 60          # durata dei candidati clip, in secondi
N_CANDIDATI = 8
RIGHE_INDICE = 20

VUOTE = set("""a ad al alla alle allo agli ai anche ancora avere aveva c che chi ci come con cosa così da dal dalla
dei del della delle dello di dire dopo e è ed era essere fa fare gli ha hanno ho i il in io la le lei li lo loro lui ma
me mi molto ne nei nel nella no noi non o per perché più poi può qua quando quel quella quelle quello questa queste
questo qui se si sì sia siamo sono su sua sue suo sul sulla ti tra tu tutto tutti un una uno va vi voi è fatto quindi
stato stata detto dice dico cioè tipo insomma diciamo allora proprio però niente eh ehm mh beh okay ok""".split())
RIEMPITIVI = {"ehm", "eh", "mh", "cioè", "tipo", "insomma", "diciamo", "praticamente", "comunque", "boh"}
FORTI = set("""mai sempre nessuno tutti niente segreto errore sbagliato verità incredibile problema paura sogno amore
odio guerra soldi gratis primo ultimo unico importante morte vita libertà rivoluzione follia assurdo pazzesco
dimenticare ricordo ricordo figli mamma papà famiglia""".split())


def secondi(s):
    h, m, r = s.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(r)


def carica(sorgente):
    """Restituisce una lista di (inizio, fine, testo) a livello di parola o di segmento."""
    if sorgente.suffix.lower() == ".srt":
        blocchi = re.split(r"\n\s*\n", sorgente.read_text(encoding="utf-8-sig"))
        uscita = []
        for b in blocchi:
            m = re.search(r"([\d:,.]+)\s*-->\s*([\d:,.]+)\s*\n(.*)", b, re.S)
            if m:
                uscita.append((secondi(m[1]), secondi(m[2]), " ".join(m[3].split())))
        return uscita
    if sorgente.suffix.lower() == ".json":
        dati = json.loads(sorgente.read_text(encoding="utf-8"))
        if isinstance(dati, list):                                      # trascrivi.py
            return [(p["inizio"], p["fine"], p["testo"]) for p in dati]
        segmenti = dati.get("segments", [])                             # Whisper
        if segmenti and segmenti[0].get("words"):
            return [(w["start"], w["end"], w["word"].strip()) for s in segmenti for w in s["words"]]
        return [(s["start"], s["end"], s["text"].strip()) for s in segmenti]
    # altrimenti è un video o un audio: trascrizione locale, senza stampare il testo
    sys.path.insert(0, str(QUI.parent / "remotion"))
    from trascrivi import trascrivi
    parole = trascrivi(str(sorgente))
    salvate = sorgente.with_name(sorgente.stem + "-parole.json")
    salvate.write_text(json.dumps(parole, ensure_ascii=False), encoding="utf-8")
    return [(p["inizio"], p["fine"], p["testo"]) for p in parole]


def in_frasi(pezzi):
    """Unisce parole o segmenti in frasi: si chiude sulla punteggiatura forte o su una pausa lunga."""
    frasi, cur = [], []
    for k, (a, b, t) in enumerate(pezzi):
        cur.append((a, b, t))
        pausa = pezzi[k + 1][0] - b if k + 1 < len(pezzi) else 9
        if re.search(r"[.?!…]$", t) or pausa > 1.2 or len(cur) > 60:
            frasi.append({"inizio": cur[0][0], "fine": cur[-1][1], "testo": " ".join(x[2] for x in cur),
                          "pausa_dopo": pausa})
            cur = []
    return frasi


def parole_di(testo):
    return re.findall(r"[a-zàèéìòù0-9']+", testo.lower())


def punteggio(frasi):
    """Più alto = clip più adatta: frasi complete, numeri, domande, parole forti, pochi riempitivi."""
    testo = " ".join(f["testo"] for f in frasi)
    p = parole_di(testo)
    if not p:
        return 0
    durata = frasi[-1]["fine"] - frasi[0]["inizio"]
    densita = 30 / max(durata, 1)                                       # conteggi riportati a 30 s
    s = densita * (2 * len(re.findall(r"\d", testo)) ** 0.5 + 1.5 * testo.count("?") + testo.count("!")
                   + 2 * sum(w in FORTI for w in p))
    s -= 3 * sum(w in RIEMPITIVI for w in p) / len(p) * 10
    s += 2 if re.search(r"[.?!…]$", frasi[-1]["testo"]) else -2          # finisce su una frase chiusa
    s += 1 if frasi[0]["testo"][:1].isupper() else 0                     # comincia su una frase nuova
    s += 1 if 25 <= durata <= 45 else 0
    return s


def candidati(frasi):
    finestre = []
    for i in range(len(frasi)):
        for j in range(i, len(frasi)):
            d = frasi[j]["fine"] - frasi[i]["inizio"]
            if d > CLIP_MAX:
                break
            if d >= CLIP_MIN:
                finestre.append((punteggio(frasi[i:j + 1]), i, j))
    scelte, usate = [], set()
    for s, i, j in sorted(finestre, reverse=True):
        if usate.isdisjoint(range(i, j + 1)):
            scelte.append((s, i, j))
            usate.update(range(i, j + 1))
        if len(scelte) == N_CANDIDATI:
            break
    return sorted(scelte, key=lambda x: x[1])


def mmss(t):
    return f"{int(t // 60)}:{int(t % 60):02d}"


def indice(frasi, durata):
    blocco = max(60, -(-durata // RIGHE_INDICE // 30) * 30)              # multiplo di 30 s
    gruppi = collections.defaultdict(list)
    for f in frasi:
        gruppi[int(f["inizio"] // blocco)].append(f)
    righe = []
    for k in sorted(gruppi):
        p = [w for f in gruppi[k] for w in parole_di(f["testo"]) if w not in VUOTE and len(w) > 3]
        chiave = ", ".join(w for w, _ in collections.Counter(p).most_common(4))
        inizio = " ".join(gruppi[k][0]["testo"].split()[:10])
        righe.append(f"- **{mmss(k * blocco)}** {chiave} — «{inizio}…»")
    return blocco, righe


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("sorgente", type=pathlib.Path)
    a.add_argument("--out", type=pathlib.Path)
    arg = a.parse_args()
    uscita = arg.out or arg.sorgente.with_name(arg.sorgente.stem + "-prep")
    uscita.mkdir(parents=True, exist_ok=True)

    pezzi = [x for x in carica(arg.sorgente) if x[2]]
    if not pezzi:
        sys.exit("Trascrizione vuota.")
    frasi = in_frasi(pezzi)
    durata = frasi[-1]["fine"]
    n_parole = sum(len(f["testo"].split()) for f in frasi)
    riempitivi = sum(w in RIEMPITIVI for f in frasi for w in parole_di(f["testo"]))
    pause = [f for f in frasi if f["pausa_dopo"] > 2 and f["pausa_dopo"] < 9]

    with open(uscita / "frasi.tsv", "w", encoding="utf-8") as f:
        for x in frasi:
            f.write(f"{x['inizio']:.2f}\t{x['fine']:.2f}\t{x['testo']}\n")

    blocco, righe_indice = indice(frasi, durata)
    righe = [f"# Riepilogo trascrizione: {arg.sorgente.name}", "",
             f"{mmss(durata)} · {n_parole} parole · {n_parole / max(durata, 1) * 60:.0f} parole/min · "
             f"{len(frasi)} frasi · {riempitivi} riempitivi · {len(pause)} pause oltre 2 s", "",
             "Testo completo in `frasi.tsv` (inizio, fine, testo): NON leggerlo tutto, cerca solo i tratti che servono:",
             "`awk -F'\\t' '$1>=600 && $1<=660' frasi.tsv` oppure `grep -i 'parola' frasi.tsv`.", "",
             f"## Candidati clip ({CLIP_MIN}-{CLIP_MAX} s, punteggio automatico: da verificare)"]
    for s, i, j in candidati(frasi):
        testo = " ".join(f["testo"] for f in frasi[i:j + 1]).split()
        apertura = " ".join(testo[:18]) + ("…" if len(testo) > 18 else "")
        righe.append(f"- **{frasi[i]['inizio']:.1f}-{frasi[j]['fine']:.1f} s** ({mmss(frasi[i]['inizio'])}, "
                     f"{frasi[j]['fine'] - frasi[i]['inizio']:.0f} s, punti {s:.0f}): «{apertura}»")
    righe += ["", f"## Indice (un blocco ogni {blocco // 60:g} min)"] + righe_indice
    (uscita / "riepilogo.md").write_text("\n".join(righe) + "\n", encoding="utf-8")
    print(f"Pronto: {uscita / 'riepilogo.md'} e {uscita / 'frasi.tsv'}")


if __name__ == "__main__":
    main()
