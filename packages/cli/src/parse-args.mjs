export function parseArgs(argv) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  const has = flag => args.includes(flag);
  return {
    command,
    options: {
      dryRun: has('--dry-run'),
      force: has('--force'),
      claudeHook: !has('--no-claude-hook'),
      install: has('--install'),
    },
  };
}
