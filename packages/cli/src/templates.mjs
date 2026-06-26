import { readFileSync } from 'node:fs';

const TEMPLATES = new URL('../templates/', import.meta.url);

export function readTemplate(relPath) {
  return readFileSync(new URL(relPath, TEMPLATES), 'utf8');
}

export function renderConfigTemplates(pkg) {
  const oxlint = readTemplate('oxlint.config.ts.tpl').replaceAll('__PKG__', pkg);
  const oxfmt = readTemplate('oxfmt.config.ts.tpl').replaceAll('__PKG__', pkg);
  return { 'oxlint.config.ts': oxlint, 'oxfmt.config.ts': oxfmt };
}
