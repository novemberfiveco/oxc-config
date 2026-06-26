import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { run } from '../src/index.mjs';

const PKG = '@novemberfiveco/oxc-config-vite';

async function tmp() {
  return mkdtemp(join(tmpdir(), 'oxc-cli-'));
}

test('creates oxlint/oxfmt config files importing the given pkg', async () => {
  const cwd = await tmp();
  await run({ pkg: PKG, cwd });

  const oxlint = await readFile(join(cwd, 'oxlint.config.ts'), 'utf8');
  const oxfmt = await readFile(join(cwd, 'oxfmt.config.ts'), 'utf8');
  assert.match(oxlint, /from '@novemberfiveco\/oxc-config-vite'/);
  assert.match(oxlint, /extends: \[config\]/);
  assert.match(oxfmt, /from '@novemberfiveco\/oxc-config-vite\/oxfmt'/);
});

test('writes the claude hook by default and skips it with claudeHook:false', async () => {
  const withHook = await tmp();
  await run({ pkg: PKG, cwd: withHook });
  const hook = await readFile(join(withHook, '.claude/hooks/oxc-format-lint.sh'), 'utf8');
  assert.match(hook, /oxfmt/);

  const noHook = await tmp();
  await run({ pkg: PKG, cwd: noHook, claudeHook: false });
  await assert.rejects(readFile(join(noHook, '.claude/hooks/oxc-format-lint.sh'), 'utf8'));
});

test('does not overwrite an existing file unless force', async () => {
  const cwd = await tmp();
  await writeFile(join(cwd, 'oxlint.config.ts'), 'KEEP ME', 'utf8');
  const { actions } = await run({ pkg: PKG, cwd });
  assert.equal(await readFile(join(cwd, 'oxlint.config.ts'), 'utf8'), 'KEEP ME');
  assert.ok(actions.some(a => a.type === 'skip' && a.target === 'oxlint.config.ts'));

  await run({ pkg: PKG, cwd, force: true });
  assert.match(await readFile(join(cwd, 'oxlint.config.ts'), 'utf8'), /defineConfig/);
});

test('dry run performs no writes', async () => {
  const cwd = await tmp();
  const { actions } = await run({ pkg: PKG, cwd, dryRun: true });
  await assert.rejects(readFile(join(cwd, 'oxlint.config.ts'), 'utf8'));
  assert.ok(actions.some(a => a.type === 'create' && /dry/.test(a.note ?? '')));
});
