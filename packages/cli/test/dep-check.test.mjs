import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { checkDeps } from '../src/dep-check.mjs';
import { CHECKLIST } from '../src/checklist.mjs';

const tmp = () => mkdtemp(join(tmpdir(), 'oxc-dep-'));
const PKG = '@novemberfiveco/oxc-config-vite';

test('reports missing oxlint/oxfmt/pkg when none declared', async () => {
  const cwd = await tmp();
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'app' }), 'utf8');
  const { missing } = await checkDeps({ cwd, pkg: PKG });
  assert.deepEqual(missing.sort(), [PKG, 'oxfmt', 'oxlint'].sort());
});

test('reports nothing missing when all are devDependencies', async () => {
  const cwd = await tmp();
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: 'app',
      devDependencies: { oxlint: '1', oxfmt: '0.53.0', [PKG]: '0.1.0' },
    }),
    'utf8',
  );
  const { missing } = await checkDeps({ cwd, pkg: PKG });
  assert.deepEqual(missing, []);
});

test('checklist mentions the three per-machine steps', () => {
  assert.match(CHECKLIST, /extension/i);
  assert.match(CHECKLIST, /oxc\.path\.node/);
  assert.match(CHECKLIST, /useExecPath/);
});
