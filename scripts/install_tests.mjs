import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const installer = fileURLToPath(new URL('../install.sh', import.meta.url));
const version = 'v0.1.123';
const program = '#!/bin/sh\nprintf "rust-visualizer 0.1.123\\n"\n';

function fixture(t, os = 'Linux', arch = 'x86_64', target = 'x86_64-unknown-linux-musl') {
  const root = mkdtempSync(join(tmpdir(), 'rv-installer-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  const source = join(root, 'source');
  const destination = join(root, 'installed tools');
  mkdirSync(bin);
  mkdirSync(source);
  const asset = `rust-visualizer-${version}-${target}.tar.gz`;
  writeFileSync(join(source, 'rust-visualizer'), program, { mode: 0o755 });
  const archive = join(root, asset);
  execFileSync('tar', ['-czf', archive, '-C', source, './rust-visualizer'], { timeout: 15000 });
  const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');
  writeFileSync(join(root, 'SHA256SUMS'), `${digest}  ./${asset}\n`);
  writeFileSync(join(bin, 'uname'), '#!/bin/sh\ncase "$1" in -s) echo "$RV_TEST_OS";; -m) echo "$RV_TEST_ARCH";; esac\n', { mode: 0o755 });
  writeFileSync(join(bin, 'curl'), `#!/bin/sh
set -eu
output=''
url=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o|--output) output=$2; shift 2;;
    https://*) url=$1; shift;;
    *) shift;;
  esac
done
printf '%s\\n' "$url" >> "$RV_TEST_ROOT/requests"
[ "\${RV_TEST_FAIL:-0}" != 1 ] || exit 22
case "$url" in
  https://github.com/gu1p/rust-visualizer/releases/latest)
    printf 'https://github.com/gu1p/rust-visualizer/releases/tag/%s' "\${RV_TEST_TAG:-v0.1.123}";;
  https://github.com/gu1p/rust-visualizer/releases/download/v0.1.123/SHA256SUMS)
    cp "$RV_TEST_ROOT/SHA256SUMS" "$output";;
  https://github.com/gu1p/rust-visualizer/releases/download/v0.1.123/"$RV_TEST_ASSET")
    cp "$RV_TEST_ROOT/$RV_TEST_ASSET" "$output";;
  *) printf 'Unexpected URL: %s\\n' "$url" >&2; exit 23;;
esac
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, RV_INSTALL_DIR: destination,
    RV_TEST_ROOT: root, RV_TEST_OS: os, RV_TEST_ARCH: arch, RV_TEST_ASSET: asset };
  return { root, destination, archive, env, run: (extra = {}) => spawnSync('sh', [installer],
    { env: { ...env, ...extra }, encoding: 'utf8', timeout: 15000 }) };
}

test('README provides one copyable curl command that installs the latest release', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /```sh\ncurl -fsSL https:\/\/raw\.githubusercontent\.com\/gu1p\/rust-visualizer\/main\/install\.sh \| sh\n```/);
});

for (const [os, arch, target] of [
  ['Linux', 'x86_64', 'x86_64-unknown-linux-musl'],
  ['Linux', 'aarch64', 'aarch64-unknown-linux-musl'],
  ['Darwin', 'x86_64', 'x86_64-apple-darwin'],
  ['Darwin', 'arm64', 'aarch64-apple-darwin'],
]) {
  test(`installs and upgrades latest ${os}/${arch} into a path with spaces`, (t) => {
    const f = fixture(t, os, arch, target);
    let result = f.run();
    assert.equal(result.status, 0, result.stderr);
    const binary = join(f.destination, 'rust-visualizer');
    assert.equal(execFileSync(binary, { encoding: 'utf8' }).trim(), 'rust-visualizer 0.1.123');
    writeFileSync(binary, 'previous version');
    result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(binary, 'utf8'), program);
    assert.match(result.stdout, /v0\.1\.123/);
    assert.match(result.stdout, /PATH/);
  });
}

test('checksum failure preserves an already installed executable', (t) => {
  const f = fixture(t);
  mkdirSync(f.destination);
  writeFileSync(join(f.destination, 'rust-visualizer'), 'keep this version');
  writeFileSync(f.archive, 'tampered archive');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checksum/i);
  assert.equal(readFileSync(join(f.destination, 'rust-visualizer'), 'utf8'), 'keep this version');
});

test('a missing checksum never installs an unverified archive', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.root, 'SHA256SUMS'), '');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checksum/i);
});

test('unsupported platforms fail before a download', (t) => {
  const f = fixture(t, 'FreeBSD', 'x86_64');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsupported platform/i);
  assert.throws(() => readFileSync(join(f.root, 'requests')));
});

test('network failure leaves an existing executable intact', (t) => {
  const f = fixture(t);
  mkdirSync(f.destination);
  writeFileSync(join(f.destination, 'rust-visualizer'), 'keep this version');
  assert.notEqual(f.run({ RV_TEST_FAIL: '1' }).status, 0);
  assert.equal(readFileSync(join(f.destination, 'rust-visualizer'), 'utf8'), 'keep this version');
});

test('unexpected release tags are rejected before constructing download paths', (t) => {
  const f = fixture(t);
  const result = f.run({ RV_TEST_TAG: 'not-a-version' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release version/i);
  assert.equal(readFileSync(join(f.root, 'requests'), 'utf8').trim().split('\n').length, 1);
});
