#!/usr/bin/env bash
#
# PostToolUse hook: after Claude edits a file, auto-format it with oxfmt and
# lint it with oxlint. oxc is fast enough (~ms) to sit in the agent's inner
# loop, so Claude gets lint feedback on each edit instead of at PR time.
#
# Behaviour:
#   - oxfmt: formats the touched file in place, silently. Never blocks.
#   - oxlint: if it finds any issues (errors OR warnings, via --deny-warnings),
#     the messages are written to stderr and the hook exits 2, which surfaces
#     them back to Claude as feedback so it can fix before moving on.
#
# Degrades to a no-op (exit 0) when node or the oxc binaries aren't available,
# so it's safe in worktrees/checkouts that don't have deps installed.

set -uo pipefail

# Read the hook payload (JSON) from stdin.
payload=$(cat)

root="${CLAUDE_PROJECT_DIR:-$PWD}"
bin="$root/node_modules/.bin"

# oxc bins are `#!/usr/bin/env node` shims — bail quietly if node or the bins
# aren't resolvable rather than spamming errors.
command -v node >/dev/null 2>&1 || exit 0
[ -x "$bin/oxfmt" ] || exit 0

# Pull tool_input.file_path out of the payload with node (already guaranteed).
file=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try {
      const j = JSON.parse(s);
      process.stdout.write((j.tool_input && j.tool_input.file_path) || "");
    } catch {
      process.stdout.write("");
    }
  });
')

[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# Only touch files oxc understands.
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.css | *.scss | *.md | *.yml | *.yaml | *.html) ;;
  *) exit 0 ;;
esac

# 1. Format in place, silently. Failure here never blocks the edit.
"$bin/oxfmt" "$file" >/dev/null 2>&1 || true

# 2. Lint the JS/TS family and surface errors back to Claude (exit 2).
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs)
    [ -x "$bin/oxlint" ] || exit 0
    # --deny-warnings makes warnings (not just errors) exit non-zero, so both
    # are surfaced back to Claude.
    if ! out=$("$bin/oxlint" --deny-warnings "$file" 2>&1); then
      {
        echo "oxlint reported issues in $file — please fix:"
        echo "$out"
      } >&2
      exit 2
    fi
    ;;
esac

exit 0
