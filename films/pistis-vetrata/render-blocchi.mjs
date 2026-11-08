// Render riprendibile: blocchi da CH frame salvati in out/blocchi/; i blocchi già fatti si saltano.
// uso: node render-blocchi.mjs [workers]   (poi: ffmpeg concat di out/blocchi/lista.txt)
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
const { openDemo, closeServer } = await import('/opt/tools/lemo-opuscar/core/render/page.mjs');
const dir = path.dirname(fileURLToPath(import.meta.url)), FPS = 30, CH = 90, WK = +(process.argv[2] || 4);
const bdir = path.join(dir, 'out', 'blocchi'); fs.mkdirSync(bdir, { recursive: true });
const p0 = await openDemo(dir, { w: 1080, h: 1920 }); const DUR = await p0.page.evaluate(() => window.DUR); await p0.browser.close();
const TOTAL = Math.round(DUR * FPS), N = Math.ceil(TOTAL / CH), nome = i => `b${String(i).padStart(3, '0')}.mp4`;
const coda = [...Array(N).keys()].filter(i => !fs.existsSync(path.join(bdir, nome(i))));
console.log(`blocchi ${N}, da fare ${coda.length}`); const t0 = Date.now();
await Promise.all([...Array(WK)].map(async (_, w) => {
  const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
  for (let i; (i = coda.shift()) !== undefined;) {
    const a = i * CH, b = Math.min(TOTAL, a + CH), tmp = `.tmp_${nome(i)}`;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-f', 'mp4', tmp], { cwd: bdir, stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise(r => ff.on('close', r));
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); if (await closed !== 0) throw new Error('ffmpeg blocco ' + i);
    fs.renameSync(path.join(bdir, tmp), path.join(bdir, nome(i)));
    console.log(`w${w} ${nome(i)} ok  rimasti ${coda.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
}));
fs.writeFileSync(path.join(bdir, 'lista.txt'), [...Array(N).keys()].map(i => `file '${nome(i)}'`).join('\n'));
console.log('FATTO', TOTAL, 'frame'); closeServer();
