import { readFileSync } from 'node:fs';

const TEMPLATES = new URL('../templates/', import.meta.url);

export function readTemplate(relPath) {
  return readFileSync(new URL(relPath, TEMPLATES), 'utf8');
}

export function renderConfigTemplates(pkg) {
  const oxlint = readTemplate('oxlint.config.ts.tpl').replaceAll('__PKG__', pkg);
  // oxfmt: scaffold a plain .oxfmtrc.json (NOT oxfmt.config.ts). The oxc VS Code
  // formatter LSP only reads .oxfmtrc.json (never oxfmt.config.ts), and a .ts
  // config also needs Node >=22.18 to evaluate. JSON works everywhere — editor
  // (via RunOnSave + the oxfmt CLI), CLI, and CI — with no Node requirement.
  // oxfmt has no `extends`, so this is a copy of the shared config; re-run init
  // (or sync manually) after upgrading the package.
  const oxfmtrc = readTemplate('oxfmtrc.json');
  return { 'oxlint.config.ts': oxlint, '.oxfmtrc.json': oxfmtrc };
}
