import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('one exported HTML supports graph navigation offline with zero network assets', async ({ page, context }) => {
  const directory = mkdtempSync(join(tmpdir(), 'rv-offline-'));
  const output = join(directory, 'ARCHITECTURE.html');
  try {
    execFileSync(resolve(process.env.CARGO_TARGET_DIR || 'target', 'debug/rust-visualizer'), ['export', 'tests/fixtures/journey', '--output', output]);
    const requests: string[] = [];
    page.on('request', request => { if (!request.url().startsWith('file:')) requests.push(request.url()); });
    await context.setOffline(true);
    await page.goto(pathToFileURL(output).href);
    await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
    await page.getByRole('tab', { name: 'Fluxo' }).click();
    await expect(page.getByRole('region', { name: 'Grafo interativo' })).toContainText('propagar erro');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByText('Este HTML funciona offline.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar', exact: false })).toBeDisabled();
    expect(requests).toEqual([]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('mobile layout retains symbol, graph, source, and dialog access', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('tab', { name: 'Fluxo' }).click();
  await expect(page.getByRole('region', { name: 'Código-fonte' })).toContainText('save(total).await?');
  await page.getByRole('button', { name: 'Conversar com IA' }).click();
  await expect(page.getByRole('textbox', { name: 'Sua pergunta' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar diálogo' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
