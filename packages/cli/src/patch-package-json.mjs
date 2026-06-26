import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const SCRIPTS = {
  format: 'oxfmt',
  'lint:fix': 'oxlint --fix',
  'ci:lint': 'oxlint && oxfmt --check',
};

const LINT_STAGED = {
  '*.{ts,tsx,js,jsx}': ['oxlint --fix --max-warnings=0', 'oxfmt --check'],
  '*.{json,md,css,scss,yml,yaml,html}': ['oxfmt --check'],
};

export async function patchPackageJson({ cwd, dryRun = false }) {
  const abs = join(cwd, 'package.json');
  const exists = await access(abs)
    .then(() => true)
    .catch(() => false);
  if (!exists) return [{ type: 'skip', target: 'package.json', note: 'no package.json found' }];

  const pkg = JSON.parse(await readFile(abs, 'utf8'));
  const actions = [];
  pkg.scripts ??= {};

  for (const [name, value] of Object.entries(SCRIPTS)) {
    if (pkg.scripts[name] === undefined) {
      pkg.scripts[name] = value;
      actions.push({
        type: 'patch',
        target: `package.json#scripts.${name}`,
        ...(dryRun ? { note: 'dry run' } : {}),
      });
    } else if (pkg.scripts[name] !== value) {
      actions.push({ type: 'skip', target: 'package.json', note: `scripts.${name} already set` });
    }
  }

  if (pkg['lint-staged'] === undefined) {
    pkg['lint-staged'] = LINT_STAGED;
    actions.push({
      type: 'patch',
      target: 'package.json#lint-staged',
      ...(dryRun ? { note: 'dry run' } : {}),
    });
  } else {
    actions.push({ type: 'skip', target: 'package.json', note: 'lint-staged already set' });
  }

  if (!dryRun) await writeFile(abs, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  return actions;
}
