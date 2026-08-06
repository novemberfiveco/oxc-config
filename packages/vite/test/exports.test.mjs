import { test } from 'node:test';
import assert from 'node:assert/strict';

import oxlintConfig from '@novemberfiveco/oxc-config-vite';
import oxfmtConfig from '@novemberfiveco/oxc-config-vite/oxfmt';
import typeAwareConfig from '@novemberfiveco/oxc-config-vite/type-aware';

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

// The exact set is the public contract: consumers downgrade these by name in their
// own config, so swapping one out is a breaking change even if the count holds.
const TYPE_AWARE_RULES = [
  'typescript/await-thenable',
  'typescript/no-floating-promises',
  'typescript/no-misused-promises',
  'typescript/no-unnecessary-condition',
  'typescript/no-unnecessary-type-assertion',
  'typescript/prefer-nullish-coalescing',
  'typescript/prefer-optional-chain',
];

test('./type-aware export enables type-aware mode with all rules as error', () => {
  assert.equal(typeAwareConfig.options.typeAware, true);
  assert.deepEqual(Object.keys(typeAwareConfig.rules).sort(), [...TYPE_AWARE_RULES].sort());
  for (const name of TYPE_AWARE_RULES) {
    assert.equal(typeAwareConfig.rules[name], 'error', `${name} should ship as error`);
  }
});

test('the main export does NOT enable type-aware mode', () => {
  // Enabling it centrally would break every consumer that has not installed
  // oxlint-tsgolint or migrated its tsconfig off baseUrl / moduleResolution node10.
  assert.equal(oxlintConfig.options?.typeAware, undefined);
  const typeAwareRules = Object.keys(oxlintConfig.rules).filter(r =>
    Object.keys(typeAwareConfig.rules).includes(r),
  );
  assert.deepEqual(typeAwareRules, []);
});
