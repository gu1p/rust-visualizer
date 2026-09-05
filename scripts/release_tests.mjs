import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseVersion } from './release.mjs';

test('each workflow run receives an increasing patch version and reruns are stable', () => {
  assert.equal(releaseVersion('41'), '0.1.41');
  assert.equal(releaseVersion('42'), '0.1.42');
  assert.equal(releaseVersion('42'), releaseVersion('42'));
});

test('untrusted or invalid version inputs are rejected', () => {
  for (const invalid of ['', '-1', '1; echo bad', '1.5', '0', '9007199254740992']) {
    assert.throws(() => releaseVersion(invalid));
  }
});
