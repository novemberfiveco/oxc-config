import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { patchPackageJson } from '../src/patch-package-json.mjs';

const tmp = () => mkdtemp(join(tmpdir(), 'oxc-pkg-'));
const write = (cwd, obj) =>
  writeFile(join(cwd, 'package.json'), JSON.stringify(obj, null, 2), 'utf8');
const read = async cwd => JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));

test('adds oxc scripts and lint-staged config', async () => {
  const cwd = await tmp();
  await write(cwd, { name: 'app', scripts: { test: 'vitest' } });
  await patchPackageJson({ cwd });
  const pkg = await read(cwd);
  assert.equal(pkg.scripts.format, 'oxfmt');
  assert.equal(pkg.scripts['lint:fix'], 'oxlint --fix');
  assert.equal(pkg.scripts['ci:lint'], 'oxlint && oxfmt --check');
  assert.equal(pkg.scripts.test, 'vitest'); // preserved
  assert.deepEqual(pkg['lint-staged']['*.{ts,tsx,js,jsx}'], [
    'oxlint --fix --max-warnings=0',
    'oxfmt --check',
  ]);
});

test('does not overwrite a differing existing script', async () => {
  const cwd = await tmp();
  await write(cwd, { name: 'app', scripts: { format: 'prettier --write .' } });
  const actions = await patchPackageJson({ cwd });
  const pkg = await read(cwd);
  assert.equal(pkg.scripts.format, 'prettier --write .'); // untouched
  assert.ok(actions.some(a => a.type === 'skip' && a.note?.includes('format')));
});

test('dry run does not write', async () => {
  const cwd = await tmp();
  await write(cwd, { name: 'app', scripts: {} });
  await patchPackageJson({ cwd, dryRun: true });
  const pkg = await read(cwd);
  assert.equal(pkg.scripts.format, undefined);
});
