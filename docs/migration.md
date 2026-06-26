# Migrating from ESLint + Prettier to Oxc (OxLint + Oxfmt)

> Generic adoption guide for November Five projects. Covers the parity mapping, the features that
> must be dropped, the manual setup each developer must do, and how to wire the toolchain into CI
> and Claude Code.
>
> **Project-specific logs:** adopting projects keep their own living migration log recording
> codebase-specific obstacles, file counts, and audit percentages — and link here for the generic sections.

## Why

- **Speed.** OxLint is ~50–100× faster than ESLint; Oxfmt ~30× faster than Prettier. On large
  codebases the lint/format steps go from tens of seconds to sub-second.
- **One toolchain.** A single Rust binary set (`oxlint` + `oxfmt`) replaces ESLint + a stack of
  plugins + Prettier.

## Tool versions used

| Tool     | Version | Maturity                    |
| -------- | ------- | --------------------------- |
| `oxlint` | 1.68.0  | Stable (1.x since Aug 2025) |
| `oxfmt`  | 0.53.0  | **Pre-1.0 / beta**          |

## What you get

| Area              | Before                                                      | After                                                              |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Linter            | ESLint 9 flat config + `@novemberfiveco/eslint-config-vite` | `oxlint` + `oxlint.config.ts`                                      |
| Formatter         | Prettier 3.5.3 + `.prettierrc.yml`                          | `oxfmt` + `oxfmt.config.ts`                                        |
| Type check        | `tsc --noEmit`                                              | `tsc --noEmit` (**unchanged — still required**)                    |
| Lint+format check | `ci:eslint`: `eslint . && prettier . --check`               | `ci:lint`: `oxlint && oxfmt --check` (**renamed**)                 |
| Format in place   | `lint:fix`: `prettier --write '**/*.{ts,tsx,js,jsx,json}'`  | `format`: `oxfmt` (**renamed**)                                    |
| Lint autofix      | `eslint:fix`: `eslint src --fix`                            | `lint:fix`: `oxlint --fix` (**renamed**)                           |
| Pre-commit        | `tsc` + lint-staged (eslint + prettier)                     | `tsc` + lint-staged (oxlint --fix --max-warnings=0, oxfmt --check) |
| VSCode formatter  | `esbenp.prettier-vscode` + ESLint fixAll                    | `oxc.oxc-vscode` (format + fixAll)                                 |

## Adopting in a project

```bash
npm i -D @novemberfiveco/oxc-config-vite oxlint oxfmt
npx @novemberfiveco/oxc-config-vite init
```

`init` scaffolds `oxlint.config.ts`, `oxfmt.config.ts`, `.vscode/{settings,extensions}.json`,
the `.claude` format+lint hook, and `package.json` scripts. Then complete the per-machine steps
it prints (install the VS Code extension; node-manager users set `oxc.path.node`).

## Dropped — no Oxc equivalent

These are intentionally dropped under a "pure Oxc" approach (no second linter):

| Dropped                                  | Impact                                                             | Revisit                                          |
| ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| `eslint-plugin-simple-import-sort`       | No automatic import grouping/sorting (Oxfmt has only alphabetical) | Enable Oxfmt `sortImports` if any sort is wanted |
| `eslint-plugin-no-relative-import-paths` | Relative imports `../` no longer flagged                           | Re-add via OxLint JS-plugins when stable         |
| `@tanstack/eslint-plugin-query`          | TanStack Query anti-patterns no longer linted                      | OxLint JS-plugins (alpha)                        |
| `eslint-plugin-storybook`                | Storybook story lint rules dropped                                 | OxLint JS-plugins (alpha)                        |

All four **can** be re-enabled via OxLint's `jsPlugins` — but that API is **alpha and not
semver-safe** and re-introduces ESLint plugins as devDeps. For greenfield projects adopting the
template, the retrofit cost is near zero.

## Caveats / things to know

- **Oxfmt is pre-1.0 (0.53.0).** Lower maturity than OxLint 1.x. Its VSCode formatter integration is
  experimental and, on node-manager setups, needs `oxc.path.node` to start.
- **`$schema` cosmetic warning in git diff views.** Config files reference a schema inside
  `node_modules`; VSCode's `git:` URI scheme can't resolve that path and logs
  `Unable to load schema from 'git:/…/configuration_schema.json'`. Normal editing (`file:` scheme)
  works fine; the CLI ignores `$schema` entirely. To silence diff-view noise, add a workspace-relative
  mapping in `.vscode/settings.json`:
  `"json.schemas": [{ "fileMatch": [".oxlintrc.json"], "url": "./node_modules/oxlint/configuration_schema.json" }]`
- **Warning strictness is intentionally split:** `ci:lint` runs plain `oxlint` (warnings reported but
  do not fail CI), while pre-commit `lint-staged` runs `oxlint --fix --max-warnings=0` (any warning
  blocks the commit). Use `oxlint --deny-warnings` in CI if you want it to fail on warnings too.
- **OxLint is not type-aware** by default. `tsc --noEmit` remains the type checker and must stay in
  CI and pre-commit.
- **Minor JS/TS formatting divergences from Prettier 3.5.3** (interface heritage wrapping,
  member-chain breaks, JSX `&&` operand wrapping) are engine differences with no config remedy.
  Cosmetic only.
- **`sortPackageJson` is ON by default in Oxfmt** and reorders `package.json` keys. The shared config
  sets `"sortPackageJson": false` for parity with Prettier.
- **Published Oxfmt docs understate the supported options.** Always check the schema in
  `node_modules/oxfmt/configuration_schema.json`, not just the website — the full Prettier-compatible
  option set including `arrowParens` is exposed there.

## Editor setup (per developer — each machine)

The committed `.vscode/settings.json` enables everything portable. Per-machine steps:

1. **Install the Oxc VS Code extension** `oxc.oxc-vscode` (VS Code will prompt you; it's in
   `.vscode/extensions.json`).
2. **Disable Prettier (`esbenp.prettier-vscode`) and ESLint (`dbaeumer.vscode-eslint`) for this
   workspace** — the ESLint extension's fix-on-save strips OxLint-only `eslint-disable` directives.
3. **If you use a node version manager (nvm / asdf / volta): add `oxc.path.node` to your USER
   settings** — see the format-on-save troubleshooting section below.
4. **Reload the window** (prefer a full quit after changing `oxc.*` settings — the in-place restart
   is broken and leaves the formatter dead).
5. **Verify the formatter is registered:** open a `.tsx`, Command Palette →
   _Format Document With…_ → "Oxc Formatter" must be in the list.

### Troubleshooting: format-on-save silently does nothing (nvm / asdf / volta + macOS)

**Symptom.** Save doesn't format. _Format Document With…_ does **not** list "Oxc Formatter". The
"Oxc (Fmt)" output channel logs `Searching for oxfmt binary.` → `Using server binary at: …/oxfmt`
then **nothing** — no handshake, no error.

**Root cause.** `node_modules/.bin/oxfmt` is a Node shim (`#!/usr/bin/env node`). With nvm/asdf/volta,
`node` is not on the non-interactive PATH, so the shim can't launch, the LSP client never connects,
and no formatter provider is registered — silently.

**Fix.** Pin your resolved node in your **USER** settings (machine-specific — do **not** commit):

```jsonc
// VS Code user settings.json — adjust path to YOUR node
"oxc.path.node": "/Users/<you>/.nvm/versions/node/<version>/bin/node"
```

Get the path with `which node` (or `nvm which current`). Then fully quit and reopen VS Code.

**Pitfalls:**

- Do **NOT** use `"oxc.useExecPath": true` on macOS — it SIGTRAP-crashes oxfmt's native binding due
  to code-signing mismatch. `oxc.path.node` is the right lever.
- `oxc.fmt.experimental` and `oxc.trace.server` are inert in extension 1.58.0. The empty Fmt channel
  is not a useful signal — the only reliable check is whether "Oxc Formatter" appears in
  _Format Document With…_.
- The in-place restart is broken. Always do a full quit/reopen (not just _Reload Window_) after
  changing `oxc.*` settings.
- If the native formatter still won't register, formatting is **already enforced by the pre-commit
  hook** (lint-staged runs `oxfmt`), so worst case you lose on-save convenience, not correctness.

## CI scripts

The `init` command adds these scripts to `package.json`:

| Script     | Command                   | Purpose                   |
| ---------- | ------------------------- | ------------------------- |
| `ci:lint`  | `oxlint && oxfmt --check` | CI lint + format check    |
| `format`   | `oxfmt`                   | Format all files in place |
| `lint:fix` | `oxlint --fix`            | Lint with autofix         |

And this `lint-staged` config (pre-commit):

```json
{
  "*.{ts,tsx,js,jsx}": ["oxlint --fix --max-warnings=0", "oxfmt --check"],
  "*.{json,md,css,scss,yml,yaml,html}": ["oxfmt --check"]
}
```

Run `npm run ci:lint` in CI. `tsc --noEmit` must also stay in CI and pre-commit — OxLint does not
type-check.

## Claude Code hook: format + lint on every agent edit

Oxc's speed (sub-millisecond per file) makes it cheap enough to run **inside the agent's inner
loop**. The `init` command wires a Claude Code `PostToolUse` hook so every file an agent edits is
auto-formatted and lint-checked immediately.

**What it does** (after each `Edit` / `Write` / `MultiEdit`):

1. **oxfmt** formats the touched file in place, silently — never blocks.
2. **oxlint** (`--deny-warnings`) runs on the JS/TS family; if it finds any issue, the messages go
   to stderr and the hook exits `2`, feeding them back to the agent as inline feedback.

The hook degrades to a no-op (exit 0) when `node` or the oxc bins aren't resolvable (fresh worktree,
deps not installed), so it's safe everywhere.

The hook is committed to `.claude/settings.json` (not `settings.local.json`) so the whole team's
agents get it. Claude Code picks it up without a session reload.

If `--deny-warnings` is too noisy for your project, drop it from the hook script — only errors will
surface; warnings stay silent and show up in the editor/CI instead.
