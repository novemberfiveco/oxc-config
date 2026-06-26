import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export async function checkDeps({ cwd, pkg }) {
  const abs = join(cwd, 'package.json');
  const exists = await access(abs)
    .then(() => true)
    .catch(() => false);
  const declared = new Set();
  if (exists) {
    const json = JSON.parse(await readFile(abs, 'utf8'));
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
      for (const name of Object.keys(json[field] ?? {})) declared.add(name);
    }
  }
  const missing = [pkg, 'oxlint', 'oxfmt'].filter(d => !declared.has(d));
  return {
    missing,
    action:
      missing.length === 0
        ? { type: 'skip', target: 'dependencies', note: 'all present' }
        : { type: 'advise', target: 'dependencies', note: `npm i -D ${missing.join(' ')}` },
  };
}
