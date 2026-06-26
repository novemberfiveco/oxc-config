#!/usr/bin/env node
import { parseArgs } from '@novemberfiveco/oxc-config-cli/parse-args';
import { run } from '@novemberfiveco/oxc-config-cli';
import { printSummary, CHECKLIST } from '@novemberfiveco/oxc-config-cli/checklist';

const PKG = '@novemberfiveco/oxc-config-vite';
const { command, options } = parseArgs(process.argv.slice(2));

if (command !== 'init') {
  console.error(
    'Usage: npx @novemberfiveco/oxc-config-vite init [--dry-run] [--force] [--no-claude-hook] [--install]',
  );
  process.exit(1);
}

const { actions } = await run({ ...options, pkg: PKG });
console.log(`\noxc setup for ${PKG}${options.dryRun ? ' (dry run)' : ''}:\n`);
printSummary(actions);
console.log(CHECKLIST);
