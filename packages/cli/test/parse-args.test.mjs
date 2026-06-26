import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs } from '../src/parse-args.mjs';

test('parses the init command with defaults', () => {
  const { command, options } = parseArgs(['init']);
  assert.equal(command, 'init');
  assert.equal(options.dryRun, false);
  assert.equal(options.force, false);
  assert.equal(options.claudeHook, true);
  assert.equal(options.install, false);
});

test('parses flags', () => {
  const { options } = parseArgs(['init', '--dry-run', '--force', '--no-claude-hook', '--install']);
  assert.equal(options.dryRun, true);
  assert.equal(options.force, true);
  assert.equal(options.claudeHook, false);
  assert.equal(options.install, true);
});

test('returns undefined command when none given', () => {
  assert.equal(parseArgs([]).command, undefined);
});
