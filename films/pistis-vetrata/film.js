// La Gabbia Cosmica — film in stile vetrata (Lemo-Opuscar, stile Stained Glass), verticale 1080x1920, 30 fps, 120 s.
// Una sola lancetta alta sotto un rosone: il rosone è il Pleroma, ogni medaglione un capitolo della caduta.
// Tutto disegnato con il codice: pezzi di vetro, piombo, grisaglia (glass.js) e compositore della luce (comp.js).
import { makeComp } from './comp.js';
import { COL, Pass, smooth, circle, ellipse, brush, line, poly, softPoly, INK } from './glass.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry, hash } from '/core/lib.js';

const W = 1080, H = 1920, FPS = 30;
export const DUR = 120;
const cv = document.getElementById('gl'); cv.width = W; cv.height = H;
const comp = makeComp(cv);
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const L = { G: mk(), S: mk(), R: mk(), O: mk(), P: mk(4, 4) };
const G = L.G.getContext('2d'), S = L.S.getContext('2d'), R = L.R.getContext('2d'), O = L.O.getContext('2d');
await document.fonts.load('600 40px Cinzel'); await document.fonts.load('44px "IM Fell English"');

// ───────────────────────── VOCE E TEMPI ─────────────────────────
const SEZ = [0, 15, 35, 55, 80, 100];          // inizio delle 6 sequenze (secondi)
const battute = await (await fetch('voce/battute.json')).json();
const durate = await (await fetch('voce/wav/dur.json')).json();
const LINES = []; { let fine = 0;
  for (const b of battute) {
    const s0 = SEZ[b.sez - 1];
    const prima = !LINES.length || LINES[LINES.length - 1].sez !== b.sez;
    const t = prima ? Math.max(s0 + .35, fine + .35) : fine + .28;
    const d = durate[b.id]; LINES.push({ id: b.id, sez: b.sez, t, d, text: b.sub }); fine = t + d;
  } }
const lineT = id => LINES.find(l => l.id === id).t;
const SUBS = LINES.map((l, i) => { const nx = LINES[i + 1]; let t1 = Math.max(l.t + l.d + .45, l.t + 1.8); if (nx) t1 = Math.min(t1, nx.t - .12); return { t0: l.t, t1, text: l.text }; });

// momenti chiave, agganciati alla voce
const T_BARS = 8.2;                                   // le sbarre della gabbia cadono
const T_FALL = lineT('s2_3') - .2;                    // "Questo errore cosmico la fece precipitare"
const T_ROAR = lineT('s3_3') + 1.55;                  // "...urlò nel vuoto"
const T_ARC = lineT('s3_4') + .8;                     // gli Arconti
const T_SPARK = lineT('s4_3') + 1.1;                  // "Ma a loro insaputa, una scintilla..."
const T_TUNNEL = lineT('s5_3');                       // "Quando muori, quella luce bianca..."
const T_LIE = lineT('s5_3') + 3.6;                    // "...è un inganno degli Arconti"
const T_CRACK = lineT('s6_4') + .25;                  // "Il velo si sta strappando"
const WELDS = [56.6, 58.2, 59.8, 61.4, 63.0, 64.6, 66.2];   // il corpo piombato pezzo per pezzo

// ───────────────────────── GEOMETRIA DELLA FINESTRA (unità del mondo, y in giù) ─────────────────────────
const LW = 780, HX = LW / 2, SPR = -1250, APEX = SPR - LW * Math.sqrt(3) / 2, BOT = 2450;
const ROSE = { x: 0, y: -2470, r: 370 };
const MR = 285;                                        // raggio dei medaglioni
const MED = [-1050, -300, 450, 1200, 1950];            // medaglioni 2..6
const SCROLL_Y = [-1700, ...MED.map(y => y - 372)];
const TITOLI = ['LA GABBIA COSMICA', 'PISTIS SOPHIA', 'IL DEMIURGO', 'LA SCINTILLA DIVINA', 'IL CICLO INFINITO', 'SVEGLIATI'];
const BORDER = 36, FILLET = 20;

function lancetPath(inset = 0) {
  const x0 = -HX + inset, x1 = HX - inset, Rr = LW - inset, th = Math.acos(HX / Rr), p = new Path2D();
  p.moveTo(x0, BOT - inset); p.lineTo(x0, SPR);
  p.arc(HX, SPR, Rr, Math.PI, Math.PI + th); p.arc(-HX, SPR, Rr, -th, 0);
  p.lineTo(x1, BOT - inset); p.closePath(); return p;
}
// vetri a losanga tagliati a mano (reticolo con vertici condivisi e spostati)
function lozenges(box, d, seed) {
  const J = (k, m) => [k * d + (hash(k * 12.9 + m * 78.2 + seed) - .5) * d * .34, m * d + (hash(k * 39.3 + m * 11.1 + seed * 3) - .5) * d * .34];
  const out = [];
  for (let b = Math.floor(box[1] / d) - 1; b <= Math.ceil(box[3] / d) + 1; b++)
    for (let a = Math.floor(box[0] / d) - 1; a <= Math.ceil(box[2] / d) + 1; a++) {
      if ((a + b) & 1) continue;
      const pts = [J(a - 1, b), J(a, b - 1), J(a + 1, b), J(a, b + 1)], h = hash(a * 3.3 + b * 7.9 + seed);
      out.push({ path: softPoly(pts, .12), c: [a * d, b * d], col: h < .1 ? COL.blue2 : h < .2 ? COL.deepblue : COL.cobalt, id: 5000 + (a + 500) * 97 + b, curl: hash(a * 5.1 + b * 2.3) });
    }
  return out;
}
const QUAR = lozenges([-HX + BORDER, APEX, HX - BORDER, BOT - BORDER], 46, 3);
const PEARLS = (() => { const o = []; for (let y = BOT - 30; y > SPR; y -= 30) { o.push([-HX + FILLET / 2, y], [HX - FILLET / 2, y]); } return o; })();

// ───────────────────────── PIETRA ─────────────────────────
let stoneTex = null;
function stonePat(ctx) {
  if (!stoneTex) {
    stoneTex = mk(256, 256); const x = stoneTex.getContext('2d'), im = x.createImageData(256, 256), rnd = mulberry(9);
    const N = (u, v, f) => { const X = u * f, Y = v * f, i = Math.floor(X), j = Math.floor(Y), a = X - i, b = Y - j, hh = (p, q) => hash((p % f + f) % f * 57.1 + (q % f + f) % f * 131.7), s = t => t * t * (3 - 2 * t);
      return (hh(i, j) * (1 - s(a)) + hh(i + 1, j) * s(a)) * (1 - s(b)) + (hh(i, j + 1) * (1 - s(a)) + hh(i + 1, j + 1) * s(a)) * s(b); };
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const n = N(i / 256, j / 256, 4) * .45 + N(i / 256, j / 256, 16) * .3 + N(i / 256, j / 256, 64) * .17 + rnd() * .08, k = (i + j * 256) * 4, v = 150 + (n - .5) * 120;
      im.data[k] = v; im.data[k + 1] = v * .96; im.data[k + 2] = v * .9; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0);
  }
  return ctx.createPattern(stoneTex, 'repeat');
}
function drawStone(M, view, gild) {
  S.setTransform(M);
  const [vx0, vy0, vx1, vy1] = view;
  for (let row = -60; row < 60; row++) {
    const CH = 92, y0 = 3000 - (row + 1) * CH; if (y0 + CH < vy0 - 10 || y0 > vy1 + 10) continue;
    let x = -1800 + hash(row * 7.3) * 160;
    while (x < 1800) { const w = 150 + hash(row * 13.1 + x * .01) * 140;
      if (x + w > vx0 - 10 && x < vx1 + 10) { const k = .74 + hash(row * 3.7 + x * .13) * .3; S.fillStyle = `rgb(${128 * k | 0},${118 * k | 0},${104 * k | 0})`; S.fillRect(x + 2, y0 + 2, w - 4, CH - 4); }
      x += w; }
  }
  S.globalCompositeOperation = 'destination-over'; S.fillStyle = '#3d372f'; S.fillRect(vx0 - 20, vy0 - 20, vx1 - vx0 + 40, vy1 - vy0 + 40); S.globalCompositeOperation = 'source-over';
  // strombature (splay) attorno a lancetta e rosone
  S.fillStyle = '#7d7362'; S.fill(lancetPath(-60)); S.fillStyle = '#9a8f7a'; S.fill(lancetPath(-38)); S.fillStyle = '#b0a58e'; S.fill(lancetPath(-16));
  for (const [rr, c] of [[90, '#7d7362'], [62, '#9a8f7a'], [30, '#b0a58e']]) { S.fillStyle = c; S.beginPath(); S.arc(ROSE.x, ROSE.y, ROSE.r + rr, 0, 7); S.fill(); }
  // davanzale e fascia con l'iscrizione
  S.fillStyle = '#a2977f'; S.fillRect(-HX - 120, BOT + 30, LW + 240, 40); S.fillStyle = '#625a4c'; S.fillRect(-HX - 120, BOT + 70, LW + 240, 10);
  S.fillStyle = '#a89d87'; S.fillRect(-640, BOT + 150, 1280, 300); S.fillStyle = '#625a4c'; S.fillRect(-640, BOT + 142, 1280, 8); S.fillRect(-640, BOT + 450, 1280, 10);
  const pat = stonePat(S); pat.setTransform(new DOMMatrix().scale(.7));
  S.globalCompositeOperation = 'multiply'; S.globalAlpha = .55; S.fillStyle = pat; S.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0); S.globalAlpha = 1; S.globalCompositeOperation = 'source-over';
  // SVEGLIATI inciso nella pietra (taglio scuro, labbro chiaro, doratura alla fine)
  S.font = '600 210px Cinzel'; S.textAlign = 'center'; S.textBaseline = 'middle';
  S.fillStyle = 'rgba(255,245,220,.35)'; S.fillText('SVEGLIATI', 0, BOT + 305); S.fillStyle = 'rgba(38,30,22,.85)'; S.fillText('SVEGLIATI', 0, BOT + 300);
  if (gild > 0) { S.fillStyle = `rgba(222,176,80,${gild})`; S.fillText('SVEGLIATI', 0, BOT + 300); }
  // aperture del vetro
  S.globalCompositeOperation = 'destination-out'; S.fillStyle = '#000'; S.fill(lancetPath(0)); S.beginPath(); S.arc(ROSE.x, ROSE.y, ROSE.r, 0, 7); S.fill(); S.globalCompositeOperation = 'source-over';
}

// ───────────────────────── GRISAGLIA: VOLTI ─────────────────────────
// occhi a mandorla, palpebra pesante, sopracciglio che scende nel naso; l'espressione sta in sopracciglia e bocca
function volto(g, x, y, r, e = {}) {
  const bw = r * .11, brow = e.brow ?? 0, blind = e.blind;
  for (const s of [-1, 1]) {
    const ex = x + s * r * .38, ey = y - r * .08;
    if (!blind) { g.fillStyle = 'rgba(40,24,10,.85)'; g.beginPath(); g.ellipse(ex, ey, r * .17, r * .085, 0, 0, 7); g.fill();
      g.fillStyle = g.__col; g.beginPath(); g.ellipse(ex, ey, r * .11, r * .05, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(40,24,10,.95)'; g.beginPath(); g.arc(ex + s * r * .02 * (e.look || 0), ey, r * .055, 0, 7); g.fill(); }
    else { brush(g, [[ex - r * .17, ey], [ex, ey - r * .06], [ex + r * .17, ey]], bw * 1.1); }
    brush(g, [[ex - s * r * .22, ey - r * .16 + brow * s * -r * .0], [ex, ey - r * (.22 + brow * .1)], [ex + s * r * .2, ey - r * (.17 - brow * .12)]], bw, { w0: .5, w1: .2 });
  }
  brush(g, [[x - r * .06, y - r * .2], [x - r * .08, y + r * .18], [x + r * .06, y + r * .22]], bw * .8);
  const m = e.mouth ?? 0; brush(g, [[x - r * .22, y + r * (.42 - m * .05)], [x, y + r * (.44 + m * .06)], [x + r * .22, y + r * (.42 - m * .05)]], bw * .9);
}

// ───────────────────────── MEDAGLIONE (anello + fondo) ─────────────────────────
function medaglione(P, y, fondo, stelle = 0, id = 0) {
  P.piece(circle(0, y, MR), COL.gold, { id: 100 + id, lead: 9, mat: false, edge: 6 });
  P.piece(circle(0, y, MR - 26), COL.white, { id: 110 + id, lead: 5, mat: false, edge: 4 });
  P.piece(circle(0, y, MR - 40), fondo, { id: 120 + id, lead: 8, matW: 26, matA: 1.3 });
  if (stelle) { const rnd = mulberry(id * 7 + 3); for (let k = 0; k < stelle; k++) { const a = rnd() * 7, d = 60 + rnd() * 170, sx = Math.cos(a) * d, sy = y + Math.sin(a) * d;
    P.piece(poly([[sx, sy - 13], [sx + 5, sy - 4], [sx + 13, sy], [sx + 5, sy + 4], [sx, sy + 13], [sx - 5, sy + 4], [sx - 13, sy], [sx - 5, sy - 4]]), COL.gold2, { id: 9000 + id * 50 + k, lead: 3, mat: false, edge: 2 }); } }
}
function cartiglio(P, y, testo, id) {
  const w = 600, h = 88, x0 = -w / 2, x1 = w / 2;
  const path = smooth([[x0, y - h / 2, 1], [x1, y - h / 2, 1], [x1 + 26, y - h / 2 + 14], [x1 + 10, y], [x1 + 26, y + h / 2 - 2], [x1, y + h / 2, 1], [x0, y + h / 2, 1], [x0 - 26, y + h / 2 - 2], [x0 - 10, y], [x0 - 26, y - h / 2 + 14]]);
  P.piece(path, COL.white, { id: 300 + id, lead: 7, matW: 12, paint: g => {
    g.font = `800 ${testo.length > 15 ? 44 : 50}px Cinzel`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(28,14,4,1)'; g.fillText(testo, 0, y + 3);
    g.strokeStyle = 'rgba(44,26,12,.5)'; g.lineWidth = 2; g.strokeRect(x0 + 10, y - h / 2 + 9, w - 20, h - 18); } });
}

// ───────────────────────── FIGURE (pezzi rigidi, si muovono a 8 fps) ─────────────────────────
function sophia(P, x, y, s, rot, caduta, id) {
  P.save(); P.translate(x, y); P.rotate(rot); P.scale(s);
  const braccio = (sx, a) => { P.save(); P.translate(sx * 34, -96); P.rotate(a); P.piece(smooth([[-11, 0], [11, 0], [9, -118], [0, -132], [-9, -118]]), COL.flesh, { id: id + (sx > 0 ? 1 : 2), lead: 5, matW: 8, shade: [-11, 0, 11, 0, .45] }); P.restore(); };
  const sw = caduta ? Math.sin(caduta * 9) * .5 : 0;
  braccio(-1, -.38 + sw - (caduta ? .5 : 0)); braccio(1, .38 - sw + (caduta ? .5 : 0));
  P.piece(smooth([[0, -150], [44, -120], [52, -30], [40, 80], [62, 200, 1], [-62, 200, 1], [-40, 80], [-52, -30], [-44, -120]]), COL.gold, { id: id + 3, lead: 7, matW: 10 });  // capelli/manto d'oro
  P.piece(smooth([[-30, -96], [30, -96], [52, 40], [88, 236, 1], [-88, 236, 1], [-52, 40]]), COL.white, { id: id + 4, lead: 7, matW: 14, shade: [-60, 0, 60, 0, .4],
    paint: g => { for (const k of [-1, 1]) brush(g, [[k * 12, -40], [k * 26, 80], [k * 46, 220]], 4, { color: 'rgba(44,26,12,.6)' }); brush(g, [[-44, 160], [0, 176], [44, 160]], 3.4, { color: 'rgba(44,26,12,.5)' }); } });
  P.piece(smooth([[-36, -60], [36, -60], [40, -40], [-40, -40]]), COL.ruby, { id: id + 5, lead: 5, mat: false });                       // cintura
  P.piece(smooth([[-56, 40], [-30, -92], [-12, -92], [-34, 60], [-86, 236, 1], [-100, 236, 1]]), COL.sky, { id: id + 6, lead: 6, matW: 8 });   // velo
  P.piece(ellipse(0, -140, 30, 36), COL.flesh, { id: id + 7, lead: 6, matW: 9, paint: g => volto(g, 0, -140, 32, { brow: caduta ? -1 : .2, mouth: caduta ? 1 : 0 }) });
  P.restore();
}
function demiurgo(P, y, t, ruggito, id) {
  // corpo di serpente: catena di anelli verdi a squame
  const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16, a = u * 5.2 + Math.sin(t * 1.4) * .25; pts.push([Math.sin(a) * (40 + u * 150), y + 10 + u * 230 - Math.cos(a * .5) * 20]); }
  for (let k = 15; k >= 0; k--) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w0 = 52 - k * 2.6, w1 = 52 - (k + 1) * 2.6;
    P.piece(poly([[ax + nx * w0, ay + ny * w0], [bx + nx * w1, by + ny * w1], [bx - nx * w1, by - ny * w1], [ax - nx * w0, ay - ny * w0]]), k % 2 ? COL.green : COL.green2,
      { id: id + 10 + k, lead: 6, matW: 10, paint: g => { for (let q = 0; q < 3; q++) { const u = (q + .5) / 3; g.strokeStyle = 'rgba(44,26,12,.55)'; g.lineWidth = 2.4; g.beginPath(); g.arc(lerp(ax, bx, u), lerp(ay, by, u), w0 * .55, Math.atan2(ny, nx) - .9, Math.atan2(ny, nx) + .9); g.stroke(); } } });
  }
  // criniera di fiamme
  const hy = y - 90;
  for (let k = 0; k < 18; k++) {
    const a = k / 18 * Math.PI * 2, r0 = 70, r1 = 150 + (k % 2) * 26 + Math.sin(t * 9 + k) * 6 + ruggito * 26, c = [COL.gold, COL.amber, COL.ruby][k % 3];
    const pa = [Math.cos(a - .2) * r0, hy + Math.sin(a - .2) * r0], pb = [Math.cos(a) * r1, hy + Math.sin(a) * r1], pc = [Math.cos(a + .2) * r0, hy + Math.sin(a + .2) * r0];
    P.piece(smooth([pa, [Math.cos(a - .1) * (r0 + r1) * .55, hy + Math.sin(a - .1) * (r0 + r1) * .55], [pb[0], pb[1], 1], [Math.cos(a + .12) * (r0 + r1) * .5, hy + Math.sin(a + .12) * (r0 + r1) * .5], pc]), c, { id: id + 40 + k, lead: 5, matW: 8 });
  }
  // muso di leone, occhi bianchi e ciechi, sopracciglia aggrottate
  P.piece(ellipse(0, hy, 82, 94), '#b8741c', { id: id + 70, lead: 8, matW: 16, shade: [0, hy - 90, 0, hy + 90, .3],
    paint: g => { volto(g, 0, hy - 6, 86, { blind: true, brow: 1.2 }); for (const k of [-1, 1]) brush(g, [[k * 20, hy + 34], [k * 50, hy + 40], [k * 70, hy + 30]], 2.6, { color: 'rgba(44,26,12,.6)' }); } });
  for (const k of [-1, 1]) P.piece(ellipse(k * 32, hy - 12, 17, 9), COL.white, { id: id + 71 + (k > 0), lead: 4, mat: false });
  const bocca = ruggito;
  if (bocca > .05) {
    P.piece(smooth([[-42, hy + 40], [42, hy + 40], [30, hy + 46 + 60 * bocca], [0, hy + 52 + 70 * bocca], [-30, hy + 46 + 60 * bocca]]), COL.ruby2, { id: id + 75, lead: 6, mat: false });
    for (const k of [-1, 1]) P.piece(poly([[k * 30 - 8, hy + 42], [k * 30 + 8, hy + 42], [k * 30, hy + 42 + 34 * bocca]]), COL.white, { id: id + 76 + (k > 0), lead: 3, mat: false });
  } else P.piece(smooth([[-40, hy + 44], [40, hy + 44], [30, hy + 54], [-30, hy + 54]]), COL.ruby2, { id: id + 75, lead: 5, mat: false });
}
function arconte(P, x, y, s, acceso, id) {
  P.save(); P.translate(x, y); P.scale(s);
  P.piece(smooth([[0, -70], [30, -56], [38, -10], [52, 80, 1], [-52, 80, 1], [-38, -10], [-30, -56]]), COL.purple2, { id, lead: 6, matW: 12, wash: .35 });
  P.piece(ellipse(0, -28, 20, 24), '#14101c', { id: id + 1, lead: 4, mat: false });
  if (acceso > 0) for (const k of [-1, 1]) P.piece(circle(k * 8, -30, 4.5), COL.ruby, { id: id + 2 + (k > 0), lead: 2, mat: false, body: false });
  P.restore();
}
// il corpo umano piombato pezzo per pezzo: [path, colore, ritardo, direzione d'arrivo]
const CORPO = [
  [() => smooth([[-62, -60], [62, -60], [56, 70], [40, 140, 1], [-40, 140, 1], [-56, 70]]), '#3c3352', 0, [0, 260]],
  [() => ellipse(0, -118, 40, 48), COL.flesh, 1, [0, -300]],
  [() => smooth([[-62, -56], [-84, -30], [-100, 90], [-82, 96], [-64, -10]]), '#463c5e', 2, [-300, 0]],
  [() => smooth([[62, -56], [84, -30], [100, 90], [82, 96], [64, -10]]), '#463c5e', 3, [300, 0]],
  [() => smooth([[-40, 138], [-4, 138], [-10, 300, 1], [-44, 300, 1]]), '#2f2842', 4, [-200, 300]],
  [() => smooth([[4, 138], [40, 138], [44, 300, 1], [10, 300, 1]]), '#2f2842', 5, [200, 300]],
  [() => smooth([[-26, -78], [26, -78], [20, -60], [-20, -60]]), '#463c5e', 6, [0, -200]],
];
function corpo(P, y, t, id) {
  P.save(); P.translate(0, y - 30);
  for (const [path, col, k, dir] of CORPO) {
    const t0 = WELDS[k] - .7, u = seg(t, t0, WELDS[k]); if (u <= 0) continue;
    const e = 1 - eo(u), bump = Math.sin(u * Math.PI) * 6;
    P.save(); P.translate(dir[0] * e + bump, dir[1] * e); P.piece(path(), col, { id: id + k, lead: 6, matW: 12, wash: .25, paint: k === 1 ? g => volto(g, 0, -118, 44, { brow: .3 }) : null }); P.restore();
  }
  P.restore();
}
function ruota(P, y, t, inganno, id) {
  const passo = Math.floor(seg(t, 81, 100) * 38), a = passo * Math.PI / 6 * .5;     // gira a scatti, mezzo spicchio alla volta
  P.save(); P.translate(0, y); P.rotate(a);
  for (let k = 0; k < 12; k++) {
    const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2, r0 = 150, r1 = MR - 42, p = new Path2D();
    p.arc(0, 0, r1, a0, a1); p.arc(0, 0, r0, a1, a0, true); p.closePath();
    P.piece(p, k % 2 ? COL.steel2 : '#5f6f86', { id: id + k, lead: 6, matW: 10, paint: g => {   // sagome di palazzi dipinte in grisaglia
      g.save(); g.rotate((a0 + a1) / 2); g.fillStyle = 'rgba(30,20,12,.8)';
      for (let q = 0; q < 3; q++) { const h = 40 + hash(k * 3 + q) * 50; g.fillRect(r0 + 4, -26 + q * 18, h, 12); } g.restore(); } });
    const am = (a0 + a1) / 2; P.piece(circle(Math.cos(am) * (r1 - 22), Math.sin(am) * (r1 - 22), 7), inganno > .5 ? COL.ruby : COL.amber, { id: id + 20 + k, lead: 2, mat: false, body: false });
  }
  P.restore();
  // il tunnel di luce al centro: anelli concentrici
  [[150, COL.sky], [112, COL.white], [76, '#e9efe2'], [42, COL.white], [16, '#ffffff']].forEach(([r, c], i) => P.piece(circle(0, y, r), inganno > .5 && i % 2 === 0 ? COL.rose : c, { id: id + 40 + i, lead: 5, matW: 8, mat: i > 0 }));
}
function meditante(P, y, id) {
  P.save(); P.translate(0, y + 20);
  P.piece(smooth([[-150, 150, 1], [150, 150, 1], [130, 100], [40, 70], [-40, 70], [-130, 100]]), COL.teal, { id: id, lead: 7, matW: 12, shade: [0, 70, 0, 150, .4] });   // gambe incrociate
  P.piece(smooth([[-60, -80], [60, -80], [84, 80], [-84, 80]]), '#2a3f78', { id: id + 1, lead: 7, matW: 14, paint: g => { brush(g, [[-20, -60], [-34, 70]], 3.4); brush(g, [[20, -60], [34, 70]], 3.4); } });   // veste
  P.piece(smooth([[-50, 50], [50, 50], [30, 74], [-30, 74]]), COL.flesh, { id: id + 2, lead: 5, matW: 6 });   // mani in grembo
  P.piece(ellipse(0, -126, 40, 48), COL.flesh, { id: id + 3, lead: 6, matW: 10, paint: g => volto(g, 0, -126, 44, { blind: true, brow: -.4 }) });   // occhi chiusi
  P.restore();
}
// crepe frastagliate che partono dal cuore della figura in meditazione
const CRACKS = (() => { const rnd = mulberry(41), out = [], cx = 0, cy = MED[4] - 10;
  for (let k = 0; k < 13; k++) { let a = k / 13 * Math.PI * 2 + rnd() * .3, x = cx, y = cy; const p = [[x, y]]; const n = 9 + (rnd() * 6 | 0);
    for (let j = 0; j < n; j++) { a += (rnd() - .5) * .7; const st = 50 + rnd() * 110; x += Math.cos(a) * st; y += Math.sin(a) * st * 1.4; p.push([x, y]); } out.push(p); }
  return out; })();

// ───────────────────────── LA FINESTRA INTERA ─────────────────────────
function rosone(P, t) {
  P.piece(circle(ROSE.x, ROSE.y, ROSE.r), COL.ruby, { id: 50, lead: 8, mat: false });
  P.piece(circle(ROSE.x, ROSE.y, ROSE.r - 24), COL.white, { id: 51, lead: 5, mat: false });
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2, cx = ROSE.x + Math.cos(a) * 230, cy = ROSE.y + Math.sin(a) * 230;
    P.piece(ellipse(cx, cy, 98, 58, a), k % 2 ? COL.gold2 : COL.white, { id: 60 + k, lead: 7, matW: 14 });
    P.piece(ellipse(cx, cy, 40, 22, a), k % 2 ? COL.white : COL.sky, { id: 80 + k, lead: 5, mat: false });
  }
  P.piece(circle(ROSE.x, ROSE.y, 118), COL.gold2, { id: 95, lead: 8, matW: 18 });
  P.piece(circle(ROSE.x, ROSE.y, 74), '#fff7e0', { id: 96, lead: 6, mat: false, paint: g => { for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; brush(g, [[ROSE.x + Math.cos(a) * 30, ROSE.y + Math.sin(a) * 30], [ROSE.x + Math.cos(a) * 68, ROSE.y + Math.sin(a) * 68]], 3, { color: 'rgba(180,120,30,.45)' }); } } });
}
function sbarre(t) {   // la gabbia: sbarre di ferro verticali che cadono a scatto, e alla fine precipitano
  const out = [];
  for (let k = 0; k < 4; k++) {
    const x = [-300, -112, 112, 300][k], ritardo = k * .07, u = seg(t, T_BARS + ritardo - .25, T_BARS + ritardo);
    if (u <= 0) continue;
    let dy = (1 - ei2(u)) * -3200, rot = 0;
    const tc = t - (T_CRACK + .25 + hash(k) * .3); if (tc > 0) { dy = tc * tc * 2600; rot = (hash(k * 3) - .5) * tc * .5; }
    out.push({ x, dy, rot });
  }
  return out;
}
const ei2 = u => u * u;

// ───────────────────────── CAMERA E LUCE ─────────────────────────
// chiavi della camera: [t, x, y, zoom]
const CAM = [
  [0, 0, -2470, 2.1], [6, 0, -2300, 1.05], [15, 0, -1750, .9],
  [17.5, 0, -1060, 1.25], [T_FALL, 0, -1030, 1.3], [T_FALL + 8.5, 0, -560, 1.05], [35, 0, -420, 1.15],
  [37, 0, -310, 1.3], [T_ROAR - .4, 0, -330, 1.5], [T_ROAR + .15, 0, -390, 2.05], [T_ROAR + 3, 0, -360, 1.85], [T_ARC + 1, 0, -300, 1.2], [55, 0, 0, 1.0],
  [57, 0, 440, 1.25], [T_SPARK, 0, 440, 1.3], [80, 0, 400, 2.6],
  [83, 0, 1180, 1.2], [T_TUNNEL, 0, 1200, 1.45], [T_LIE + 2, 0, 1200, 2.4], [100, 0, 1500, 1.1],
  [103, 0, 1950, 1.25], [T_CRACK, 0, 1940, 1.75], [T_CRACK + 1.2, 0, 1900, 1.55], [118.5, 0, 40, .325], [120, 0, 40, .32],
];
function camera(t) {
  let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], u = eio(seg(t, a[0], b[0]));
  const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u));
  let x = lerp(a[1], b[1], u), y = lerp(a[2], b[2], u);
  // scosse di 2 frame: sbarre, ruggito, crepa
  for (const [te, f] of [[T_BARS + .3, 18], [T_ROAR, 26], [T_CRACK, 34]]) { const d = t - te; if (d >= 0 && d < .1) { x += (hash(Math.floor(t * FPS)) - .5) * f / z; y += (hash(Math.floor(t * FPS) + 9) - .5) * f / z; } }
  return [x, y, z];
}
const mixc = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const NOON = [1, .97, .9], DUSK = [1, .6, .34], RED = [1, .42, .3], VIOLET = [.66, .4, .62], MOON = [.6, .7, 1], GOLD = [1, .86, .55], COLD = [.7, .82, 1];
function luce(t) {
  const st = { sunU: -9999, bandW: 1100, bandSoft: 220, sunI: 0, sunCol: NOON, roseI: 0, roseCol: [1, .93, .78], skyI: .14, skyCol: [.55, .65, .9], amb: .16, pts: [], expo: 1.1, fade: 0 };
  const cam = camera(t);
  st.sunU = cam[1] + 60;
  // il rosone (Pleroma): pieno all'inizio, si raffredda quando la gabbia si chiude, torna a bruciare alla fine
  st.roseI = lerp(3.2, 1.3, ss(seg(t, T_BARS, T_BARS + 3))) * (t < 20 ? 1 : .6);
  if (t < 15) { st.sunI = lerp(1.6, 2.2, seg(t, 3, 8)); st.sunCol = mixc(NOON, COLD, ss(seg(t, T_BARS, T_BARS + 2))); st.fade = 1 - ss(seg(t, 0, 1.2)); }
  else if (t < 35) { st.sunI = 2.5 - 1.1 * ss(seg(t, T_FALL + 2, 34)); st.sunCol = mixc(NOON, DUSK, ss(seg(t, T_FALL, 33))); }
  else if (t < 55) { st.sunI = 1.5; st.sunCol = RED; st.amb = .12;
    const r = Math.exp(-Math.max(0, t - T_ROAR) * 1.6) * (t > T_ROAR - .05 ? 1 : 0); st.sunI += r * 2.2;
    st.pts.push([0, -400, 150, r * 6, [1, .2, .08]]);
    if (t > T_ARC) st.pts.push([0, -200, 300, .6 * ss(seg(t, T_ARC, T_ARC + 2)), [1, .15, .1]]); }
  else if (t < 80) { st.sunI = 1.25; st.sunCol = VIOLET;
    for (const w of WELDS) { const d = t - w; if (d > 0 && d < .35) st.pts.push([0, 420, 90, (1 - d / .35) * 5, [1, .95, .8]]); }
    const sp = ss(seg(t, T_SPARK, T_SPARK + 1.6)); if (sp > 0) st.pts.push([0, 372, 40 + sp * 120, sp * (5 + Math.sin(t * 6) * .8), [1, .78, .3]]); }
  else if (t < 100) { st.sunI = 1.7; st.sunCol = MOON;
    const tu = ss(seg(t, T_TUNNEL - 1, T_TUNNEL + 2)), lie = seg(t, T_LIE, T_LIE + .5);
    const fl = lie > 0 ? (hash(Math.floor(t * 12)) > .45 ? 1 : .2) : 0;
    st.pts.push([0, 1200, 60 + tu * 110, tu * 6, fl ? [1, .2, .25] : [1, 1, 1]]); }
  else { st.sunI = 1.1; st.sunCol = MOON; st.amb = .12;
    const cuore = ss(seg(t, 101, T_CRACK)); st.pts.push([0, 1940, 40 + cuore * 140, cuore * 5.5, GOLD]);
    if (t > T_CRACK) { const k = ss(seg(t, T_CRACK, T_CRACK + 1.4)); st.bandW = lerp(1100, 30000, k); st.sunI = lerp(1.6, 3.4, k); st.sunCol = mixc(GOLD, [1, .97, .9], k); st.roseI = lerp(1, 3.6, k);
      st.expo = 1.1 + 1.6 * Math.exp(-(t - T_CRACK) * 3); } }
  return st;
}

// ───────────────────────── EVENTI SONORI (per il mix) ─────────────────────────
export const EV = [];
for (const l of LINES) EV.push({ t: l.t, type: 'voice', id: l.id });
EV.push({ t: .2, type: 'light' }, { t: T_BARS, type: 'bars' });
SEZ.slice(1).forEach(t => EV.push({ t, type: 'bell' }));
EV.push({ t: 17.6, type: 'light' }, { t: T_FALL + .1, type: 'fall' }, { t: T_ROAR, type: 'roar' }, { t: T_ARC, type: 'archons' }, { t: T_SPARK, type: 'spark' }, { t: T_TUNNEL, type: 'light' }, { t: T_LIE, type: 'lie' });
WELDS.forEach(t => EV.push({ t: t - .55, type: 'slide' }, { t, type: 'weld' }));
for (let k = 1; k < 38; k++) EV.push({ t: 81 + k * 19 / 38, type: 'tick' });
EV.push({ t: T_CRACK, type: 'crack' }, { t: T_CRACK + .55, type: 'barsfall' }, { t: 118.2, type: 'endbell' });
EV.sort((a, b) => a.t - b.t);

// ───────────────────────── SOTTOTITOLI: BANDERUOLA DI PERGAMENA ─────────────────────────
function righe(ctx, testo, max) { const parole = testo.split(' '), out = []; let r = '';
  for (const p of parole) { const prova = r ? r + ' ' + p : p; if (ctx.measureText(prova).width > max && r) { out.push(r); r = p; } else r = prova; } if (r) out.push(r); return out; }
function banderuola(t) {
  const s = SUBS.find(q => t >= q.t0 - .05 && t < q.t1 + .3); if (!s) return;
  const k = Math.min(ss(seg(t, s.t0 - .05, s.t0 + .28)), 1 - ss(seg(t, s.t1, s.t1 + .28))); if (k <= 0) return;
  O.save(); O.font = '46px "IM Fell English"';
  const rr = righe(O, s.text, 820), tw = Math.max(...rr.map(r => O.measureText(r).width));
  const Wb = (tw + 130) * (.25 + .75 * k), Hb = 30 + rr.length * 54, cx = W / 2, cy = 1660, x0 = cx - Wb / 2, x1 = cx + Wb / 2, sag = 8;
  O.globalAlpha = clamp(k * 1.4);
  const end = (x, dir) => { O.fillStyle = '#b39a6c'; O.beginPath(); O.moveTo(x, cy - Hb / 2 + 6); O.lineTo(x + dir * 36, cy - Hb / 2 + 16); O.lineTo(x + dir * 22, cy); O.lineTo(x + dir * 36, cy + Hb / 2 + 10); O.lineTo(x, cy + Hb / 2 + 2); O.closePath(); O.fill();
    O.fillStyle = '#8c7348'; O.beginPath(); O.ellipse(x + dir * 2, cy + 4, 6, Hb / 2 - 2, 0, 0, 7); O.fill(); };
  end(x0 + 4, -1); end(x1 - 4, 1);
  O.shadowColor = 'rgba(0,0,0,.5)'; O.shadowBlur = 16; O.shadowOffsetY = 5;
  O.beginPath(); O.moveTo(x0, cy - Hb / 2); O.quadraticCurveTo(cx, cy - Hb / 2 + sag, x1, cy - Hb / 2); O.lineTo(x1, cy + Hb / 2); O.quadraticCurveTo(cx, cy + Hb / 2 + sag, x0, cy + Hb / 2); O.closePath();
  const gr = O.createLinearGradient(0, cy - Hb / 2, 0, cy + Hb / 2); gr.addColorStop(0, '#f3e6c6'); gr.addColorStop(.5, '#ecdcb6'); gr.addColorStop(1, '#d9c497');
  O.fillStyle = gr; O.fill(); O.shadowColor = 'transparent'; O.strokeStyle = 'rgba(110,80,40,.55)'; O.lineWidth = 1.5; O.stroke();
  O.save(); O.beginPath(); O.rect(x0 + 8, cy - Hb, Wb - 16, Hb * 2); O.clip(); O.globalAlpha = clamp((k - .75) / .25);
  O.fillStyle = '#3a2412'; O.textAlign = 'center'; O.textBaseline = 'middle';
  rr.forEach((r, i) => O.fillText(r, cx, cy + 5 + (i - (rr.length - 1) / 2) * 54));
  O.restore(); O.restore();
}

// ───────────────────────── RENDER DI UN FRAME ─────────────────────────
function render(t) {
  for (const c of [G, S, R, O]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
  const cam = camera(t), M = new DOMMatrix().translate(W / 2, H / 2).scale(cam[2]).translate(-cam[0], -cam[1]);
  const hw = W / 2 / cam[2], hh = H / 2 / cam[2], view = [cam[0] - hw, cam[1] - hh, cam[0] + hw, cam[1] + hh];
  const vis = (y0, y1) => y1 > view[1] - 20 && y0 < view[3] + 20;
  const tf = Math.floor(t * 8) / 8;            // le figure si muovono a 8 fps, luce e camera a ogni frame
  drawStone(M, view, ss(seg(t, 115.5, 118)));
  const P = new Pass(G, S); P.setTransform(M);
  // lancetta: bordo rubino, filetto bianco con perle, fondo a losanghe
  P.piece(lancetPath(0), COL.ruby, { id: 1, lead: 7, mat: false, edge: 5 });
  P.piece(lancetPath(FILLET), COL.white, { id: 2, lead: 5, mat: false, edge: 4 });
  for (const [x, y] of PEARLS) if (vis(y - 10, y + 10)) P.piece(circle(x, y, 6), '#efe6c8', { id: 3, lead: 2, mat: false, body: false });
  for (const c of P.cx) { c.save(); c.clip(lancetPath(BORDER)); }
  for (const q of QUAR) if (vis(q.c[1] - 40, q.c[1] + 40)) P.piece(q.path, q.col, { id: q.id, lead: 4, matW: 7, edge: 4 });
  for (const c of P.cx) c.restore();
  P.leadLine([[-HX + BORDER, BOT - BORDER], [-HX + BORDER, SPR]], 6); P.leadLine([[HX - BORDER, BOT - BORDER], [HX - BORDER, SPR]], 6);
  if (vis(ROSE.y - ROSE.r, ROSE.y + ROSE.r)) rosone(P, t);
  // cartigli con i titoli (testo nel vetro, grisaglia su vetro bianco)
  SCROLL_Y.forEach((y, i) => { if (vis(y - 60, y + 60)) cartiglio(P, y, TITOLI[i], i); });
  // 2 · Sophia
  if (vis(MED[0] - MR, MED[0] + MR)) { medaglione(P, MED[0], COL.deepblue, 14, 1); P.piece(circle(0, MED[0] - 222, 36), '#fff6d8', { id: 140, lead: 6, mat: false }); }
  // 3 · il Demiurgo e gli Arconti
  if (vis(MED[1] - MR, MED[1] + MR)) {
    medaglione(P, MED[1], '#3a0d16', 0, 2);
    const rug = t > T_ROAR - .1 ? Math.max(0, 1 - Math.max(0, tf - T_ROAR - 1.6) * 2) * (tf >= T_ROAR ? 1 : 0) : 0;
    demiurgo(P, MED[1], tf, rug, 400);
    [[-190, 130], [190, 130], [-215, -20], [215, -20], [-130, 215], [130, 215]].forEach(([x, y], k) => { const ta = T_ARC + k * .45; if (t > ta - .2) arconte(P, x, MED[1] + y, .85, t > ta ? 1 : 0, 500 + k * 5); });
  }
  // 4 · il corpo e la scintilla
  if (vis(MED[2] - MR, MED[2] + MR)) {
    medaglione(P, MED[2], COL.purple, 0, 3);
    arconte(P, -200, MED[2] + 40, 1.1, 1, 560); arconte(P, 200, MED[2] + 40, 1.1, 1, 570);
    corpo(P, MED[2], tf, 600);
    if (t > T_SPARK) { const k = ss(seg(t, T_SPARK, T_SPARK + 1)), sy = MED[2] - 78;
      for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283 + .2, r0 = 14, r1 = 30 + 34 * k; P.piece(poly([[Math.cos(a - .18) * r0, sy + Math.sin(a - .18) * r0], [Math.cos(a) * r1, sy + Math.sin(a) * r1], [Math.cos(a + .18) * r0, sy + Math.sin(a + .18) * r0]]), COL.gold2, { id: 660 + q, lead: 2, mat: false, body: false }); }
      P.piece(circle(0, sy, 12 + 8 * k), '#fff3c4', { id: 650, lead: 3, mat: false, body: false }); }
  }
  // 5 · il ciclo
  if (vis(MED[3] - MR, MED[3] + MR)) { medaglione(P, MED[3], COL.deepblue, 0, 4); ruota(P, MED[3], tf, t > T_LIE && hash(Math.floor(t * 12)) > .45 ? 1 : 0, 700); }
  // 6 · il risveglio
  if (vis(MED[4] - MR, MED[4] + MR)) { medaglione(P, MED[4], COL.cobalt, 10, 5); meditante(P, MED[4], 800); }
  // Sophia sopra a tutto: si protende, poi precipita fuori dal suo medaglione
  if (t > 15 && t < 36) {
    const u = seg(tf, T_FALL, T_FALL + 8.5), y = lerp(MED[0] + 20, MED[1] - 40, ei2(u)), rot = u * 3.6, s = lerp(1, .45, u), reach = Math.sin(tf * 2) * .04;
    if (u < .98) sophia(P, Math.sin(u * 7) * 40 * u, y, s, rot + reach, u > 0 ? u + .01 : 0, 200);
  }
  // le crepe: linee bianche di luce che corrono dal cuore (in un quarto di secondo)
  if (t > T_CRACK) {
    const k = seg(t, T_CRACK, T_CRACK + .25);
    G.save(); G.setTransform(M); G.strokeStyle = '#ffffff'; G.lineCap = 'round'; G.lineJoin = 'round';
    for (const p of CRACKS) { const n = Math.max(2, Math.ceil(p.length * k)); G.lineWidth = 7; G.beginPath(); p.slice(0, n).forEach((q, i) => i ? G.lineTo(q[0], q[1]) : G.moveTo(q[0], q[1])); G.stroke(); }
    G.restore();
  }
  // ferro: traversine orizzontali e le sbarre della gabbia
  S.setTransform(M);
  for (let y = SPR + 120; y < BOT; y += 375) if (vis(y - 10, y + 10)) { S.fillStyle = '#1b1c1f'; S.fillRect(-HX - 20, y - 7, LW + 40, 14); S.fillStyle = 'rgba(140,140,150,.25)'; S.fillRect(-HX - 20, y - 7, LW + 40, 3); }
  for (const b of sbarre(t)) { S.save(); S.translate(b.x, b.dy); S.rotate(b.rot); S.fillStyle = '#18191c'; S.fillRect(-6, APEX - 600, 12, BOT - APEX + 700); S.fillStyle = 'rgba(150,150,160,.28)'; S.fillRect(-6, APEX - 600, 3, BOT - APEX + 700); S.restore(); }
  // pulviscolo nella luce (schermo)
  const st = luce(t);
  R.globalCompositeOperation = 'lighter'; const rnd = mulberry(5);
  for (let k = 0; k < 70; k++) { const x = rnd() * W, y = (rnd() * H - t * (8 + rnd() * 14) * 3 % H + H) % H, tw = .5 + .5 * Math.sin(t * 2 + k * 3.1), a = Math.min(1, st.sunI * .05 * tw);
    R.fillStyle = `rgba(${255 * a | 0},${235 * a | 0},${200 * a | 0},1)`; R.beginPath(); R.arc(x, y, 1.2 + rnd() * 2, 0, 7); R.fill(); }
  // scintille della saldatura
  for (const w of WELDS) { const d = t - w; if (d < 0 || d > .4) continue; const [sx, sy] = [M.e + 0 * cam[2], M.f + (MED[2]) * cam[2]]; const r2 = mulberry(Math.round(w * 10));
    for (let q = 0; q < 26; q++) { const a = r2() * 6.283, v = 80 + r2() * 260, px = sx + Math.cos(a) * v * d, py = sy + Math.sin(a) * v * d + 300 * d * d, al = 1 - d / .4;
      R.fillStyle = `rgba(255,${200 * al | 0},${90 * al | 0},1)`; R.beginPath(); R.arc(px, py, 2.2, 0, 7); R.fill(); } }
  R.globalCompositeOperation = 'source-over';
  // lampo bianco della crepa
  if (t > T_CRACK && t < T_CRACK + .5) { O.fillStyle = `rgba(255,252,240,${(1 - seg(t, T_CRACK, T_CRACK + .5)) * .9})`; O.fillRect(0, 0, W, H); }
  banderuola(t);
  comp.render(L, { cam, sunU: st.sunU, bandW: st.bandW, bandSoft: st.bandSoft, skew: .04, sunI: st.sunI, sunCol: st.sunCol, skyI: st.skyI, skyCol: st.skyCol,
    roseI: st.roseI, roseCol: st.roseCol, roseC: [ROSE.x, ROSE.y], roseR: ROSE.r, amb: st.amb, ambCol: [.9, .85, .8], haze: .5, raysK: 1,
    lancets: [{ rect: [-HX, APEX, HX, BOT], I: st.sunI * .5 }, { rect: [ROSE.x - ROSE.r, ROSE.y - ROSE.r, ROSE.x + ROSE.r, ROSE.y + ROSE.r], I: st.roseI }],
    pts: st.pts.slice(0, 4), floorMode: 0, expo: st.expo, bloom: .6, thr: .5, vign: .45, sat: 1.12, contrast: .14, fade: st.fade, time: t });
}

window.DUR = DUR; window.EV = EV; window.SUBS = SUBS; window.LINES = LINES;
window.render = render;
window.READY = true;
