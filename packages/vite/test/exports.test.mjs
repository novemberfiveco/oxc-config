import { test } from 'node:test';
import assert from 'node:assert/strict';

import oxlintConfig from '@novemberfiveco/oxc-config-vite';
import oxfmtConfig from '@novemberfiveco/oxc-config-vite/oxfmt';

test('default export is the oxlint config object', () => {
  assert.equal(typeof oxlintConfig, 'object');
  assert.deepEqual(oxlintConfig.plugins, ['typescript', 'unicorn', 'import', 'react']);
  assert.equal(oxlintConfig.rules['no-console'][0], 'warn');
  assert.ok(Array.isArray(oxlintConfig.ignorePatterns));
});

test('./oxfmt export is the oxfmt config object', () => {
  assert.equal(oxfmtConfig.singleQuote, true);
  assert.equal(oxfmtConfig.printWidth, 100);
  assert.equal(oxfmtConfig.arrowParens, 'avoid');
});
