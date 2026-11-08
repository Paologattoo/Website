// Trova il Chromium preinstallato (il numero di versione in /opt/pw-browsers cambia
// da un ambiente all'altro). Restituisce null se non c'è: Remotion lo scarica da sé.
import fs from 'node:fs';
import path from 'node:path';

export function trovaBrowser() {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  const candidati = [];
  for (const d of fs.readdirSync(base).filter((n) => n.startsWith('chromium_headless_shell-')).sort().reverse()) {
    candidati.push(
      path.join(base, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'),
      path.join(base, d, 'chrome-linux', 'headless_shell'),
    );
  }
  candidati.push(path.join(base, 'chromium'));
  return candidati.find((p) => fs.existsSync(p)) ?? null;
}
