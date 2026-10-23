// Uso: node render.mjs ../montaggi/[titolo]/reel.json
// Esporta montaggi/[titolo]/finale-[variante].mp4 per ogni variante del file.
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const file = process.argv[2];
if (!file) throw new Error('Indica il file reel.json: node render.mjs ../montaggi/[titolo]/reel.json');
const cartella = path.dirname(path.resolve(file));
const titolo = path.basename(cartella);
const conf = JSON.parse(fs.readFileSync(file, 'utf8'));
const {varianti = {A: {}}, sorgente, ...base} = conf;

// Il girato va copiato in public/ perché il browser di Remotion possa leggerlo
fs.mkdirSync('public/clips', {recursive: true});
const copiaClip = (sorgenteVariante, nome) => {
  const src = path.resolve(cartella, sorgenteVariante);
  const nomeClip = `clips/${titolo}-${nome}${path.extname(src).toLowerCase()}`;
  fs.copyFileSync(src, path.join('public', nomeClip));
  return nomeClip;
};

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync(path.join(cartella, 'lavoro'), {recursive: true});

for (const [nome, modifiche] of Object.entries(varianti)) {
  const {sorgente: sorgenteVariante = sorgente, ...resto} = modifiche;
  const inputProps = {...base, ...resto, video: copiaClip(sorgenteVariante, nome)};
  // "parole" può essere il percorso del file creato da trascrivi.py
  if (typeof inputProps.parole === 'string') inputProps.parole = JSON.parse(fs.readFileSync(path.resolve(cartella, inputProps.parole), 'utf8'));
  const composition = await selectComposition({serveUrl, id: 'Reel', inputProps, browserExecutable: BROWSER});
  const grezzo = path.join(cartella, 'lavoro', `remotion-${nome}.mp4`);
  // Il primo avvio a freddo del browser a volte fallisce: si riprova fino a 3 volte
  for (let tentativo = 1; ; tentativo++) {
    try {
      await renderMedia({composition, serveUrl, codec: 'h264', crf: 18, outputLocation: grezzo, inputProps, browserExecutable: BROWSER, timeoutInMilliseconds: 120000});
      break;
    } catch (e) {
      if (tentativo === 3) throw e;
      console.log(`Tentativo ${tentativo} fallito (${e.message.split('\n')[0]}), riprovo...`);
    }
  }
  // Volume standard social (-14 LUFS) e file pronto per Instagram/TikTok
  const finale = path.join(cartella, `finale-${nome}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', grezzo, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', finale]);
  console.log(`Fatto: ${finale}`);
}
