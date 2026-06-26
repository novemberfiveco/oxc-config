import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'comment-json';

import { readTemplate } from './templates.mjs';

function mergeList(current = [], additions = []) {
  const out = Array.from(current);
  for (const item of additions) if (!out.includes(item)) out.push(item);
  return out;
}

export async function applyExtensions({ cwd, dryRun = false }) {
  const rel = '.vscode/extensions.json';
  const abs = join(cwd, rel);
  const template = parse(readTemplate('vscode.extensions.json'));
  const exists = await access(abs)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    if (!dryRun) {
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, stringify(template, null, 2) + '\n', 'utf8');
    }
    return { type: 'create', target: rel, ...(dryRun ? { note: 'dry run' } : {}) };
  }

  const current = parse(await readFile(abs, 'utf8'));
  current.recommendations = mergeList(current.recommendations, template.recommendations);
  current.unwantedRecommendations = mergeList(
    current.unwantedRecommendations,
    template.unwantedRecommendations,
  );
  if (!dryRun) await writeFile(abs, stringify(current, null, 2) + '\n', 'utf8');
  return { type: 'merge', target: rel, ...(dryRun ? { note: 'dry run' } : {}) };
}
