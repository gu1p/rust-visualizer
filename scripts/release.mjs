import { pathToFileURL } from 'node:url';

/** Derive a monotonically increasing patch version; reruns keep the same version. */
export function releaseVersion(runNumber) {
  if (!/^[1-9]\d*$/.test(runNumber) || !Number.isSafeInteger(Number(runNumber))) {
    throw new Error('Expected a positive workflow run number');
  }
  return `0.1.${runNumber}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(releaseVersion(process.env.GITHUB_RUN_NUMBER || ''));
}
