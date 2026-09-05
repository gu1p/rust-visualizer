import { build } from 'esbuild';
import { mkdir, copyFile, readFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
const notices = (await readFile('THIRD_PARTY_NOTICES.md', 'utf8')).replaceAll('*/', '* /');
await build({
  entryPoints: ['web/app.ts'], bundle: true, outfile: 'dist/app.js',
  format: 'iife', platform: 'browser', target: 'es2022', minify: true,
  legalComments: 'inline', sourcemap: false,
  banner: { js: `/*!\n${notices}\n*/` },
});
await copyFile('web/index.html', 'dist/index.html');
await copyFile('web/app.css', 'dist/app.css');
