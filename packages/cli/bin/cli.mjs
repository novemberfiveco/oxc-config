#!/usr/bin/env node
import { parseArgs } from '../src/parse-args.mjs';
import { run } from '../src/index.mjs';
import { printSummary, CHECKLIST } from '../src/checklist.mjs';

const { command, options } = parseArgs(process.argv.slice(2));

if (command !== 'init') {
  console.error('Usage: oxc-config-init init [--dry-run] [--force] [--no-claude-hook] [--install]');
  process.exit(1);
}

// When invoked directly (not via a framework shim), default to the vite package.
const pkg = options.pkg ?? '@novemberfiveco/oxc-config-vite';
const { actions } = await run({ ...options, pkg });
console.log(`\noxc setup for ${pkg}${options.dryRun ? ' (dry run)' : ''}:\n`);
printSummary(actions);
console.log(CHECKLIST);
