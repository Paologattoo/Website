"""Mix del film: voce + musica (organo, campane, arpa, vetro, tutto sintetizzato) + effetti → out/mix.wav
Uso:  LIB=/opt/tools/lemo-opuscar $LIB/.venv/bin/python mix.py
Gli effetti di vetro (glass_tink, glass_crack, grind, weld) vengono da Lemo-Opuscar (styles/stained-glass/demo/mix.py, MIT)."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/opt/tools/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, bp, lp, hp, noise, norm, compress, limit, add, roar as sfx_roar, thump
from scipy.signal import fftconvolve, lfilter

D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; EV = E['ev']
N = int(DUR * SR); rng = np.random.default_rng(7)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); vo = np.zeros((N, 2))
T = {}
for e in EV: T.setdefault(e['type'], []).append(e['t'])

def hall_ir(d=3.2, damp=2400, pre=.025):
    n = int(d * SR); e = np.exp(-np.arange(n) / SR / (d / 6.9))
    ir = np.stack([lp(rng.standard_normal(n), damp) * e, lp(rng.standard_normal(n), damp) * e], 1)
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir]); ir[0] = 1; return ir / np.abs(ir).sum(0) * 5
def verb(x, ir, mix=.35):
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1); return x * (1 - mix) + y * mix
HALL = hall_ir()
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ───────── strumenti ─────────
def organo(m, d, v=.3, reg='flauto', att=.35, rel=.8):
    """canna d'organo: armoniche + leggero tremolo; reg = flauto (dolce) / pieno / pedale"""
    t = t_(d + rel); f = hz(m); y = np.zeros_like(t)
    parz = {'flauto': [(1, 1), (2, .25), (3, .08)], 'pieno': [(1, 1), (2, .7), (3, .5), (4, .35), (6, .2), (8, .12)], 'pedale': [(1, 1), (2, .5), (3, .2), (4, .1)]}[reg]
    for r, a in parz: y += a * np.sin(2 * np.pi * f * r * t * (1 + .0015 * np.sin(2 * np.pi * 5.2 * t)) + rng.uniform(0, 6))
    y += .02 * bp(noise(d + rel), f, min(f * 6, 9000))   # soffio
    e = np.clip(t / att, 0, 1) * np.clip((d + rel - t) / rel, 0, 1)
    return y * e * v / len(parz) ** .5
def campana(m, v=.5, d=6.):
    t = t_(d); f = hz(m); y = np.zeros_like(t)
    for r, a, tau in [(.5, .6, 2.2), (1, 1, 1.6), (1.19, .5, 1.1), (1.5, .45, .9), (2, .5, .7), (2.74, .3, .45), (3.76, .2, .3)]:
        y += a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6)) * np.exp(-t / tau)
    return y * v * .3 * np.clip(t / .004, 0, 1)
def arpa(m, v=.4, d=2.5):
    # Karplus-Strong come filtro IIR (vettoriale): y[n] = x[n] + .498 (y[n-N] + y[n-N-1])
    f = hz(m); n = int(SR / f); x = np.zeros(int(d * SR)); x[:n] = rng.uniform(-1, 1, n)
    a = np.zeros(n + 2); a[0] = 1; a[n] = a[n + 1] = -.498
    return lp(lfilter([1.0], a, x), 5000) * v * .5
def glass_tink(v=1., f0=None, d=1.2, bright=1.):
    f0 = f0 or rng.uniform(2300, 3400); t = t_(d); y = np.zeros_like(t)
    for r, a, tau in [(1, 1, .5), (2.32, .6, .32), (4.25, .38, .2), (6.63, .22, .12), (9.38, .12, .07)]:
        y += a * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t / (tau * d))
    y += .25 * hp(noise(d), 5000) * np.exp(-t / .004) * bright
    return y * v * .35
def glass_crack(v=1.):
    d = 2.6; t = t_(d); y = hp(noise(d), 1500) * np.exp(-t / .03) * 1.2 + bp(noise(d), 180, 900) * np.exp(-t / .06) * .9
    for k in range(40):
        at = rng.uniform(0, .28) if k < 14 else rng.uniform(.2, 1.8); n0 = int(at * SR)
        s = glass_tink(rng.uniform(.25, .8) * (1 if k < 14 else .5), rng.uniform(2500, 6200), rng.uniform(.25, .7)); y[n0:n0 + len(s)] += s[:len(y) - n0]
    return y * v
def grind(d=.6, v=1.):
    t = t_(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7
    y = bp(noise(d), 1800, 5200) * .5 * (1 + .6 * np.sin(2 * np.pi * 23 * t)) + .12 * np.sin(2 * np.pi * (1900 + 200 * np.sin(2 * np.pi * 1.3 * t)) * t) * e
    return y * e * v
def weld(v=1.):
    d = .7; t = t_(d); y = hp(noise(d), 3500) * np.exp(-t / .12) * .45; g = glass_tink(.5, 3000, .6); y[:len(g)] += g[:len(y)]; return y * v
def ferro(v=1.):   # sbarra di ferro che cade: colpo + parziali metalliche
    d = 2.5; t = t_(d); y = thump(1.0, 55)[:len(t)] if len(thump(1.0, 55)) >= len(t) else np.pad(thump(1.0, 55), (0, len(t) - len(thump(1.0, 55))))
    for r, a, tau in [(1, 1, .9), (2.76, .6, .5), (5.4, .4, .3), (8.9, .25, .2)]: y = y + a * .5 * np.sin(2 * np.pi * 180 * r * t) * np.exp(-t / tau)
    return y * v
def vento(d, v=.1): return lp(np.cumsum(noise(d)) * .002, 600) * v + bp(noise(d), 200, 900) * v * .3

def put(buf, x, at, g=1., pan=0.): add(buf, x, at, g, pan)

# ───────── letto: aria nella sala di pietra ─────────
amb = vento(DUR, .25); amb = amb / (np.abs(amb).max() + 1e-9) * .05
fx[:, 0] += amb; fx[:, 1] += np.roll(amb, 4000)

# ───────── musica (Re dorico, quinte vuote, bordoni) ─────────
D2, A2, D3, A3, D4, F4, G4, A4, C5, D5, E5, A5 = 38, 45, 50, 57, 62, 65, 67, 69, 72, 74, 76, 81
bars, roar_t, arc_t, spark_t, tun_t, lie_t, crack_t = T['bars'][0], T['roar'][0], T['archons'][0], T['spark'][0], T['light'][2], T['lie'][0], T['crack'][0]
fall_t = T['fall'][0]
# 1 · Pleroma: flauti acuti e campanelli di vetro, poi le sbarre e il bordone basso
for m in (D5, A5, 86): put(mus, organo(m, bars - .3, .16, 'flauto', 1.5, .4), .1)
for k in range(10): put(mus, glass_tink(.35, hz([86, 88, 93, 91, 86, 93][k % 6]), 2.2, .3), .6 + k * .75, pan=(k % 3 - 1) * .4)
for m in (D2, A2, D3): put(mus, organo(m, 15 - bars + 1, .22, 'pedale', .2, 1.2), bars)
# 2 · Sophia: melodia dorica su flauto, poi la caduta su arpa discendente
mel = [(15.5, D4, 1.5), (17, F4, 1), (18, G4, 1), (19, A4, 2.5), (21.5, C5, 1), (22.5, A4, 1.5), (24, G4, 1), (25, A4, 3)]
for t0, m, d in mel:
    if t0 < fall_t - .3: put(mus, organo(m + 12, d, .13, 'flauto', .15, .6), t0, pan=.15)
for m in (D3, A3): put(mus, organo(m, fall_t - 15, .12, 'flauto', 1., 1.), 15)
for k, m in enumerate([86, 84, 81, 79, 77, 76, 74, 72, 69, 67, 65, 64, 62, 60, 57, 55, 53, 50]): put(mus, arpa(m, .32), fall_t + k * .42, pan=np.sin(k) * .5)
for m in (D2, 39): put(mus, organo(m, 35 - fall_t - 2, .16, 'pedale', 2, 1), fall_t + 2)
# 3 · Demiurgo: pedale profondo, timpani; silenzio prima del ruggito; accordo dissonante sugli Arconti
for m in (26, 33): put(mus, organo(m, roar_t - 36.5, .3, 'pedale', 1.5, .3), 35.5)
for k in range(int((roar_t - 37) / .9)): put(mus, thump(.5, 52), 36 + k * .9)
put(mus, organo(D2, 2, .5, 'pieno', .02, 2.5) + organo(39, 2, .4, 'pieno', .02, 2.5)[:len(organo(D2, 2, .5, 'pieno', .02, 2.5))], roar_t)
for m in (D2, 39, 45, 51): put(mus, organo(m, 55 - arc_t, .14, 'pieno', 1.2, 1.5), arc_t)
# 4 · il corpo e la scintilla: quinte cave, poi scala ascendente di vetro e accordo di Re maggiore
for m in (43, 50): put(mus, organo(m, spark_t - 55.5, .15, 'flauto', 1.5, 1.2), 55.5)
for k, m in enumerate([74, 76, 78, 79, 81, 83, 85, 86]): put(mus, glass_tink(.4, hz(m + 12), 1.8, .4), spark_t + k * .22)
for m in (D3, 54, A3, D4): put(mus, organo(m, 80 - spark_t - 1, .13, 'flauto', 2.5, 1.5), spark_t + .4)
put(mus, campana(D4, .5), spark_t)
# 5 · il ciclo: ostinato d'organo che gira, la luce del tunnel, poi l'inganno (stonato)
for k in range(int((lie_t - 80.5) / 1.2)): put(mus, organo([D3, A3, F4 - 12, A3][k % 4], 1.1, .12, 'flauto', .05, .4), 80.5 + k * 1.2, pan=(k % 2 - .5) * .5)
for m in (A4, D5, E5 + 12): put(mus, organo(m, lie_t - tun_t, .08, 'flauto', 2, .3), tun_t)
for m in (D3, 51, 56): put(mus, organo(m, 100 - lie_t, .12, 'pieno', .3, 1), lie_t)
# 6 · risveglio: bordone che cresce, silenzio, crepa, Re maggiore pieno e campane
for m in (D2, A2, D3):
    x = organo(m, crack_t - .7 - 100.5, .25, 'pedale', 10, .15); put(mus, x * np.linspace(.2, 1.4, len(x)), 100.5)
for m in (D2, D3, A3, D4, 66, A4, D5): put(mus, organo(m, 120 - crack_t - 1.5, .2, 'pieno', .05, 1.6), crack_t + .05)
put(mus, campana(D3, .9, 8), crack_t + .05); put(mus, campana(A3, .6, 8), crack_t + .9); put(mus, campana(D4, .5, 7), T['endbell'][0])
for t in T['bell']: put(mus, campana(D3 + 12, .45), t, pan=.2)

# ───────── effetti ─────────
for t in T['light']: put(fx, glass_tink(.5, hz(93), 2.5, .2), t)
put(fx, ferro(1.0), bars); put(fx, ferro(.7), bars + .07, pan=-.4); put(fx, ferro(.7), bars + .14, pan=.4)
put(fx, roar_sfx := sfx_roar(2.6, 1.0) if callable(sfx_roar) else np.zeros(1), roar_t)
for t in T['slide']: put(fx, grind(.55, .5), t, pan=rng.uniform(-.5, .5))
for t in T['weld']: put(fx, weld(.8), t)
for t in T['tick']: put(fx, glass_tink(.18, rng.uniform(3800, 4400), .3, .5), t, pan=.3)
put(fx, glass_crack(1.2), crack_t)
for k in range(4): put(fx, ferro(.5), T['barsfall'][0] + .25 + k * .18, pan=[-.5, -.2, .2, .5][k])
put(fx, thump(.8, 45), fall_t + 7.5)

# ───────── voce ─────────
for e in EV:
    if e['type'] != 'voice': continue
    x, sr = sf.read(os.path.join(D, 'voce', 'wav', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); put(vo, x, e['t'])
def comprimi(x, thr=.2, ratio=3., rel=.08):   # compressore con inviluppo a un polo (vettoriale)
    r = np.exp(-1 / (rel * SR)); env = lfilter([1 - r], [1, -r], np.abs(x))
    return x * np.where(env > thr, (thr + (env - thr) / ratio) / np.maximum(env, 1e-9), 1.0)
vo = np.stack([comprimi(vo[:, c]) for c in range(2)], 1)

# ───────── mix: musica abbassata ~9 dB sotto la voce ─────────
from scipy.ndimage import uniform_filter1d
env = uniform_filter1d(np.abs(vo).mean(1), int(.25 * SR)); duck = 1 - .64 * np.clip(env / (env.max() * .08 + 1e-9), 0, 1)
mus = verb(mus, HALL, .45) * duck[:, None]; fx = verb(fx, HALL, .3)
rms = lambda x: np.sqrt(np.mean(x[np.abs(x).sum(1) > 1e-4] ** 2)) if np.any(np.abs(x).sum(1) > 1e-4) else 1
vo = verb(vo, HALL, .12)
vo *= .25 / rms(vo); mus *= (.25 / rms(mus)) * 10 ** (-10 / 20); fx *= (.25 / rms(fx)) * 10 ** (-12 / 20)
out = vo + mus + fx
out = np.stack([limit(out[:, c], .95) for c in range(2)], 1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), out.astype(np.float32), SR)
print('mix', round(len(out) / SR, 2), 's, picco', round(float(np.abs(out).max()), 3))
