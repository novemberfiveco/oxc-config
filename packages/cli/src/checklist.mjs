export const CHECKLIST = `
Per-developer setup (each machine — can't be automated):
  1. Install the recommended VS Code extension "oxc.oxc-vscode" (VS Code will prompt you).
  2. nvm/asdf/volta users: if format-on-save does nothing, set in your USER settings:
       "oxc.path.node": "/absolute/path/to/your/node"
  3. macOS: do NOT set "oxc.useExecPath": true (it crashes oxfmt's native binding).
`;

export function printSummary(actions) {
  for (const a of actions) {
    const label =
      { create: '＋ create', merge: '↻ merge', patch: '✎ patch', skip: '· skip', advise: '! advise' }[
        a.type
      ] ?? a.type;
    console.log(`  ${label}  ${a.target}${a.note ? `  (${a.note})` : ''}`);
  }
}
