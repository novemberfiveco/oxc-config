import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const shim = fileURLToPath(new URL('../bin/cli.mjs', import.meta.url));

test('shim scaffolds with the vite package name', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'oxc-shim-'));
  await run('node', [shim, 'init'], { cwd });
  const oxlint = await readFile(join(cwd, 'oxlint.config.ts'), 'utf8');
  assert.match(oxlint, /from '@novemberfiveco\/oxc-config-vite'/);
});
