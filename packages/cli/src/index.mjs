import { writeIfAbsent } from './fs-utils.mjs';
import { renderConfigTemplates, readTemplate } from './templates.mjs';
import { applyVscodeSettings } from './merge-vscode-settings.mjs';
import { applyExtensions } from './merge-extensions.mjs';
import { applyClaudeSettings } from './merge-claude.mjs';
import { patchPackageJson } from './patch-package-json.mjs';
import { checkDeps } from './dep-check.mjs';

export async function run(options) {
  const { pkg, cwd = process.cwd(), dryRun = false, force = false, claudeHook = true } = options;
  if (!pkg) throw new Error('run() requires a `pkg` option');

  const actions = [];
  const configs = renderConfigTemplates(pkg);
  for (const [relPath, content] of Object.entries(configs)) {
    actions.push(await writeIfAbsent({ cwd, relPath, content, force, dryRun }));
  }

  if (claudeHook) {
    actions.push(
      await writeIfAbsent({
        cwd,
        relPath: '.claude/hooks/oxc-format-lint.sh',
        content: readTemplate('claude/hooks/oxc-format-lint.sh'),
        mode: 0o755,
        force,
        dryRun,
      }),
    );
  }

  actions.push(await applyVscodeSettings({ cwd, dryRun }));
  actions.push(await applyExtensions({ cwd, dryRun }));
  if (claudeHook) actions.push(await applyClaudeSettings({ cwd, dryRun }));

  actions.push(...(await patchPackageJson({ cwd, dryRun })));

  actions.push((await checkDeps({ cwd, pkg })).action);

  return { actions };
}
