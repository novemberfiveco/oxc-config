# @novemberfiveco/oxc-config-cli

Internal CLI package that powers the `init` command for `@novemberfiveco/oxc-config-*` framework packages. You normally run it through a framework package rather than directly:

```bash
npx @novemberfiveco/oxc-config-vite init
```

## What `init` does

`init` operates in two modes depending on whether a file already exists:

**Create-if-absent** (never overwrites unless `--force`):

- `oxlint.config.ts` — OxLint config extending the shared package config
- `oxfmt.config.ts` — Oxfmt config spreading the shared package config
- `.claude/hooks/oxc-format-lint.sh` — post-edit hook script (skipped with `--no-claude-hook`)

**Create-or-merge** (safe to run on an existing project):

- `.vscode/settings.json` — merges Oxc formatter and editor settings into existing file
- `.vscode/extensions.json` — merges the `oxc.oxc-vscode` recommendation into existing file
- `.claude/settings.json` — merges the `PostToolUse` hook entry into existing file (skipped with `--no-claude-hook`)

**Patch** (adds missing keys, skips keys already set):

- `package.json` `scripts` — adds `format`, `lint:fix`, `ci:lint`
- `package.json` `lint-staged` — adds the pre-commit oxlint + oxfmt config

After running, `init` prints a checklist of per-machine steps that can't be automated (VS Code extension install, `oxc.path.node` for nvm/asdf/volta users).

## Flags

| Flag               | Effect                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| `--dry-run`        | Print what would change without writing any files                       |
| `--force`          | Overwrite create-if-absent files that already exist                     |
| `--no-claude-hook` | Skip creating `.claude/hooks/oxc-format-lint.sh` and the settings entry |
| `--install`        | Reserved for future use (accepted but currently a no-op)                |

## Direct invocation

When invoked directly (not via a framework shim), the CLI defaults to the `@novemberfiveco/oxc-config-vite` package. Prefer using the framework package's own binary so the correct config package name is embedded in the generated files.
