"""Genera le immagini di sfondo del video PistisSophia, tutte con il codice (niente IA).

Uso: python3 strumenti/genera-immagini-pistis.py   (da remotion/)
Scrive in public/pistis/: pleroma, gabbia, nebulosa, abisso, caos, oro, citta, tunnel, luce (.jpg)
Le figure (Sophia, Demiurgo, Arconti, uomo, meditante) sono disegnate e animate in
src/PistisSophiaVideo.tsx.
"""
import math
import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1440, 2560
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "pistis"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


# ── utilità ────────────────────────────────────────────────────────────────
def fbm(w=W, h=H, ottave=7, base=4, persistenza=0.55, seme=0):
    """Rumore frattale 0..1 (value noise ingrandito bicubico, più ottave)."""
    r = np.random.default_rng(seme)
    tot = np.zeros((h, w), np.float32)
    amp, somma = 1.0, 0.0
    for o in range(ottave):
        gw, gh = base * 2**o, int(base * 2**o * h / w) + 1
        g = Image.fromarray((r.random((gh, gw)) * 255).astype(np.uint8))
        tot += amp * np.asarray(g.resize((w, h), Image.BICUBIC), np.float32) / 255
        somma += amp
        amp *= persistenza
    tot /= somma
    return (tot - tot.min()) / (np.ptp(tot) + 1e-6)


def griglia():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    return (x - W / 2) / W, (y - H / 2) / W  # x in [-0.5,0.5], y in ~[-0.9,0.9]


def colora(t, stops):
    """Mappa t (0..1) su una scala di colori [(pos, (r,g,b)), ...]."""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (t >= p0) & (t <= p1)
        k = ((t - p0) / max(p1 - p0, 1e-6))[m][:, None]
        out[m] = np.array(c0) * (1 - k) + np.array(c1) * k
    return out


def bagliore(img, raggio=40, forza=0.8):
    a = img.astype(np.float32)
    b = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(raggio)), np.float32)
    return a + b * forza


def stelle(img, n=2500, seme=1, colore=(255, 255, 255)):
    r = np.random.default_rng(seme)
    a = img.astype(np.float32)
    ys, xs = r.integers(0, H, n), r.integers(0, W, n)
    lum = r.random(n) ** 3
    strato = np.zeros_like(a)
    strato[ys, xs] = np.array(colore)[None, :] * lum[:, None] * 2.2
    strato = bagliore(strato, 2, 1.5)
    return a + strato


def vignetta(img, forza=0.7):
    x, y = griglia()
    d = np.sqrt(x**2 + (y * 0.6) ** 2)
    return img * (1 - forza * np.clip(d * 1.5, 0, 1) ** 2)[..., None]


def salva(nome, a):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT / f"{nome}.jpg", quality=90)
    print("✓", nome)


# ── 1. Pleroma: frattale di Julia di luce ──────────────────────────────────
def pleroma():
    x, y = griglia()
    z = (x * 1.7 + 1j * y * 1.7).astype(np.complex64)
    c = np.complex64(-0.8 + 0.156j)
    n = np.zeros(z.shape, np.float32)
    vivo = np.ones(z.shape, bool)
    for i in range(160):
        z[vivo] = z[vivo] ** 2 + c
        fuori = vivo & (np.abs(z) > 4)
        n[fuori] = i + 1 - np.log2(np.log(np.abs(z[fuori]) + 1e-6) + 1e-6)
        vivo &= ~fuori
    t = np.sqrt(np.clip(n, 0, None) / 160)
    t[vivo] = 1
    col = colora(t, [(0, (8, 4, 30)), (0.25, (70, 30, 140)), (0.45, (200, 120, 255)), (0.65, (255, 210, 120)), (0.85, (255, 250, 230)), (1, (255, 255, 255))])
    nebbia = fbm(seme=3)[..., None] * np.array([60, 40, 110])
    a = bagliore(col + nebbia, 50, 0.9)
    salva("pleroma", stelle(vignetta(a, 0.5), 1800))


# ── 2. Gabbia: pianeta chiuso in una griglia digitale ──────────────────────
def gabbia():
    base = fbm(seme=11)[..., None] * np.array([0, 40, 50]) + np.array([2, 8, 14])
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    linee = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(linee)
    cx, cy, R = W / 2, H * 0.47, 560
    # pianeta scuro
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(6, 22, 30))
    # meridiani e paralleli della gabbia
    for k in range(-8, 9):
        ry = abs(R * k / 9)
        d.ellipse([cx - R * math.cos(math.asin(min(1, ry / R))), cy - ry, cx + R * math.cos(math.asin(min(1, ry / R))), cy + ry], outline=(0, 255, 210), width=3)
    for k in range(1, 12):
        rx = R * abs(math.cos(math.pi * k / 12))
        d.ellipse([cx - rx, cy - R, cx + rx, cy + R], outline=(0, 255, 210), width=3)
    # pavimento prospettico
    orizzonte = H * 0.78
    for k in range(-30, 31):
        d.line([cx + k * 20, orizzonte, cx + k * 260, H], fill=(0, 200, 180), width=2)
    for k in range(18):
        yy = orizzonte + (H - orizzonte) * (k / 18) ** 2
        d.line([0, yy, W, yy], fill=(0, 200, 180), width=2)
    # sbarre verticali
    for k in range(0, W, 120):
        d.line([k, 0, k, H], fill=(0, 120, 120), width=2)
    l = bagliore(np.asarray(linee, np.float32), 18, 1.6)
    a = np.asarray(img, np.float32) + l
    salva("gabbia", stelle(vignetta(a, 0.6), 900, colore=(150, 255, 240)))


# ── 3. Nebulosa viola/oro con luce dall'alto (cielo di Sophia) ─────────────
def nebulosa():
    n1, n2 = fbm(seme=21), fbm(seme=22, base=3)
    x, y = griglia()
    col = colora(n1 * 0.7 + n2 * 0.3, [(0, (3, 2, 15)), (0.45, (40, 15, 90)), (0.65, (140, 60, 200)), (0.8, (255, 170, 120)), (1, (255, 240, 220))])
    luce = np.exp(-((x * 3) ** 2) - ((y + 0.9) * 2.2) ** 2)[..., None] * np.array([255, 235, 200]) * 1.4
    raggi = (0.5 + 0.5 * np.sin(np.arctan2(y + 1.0, x) * 40)) ** 6 * np.exp(-((y + 0.9) * 1.6) ** 2)
    a = col * (0.4 + 0.9 * n2[..., None]) + luce + raggi[..., None] * np.array([120, 100, 160])
    salva("nebulosa", stelle(vignetta(bagliore(a, 40, 0.6), 0.5), 3000))


# ── 4. Abisso: vortice a spirale verso il Caos ─────────────────────────────
def abisso():
    x, y = griglia()
    r = np.sqrt(x**2 + (y * 0.8) ** 2) + 1e-4
    th = np.arctan2(y, x)
    n = fbm(seme=31)
    spirale = 0.5 + 0.5 * np.sin(th * 5 + np.log(r) * 9 + n * 6)
    t = spirale**3 * np.clip(r * 2.2, 0, 1) * (0.5 + n)
    col = colora(t, [(0, (0, 0, 0)), (0.3, (25, 5, 45)), (0.6, (90, 30, 150)), (0.85, (190, 120, 255)), (1, (255, 230, 255))])
    a = bagliore(col, 30, 0.7)
    salva("abisso", stelle(a * np.clip(r * 3, 0.15, 1)[..., None], 1500, colore=(220, 200, 255)))


# ── 5. Caos rosso: fumo e fuoco ────────────────────────────────────────────
def caos():
    x, y = griglia()
    n = fbm(seme=41, base=3)
    n2 = fbm(seme=42, base=6)
    fuoco = np.clip((y + 0.2) * 1.4, 0, 1)
    t = n * 0.6 + n2 * 0.4
    col = colora(t * (0.4 + fuoco[..., None][..., 0]), [(0, (0, 0, 0)), (0.35, (40, 0, 0)), (0.6, (150, 10, 5)), (0.8, (255, 80, 10)), (1, (255, 210, 120))])
    salva("caos", vignetta(bagliore(col, 35, 0.8), 0.7))


# ── 6. Oro: pelle scura con crepe d'oro fuso (la scintilla) ────────────────
def oro():
    w2, h2 = W // 3, H // 3
    pts = rng.random((70, 2)) * [w2, h2]
    yy, xx = np.mgrid[0:h2, 0:w2].astype(np.float32)
    dist = np.sqrt((xx[None] - pts[:, 0, None, None]) ** 2 + (yy[None] - pts[:, 1, None, None]) ** 2)
    dist.sort(axis=0)
    bordo = np.exp(-(dist[1] - dist[0]) / 2.0)
    bordo = np.asarray(Image.fromarray((bordo * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
    x, y = griglia()
    centro = np.exp(-(x**2 + (y + 0.05) ** 2) * 9)
    pelle = fbm(seme=51)[..., None] * np.array([30, 22, 18]) + 6
    crepe = (bordo * (0.25 + 1.2 * centro))[..., None] * np.array([255, 180, 50])
    nucleo = (centro**3)[..., None] * np.array([255, 230, 150]) * 1.4
    a = bagliore(pelle + crepe + nucleo, 45, 1.0)
    salva("oro", stelle(a, 700, colore=(255, 200, 90)))


# ── 7. Città oscura e opprimente ───────────────────────────────────────────
def citta():
    x, y = griglia()
    cielo = colora((y + 0.9) / 1.8, [(0, (8, 10, 14)), (0.6, (35, 38, 46)), (1, (60, 55, 60))])
    cielo += fbm(seme=61)[..., None] * 25
    img = Image.fromarray(np.clip(cielo, 0, 255).astype(np.uint8))
    for livello, (alt, colore_base, nebbia) in enumerate([(0.45, (30, 33, 40), 40), (0.6, (18, 20, 26), 20), (0.78, (6, 7, 10), 0)]):
        s = Image.new("RGBA", (W, H))
        d = ImageDraw.Draw(s)
        xx = -40
        while xx < W:
            lw = int(rng.integers(90, 260))
            top = int(H * (1 - alt) + rng.integers(-300, 250))
            d.rectangle([xx, top, xx + lw, H], fill=colore_base + (255,))
            for wy in range(top + 30, H, 46):
                for wx in range(xx + 14, xx + lw - 20, 34):
                    if rng.random() < 0.18:
                        c = (255, 200, 120) if rng.random() < 0.7 else (160, 220, 255)
                        lum = 0.35 + 0.65 * (livello / 2)
                        d.rectangle([wx, wy, wx + 14, wy + 22], fill=tuple(int(v * lum) for v in c) + (255,))
            xx += lw + int(rng.integers(0, 30))
        img = Image.alpha_composite(img.convert("RGBA"), s).convert("RGB")
        if nebbia:
            a = np.asarray(img, np.float32) + fbm(seme=70 + livello)[..., None] * nebbia
            img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    a = np.asarray(img, np.float32)
    # schermi rossi di sorveglianza
    for _ in range(5):
        sx, sy = int(rng.integers(100, W - 300)), int(rng.integers(int(H * 0.35), int(H * 0.6)))
        a[sy:sy + 120, sx:sx + 200] = a[sy:sy + 120, sx:sx + 200] * 0.3 + np.array([180, 20, 20])
    # pioggia
    pioggia = Image.new("L", (W, H))
    d = ImageDraw.Draw(pioggia)
    for _ in range(2500):
        px, py = rng.integers(0, W), rng.integers(0, H)
        d.line([px, py, px - 12, py + 60], fill=int(rng.integers(40, 110)), width=1)
    a += np.asarray(pioggia, np.float32)[..., None] * 0.6
    salva("citta", vignetta(bagliore(a, 25, 0.5), 0.6))


# ── 8. Tunnel di luce (con anelli meccanici: la trappola) ──────────────────
def tunnel():
    x, y = griglia()
    r = np.sqrt(x**2 + (y * 0.75) ** 2) + 1e-4
    th = np.arctan2(y, x)
    prof = 1 / r
    anelli = (0.5 + 0.5 * np.sin(prof * 9)) ** 8
    tacche = (0.5 + 0.5 * np.sin(th * 48)) ** 20 * anelli
    luce = np.exp(-r * 6)
    t = np.clip(luce * 1.6 + anelli * 0.25 * np.clip(r * 3, 0, 1) + tacche * 0.4, 0, 1)
    col = colora(t, [(0, (10, 20, 40)), (0.3, (80, 140, 200)), (0.6, (190, 225, 255)), (1, (255, 255, 255))])
    salva("tunnel", bagliore(col, 40, 0.9))


# ── 9. Luce pura del risveglio ─────────────────────────────────────────────
def luce():
    x, y = griglia()
    r = np.sqrt(x**2 + y**2) + 1e-4
    th = np.arctan2(y, x)
    raggi = (0.5 + 0.5 * np.sin(th * 26 + fbm(seme=91)[...] * 3)) ** 4
    t = np.clip(np.exp(-r * 2.2) * 1.3 + raggi * np.exp(-r * 1.2) * 0.5, 0, 1)
    col = colora(t, [(0, (40, 20, 70)), (0.4, (200, 160, 255)), (0.7, (255, 235, 200)), (1, (255, 255, 255))])
    salva("luce", stelle(bagliore(col, 30, 0.6), 1200, colore=(255, 240, 210)))


if __name__ == "__main__":
    for f in (pleroma, gabbia, nebulosa, abisso, caos, oro, citta, tunnel, luce):
        f()
