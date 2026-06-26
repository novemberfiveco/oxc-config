import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'comment-json';

import { readTemplate } from './templates.mjs';

const HOOK_CMD = '"$CLAUDE_PROJECT_DIR/.claude/hooks/oxc-format-lint.sh"';

function hasOxcHook(settings) {
  const groups = settings?.hooks?.PostToolUse ?? [];
  return groups.some(g => (g.hooks ?? []).some(h => h.command === HOOK_CMD));
}

export async function applyClaudeSettings({ cwd, dryRun = false }) {
  const rel = '.claude/settings.json';
  const abs = join(cwd, rel);
  const template = readTemplate('claude/settings.json');
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
  if (hasOxcHook(current)) return { type: 'skip', target: rel, note: 'hook already present' };

  current.hooks ??= {};
  current.hooks.PostToolUse ??= [];
  current.hooks.PostToolUse.push(parse(template).hooks.PostToolUse[0]);
  if (!dryRun) await writeFile(abs, stringify(current, null, 2) + '\n', 'utf8');
  return { type: 'merge', target: rel, ...(dryRun ? { note: 'dry run' } : {}) };
}
