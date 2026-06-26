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
