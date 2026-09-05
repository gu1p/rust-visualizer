import { readFileSync, readdirSync, statSync } from 'node:fs';

/** Check repository-owned source boundaries; generated bindings are excluded. */
function files(directory) {
  return readdirSync(directory).flatMap(name => {
    const path = `${directory}/${name}`;
    return statSync(path).isDirectory() ? name === 'gen' ? [] : files(path) : [path];
  });
}

const violations = [];
for (const path of [...files('src'), ...files('web'), ...files('scripts'), ...files('tests')]) {
  if (!/\.(rs|ts|mjs|css|html)$/.test(path) || path.includes('/fixtures/')) continue;
  const lines = readFileSync(path, 'utf8').trimEnd().split('\n');
  if (lines.length > 400) violations.push(`${path}: ${lines.length} lines (maximum 400)`);
  if (!path.endsWith('.rs')) continue;
  for (let i = 0; i < lines.length; i++) {
    const start = /^(\s*)(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+(\w+)/.exec(lines[i]);
    if (!start) continue;
    const close = new RegExp(`^${start[1]}\\}$`);
    let end = i + 1;
    while (end < lines.length && !close.test(lines[end])) end++;
    if (end < lines.length && end - i + 1 > 50) violations.push(`${path}:${i + 1}: ${start[2]} has ${end - i + 1} lines (maximum 50)`);
    i = end;
  }
}
if (violations.length) { console.error(violations.join('\n')); process.exitCode = 1; }
else console.log('Source policy: files ≤400 lines; Rust functions ≤50 lines.');
