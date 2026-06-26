import { mkdir, writeFile, access, chmod } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function writeIfAbsent({
  cwd,
  relPath,
  content,
  mode,
  force = false,
  dryRun = false,
}) {
  const abs = join(cwd, relPath);
  const exists = await access(abs)
    .then(() => true)
    .catch(() => false);
  if (exists && !force) return { type: 'skip', target: relPath, note: 'already exists' };
  if (dryRun) return { type: 'create', target: relPath, note: 'dry run' };
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
  if (mode) await chmod(abs, mode);
  return { type: 'create', target: relPath };
}
