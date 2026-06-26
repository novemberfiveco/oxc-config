import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'comment-json';

import { applyVscodeSettings } from '../src/merge-vscode-settings.mjs';
import { applyExtensions } from '../src/merge-extensions.mjs';
import { applyClaudeSettings } from '../src/merge-claude.mjs';

const tmp = () => mkdtemp(join(tmpdir(), 'oxc-merge-'));

test('vscode settings: creates when absent', async () => {
  const cwd = await tmp();
  const action = await applyVscodeSettings({ cwd });
  assert.equal(action.type, 'create');
  const json = parse(await readFile(join(cwd, '.vscode/settings.json'), 'utf8'));
  assert.equal(json['editor.defaultFormatter'], 'oxc.oxc-vscode');
});

test('vscode settings: merges into existing, preserving keys and comments', async () => {
  const cwd = await tmp();
  await mkdir(join(cwd, '.vscode'), { recursive: true });
  await writeFile(
    join(cwd, '.vscode/settings.json'),
    '{\n  // keep this comment\n  "editor.tabSize": 4\n}\n',
    'utf8',
  );
  const action = await applyVscodeSettings({ cwd });
  assert.equal(action.type, 'merge');
  const raw = await readFile(join(cwd, '.vscode/settings.json'), 'utf8');
  assert.match(raw, /keep this comment/);
  const json = parse(raw);
  assert.equal(json['editor.tabSize'], 4); // preserved
  assert.equal(json['editor.defaultFormatter'], 'oxc.oxc-vscode'); // added
});

test('vscode settings: deep-merges nested per-language blocks, never clobbering', async () => {
  const cwd = await tmp();
  await mkdir(join(cwd, '.vscode'), { recursive: true });
  await writeFile(
    join(cwd, '.vscode/settings.json'),
    '{\n  // keep this comment\n  "editor.tabSize": 4,\n  "[typescript]": { "editor.rulers": [100] }\n}\n',
    'utf8',
  );
  const action = await applyVscodeSettings({ cwd });
  assert.equal(action.type, 'merge');
  const raw = await readFile(join(cwd, '.vscode/settings.json'), 'utf8');
  assert.match(raw, /keep this comment/); // comment preserved
  const json = parse(raw);
  assert.equal(json['editor.tabSize'], 4); // top-level preserved
  assert.equal(json['editor.defaultFormatter'], 'oxc.oxc-vscode'); // top-level added
  // nested block: existing key survived (deep merge, not wholesale replace)
  assert.deepEqual(Array.from(json['[typescript]']['editor.rulers']), [100]);
  // nested block: oxc value merged in
  assert.equal(json['[typescript]']['editor.defaultFormatter'], 'oxc.oxc-vscode');
});

test('extensions: merges and dedupes recommendations', async () => {
  const cwd = await tmp();
  await mkdir(join(cwd, '.vscode'), { recursive: true });
  await writeFile(
    join(cwd, '.vscode/extensions.json'),
    JSON.stringify({ recommendations: ['oxc.oxc-vscode', 'foo.bar'] }),
    'utf8',
  );
  await applyExtensions({ cwd });
  const json = parse(await readFile(join(cwd, '.vscode/extensions.json'), 'utf8'));
  assert.deepEqual(Array.from(json.recommendations), ['oxc.oxc-vscode', 'foo.bar']); // no dupe
  assert.ok(json.unwantedRecommendations.includes('esbenp.prettier-vscode'));
});

test('claude settings: adds hook if absent, idempotent', async () => {
  const cwd = await tmp();
  await applyClaudeSettings({ cwd });
  const first = parse(await readFile(join(cwd, '.claude/settings.json'), 'utf8'));
  assert.equal(first.hooks.PostToolUse.length, 1);
  const action = await applyClaudeSettings({ cwd });
  const second = parse(await readFile(join(cwd, '.claude/settings.json'), 'utf8'));
  assert.equal(second.hooks.PostToolUse.length, 1); // not duplicated
  assert.equal(action.type, 'skip');
});
