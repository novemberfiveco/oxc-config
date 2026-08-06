# @novemberfiveco/oxc-config-vite

Shared [OxLint](https://oxc.rs/docs/guide/usage/linter) + [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) configuration for Vite / React projects at November Five.

## Install

```bash
npm i -D @novemberfiveco/oxc-config-vite oxlint oxfmt
```

## Scaffold (recommended)

Run `init` to create config files, patch `package.json` scripts, configure VS Code, and wire the Claude Code hook:

```bash
npx @novemberfiveco/oxc-config-vite init
```

See [`docs/migration.md`](../../docs/migration.md) for the full adoption guide.

## Manual setup

If you prefer to configure by hand, extend the shared config in your own config files.

### `oxlint.config.ts`

```ts
import { defineConfig } from 'oxlint';
import config from '@novemberfiveco/oxc-config-vite';

export default defineConfig({
  extends: [config],
  rules: {
    /* project overrides */
  },
});
```

### `oxfmt.config.ts`

```ts
import { defineConfig } from 'oxfmt';
import config from '@novemberfiveco/oxc-config-vite/oxfmt';

export default defineConfig({ ...config });
```

### Type-aware linting (opt-in)

Type-aware rules need full type information, so they live in a **separate opt-in entry point**. The main
config never enables them: switching them on requires changes a project has to make deliberately, and
enabling them centrally would break every consumer that has not made those changes yet.

Prerequisites, both of which fail loudly (exit 1) when missing:

1. `npm install --save-dev --save-exact oxlint-tsgolint@7` — a self-contained binary that embeds the
   TypeScript 7 compiler. Your own `typescript` version does not need to change.
2. A `tsconfig.json` with no `baseUrl` and no `moduleResolution: "node"`/`node10`, both removed in TS 7.
   For a Vite project that means `"moduleResolution": "bundler"` and `"paths": { "*": ["./src/*"] }` in
   place of `baseUrl: "src"`.

Then extend both entry points:

```ts
import { defineConfig } from 'oxlint';
import config from '@novemberfiveco/oxc-config-vite';
import typeAware from '@novemberfiveco/oxc-config-vite/type-aware';

export default defineConfig({
  extends: [config, typeAware],
});
```

All seven rules ship as `error`. On an existing codebase that is usually thousands of findings, so a
project adopting this will normally start with everything as a warning and promote rule by rule as each
is driven to zero. `rules` merge with the project winning per rule:

```ts
export default defineConfig({
  extends: [config, typeAware],
  rules: {
    'typescript/no-floating-promises': 'warn',
    'typescript/no-misused-promises': 'warn',
    'typescript/await-thenable': 'warn',
    'typescript/no-unnecessary-condition': 'warn',
    'typescript/prefer-nullish-coalescing': 'warn',
    'typescript/prefer-optional-chain': 'warn',
    'typescript/no-unnecessary-type-assertion': 'warn',
  },
});
```

To adopt a rule in only part of the codebase, scope it with `overrides`:

```ts
overrides: [{ files: ['src/features/**'], rules: { 'typescript/no-floating-promises': 'error' } }],
```

To back out entirely without removing the import, set `options: { typeAware: false }`. The rules go inert
and cost nothing.

Two things to know before promoting any of these to `error` in CI:

- **Warnings are not automatically non-blocking.** `--max-warnings=0` (common in lint-staged) and
  `--deny-warnings` both make warnings fail. Drop those flags during a warn-phase rollout.
- **Type-aware linting builds a full type graph**, so it costs roughly what `tsc` costs. Measured on a
  4.6k-file project: the lint step goes from ~1s to ~9s, and from ~250ms to ~880ms per file for
  pre-commit and editor hooks.

### Editor fallback (if `oxfmt.config.ts` is not honored)

Some versions of the `oxc.oxc-vscode` extension don't pick up `oxfmt.config.ts`. If format-on-save
applies different settings than expected, copy the raw JSON config to your project root and point the
extension at it:

1. Copy `node_modules/@novemberfiveco/oxc-config-vite/.oxfmtrc.json` to `.oxfmtrc.json` in your project root.
2. Add to your `.vscode/settings.json` (workspace settings):
   ```json
   "oxc.fmt.configPath": ".oxfmtrc.json"
   ```

## Exports

| Entry point                                     | What it provides                            |
| ----------------------------------------------- | ------------------------------------------- |
| `@novemberfiveco/oxc-config-vite`               | OxLint config object (use with `extends`)   |
| `@novemberfiveco/oxc-config-vite/oxfmt`         | Oxfmt config object (use with spread)       |
| `@novemberfiveco/oxc-config-vite/oxlintrc.json` | Raw `.oxlintrc.json` for direct consumption |
| `@novemberfiveco/oxc-config-vite/oxfmtrc.json`  | Raw `.oxfmtrc.json` for direct consumption  |

## More

See [`docs/migration.md`](../../docs/migration.md) for editor setup, the nvm/asdf `oxc.path.node`
caveat, CI scripts, and the Claude Code format+lint hook.
