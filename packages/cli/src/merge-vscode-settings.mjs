import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'comment-json';

import { readTemplate } from './templates.mjs';

// Recursively merge `source` into `target`, mutating `target` in place so its
// comments survive. For keys present in both as plain (non-array) objects we
// recurse instead of replacing wholesale — this preserves nested keys the
// consumer already set (e.g. inside a per-language `[typescript]` block).
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv &&
      tv &&
      typeof sv === 'object' &&
      typeof tv === 'object' &&
      !Array.isArray(sv) &&
      !Array.isArray(tv)
    ) {
      deepMerge(tv, sv);
    } else {
      target[key] = sv;
    }
  }
  return target;
}

export async function applyVscodeSettings({ cwd, dryRun = false }) {
  const rel = '.vscode/settings.json';
  const abs = join(cwd, rel);
  const template = readTemplate('vscode.settings.json');
  const exists = await access(abs)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    if (!dryRun) {
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, template, 'utf8');
    }
    return { type: 'create', target: rel, ...(dryRun ? { note: 'dry run' } : {}) };
  }

  const current = parse(await readFile(abs, 'utf8'));
  const oxc = parse(template);
  const merged = deepMerge(current, oxc); // deep-merges oxc keys, preserves existing keys + comments
  if (!dryRun) await writeFile(abs, stringify(merged, null, 2) + '\n', 'utf8');
  return { type: 'merge', target: rel, ...(dryRun ? { note: 'dry run' } : {}) };
}
