import { test, expect } from '@playwright/test';

test('explore from a symbol to its branches and source', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'rust-visualizer', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conversar com IA' })).toBeEnabled();
  await page.getByRole('searchbox', { name: 'Buscar símbolos' }).fill('process');
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('tab', { name: 'Fluxo' }).click();
  await expect(page.getByRole('region', { name: 'Grafo interativo' })).toContainText('amount < 0');
  await expect(page.getByRole('region', { name: 'Código-fonte' })).toContainText('save(total).await?');
  await expect(page.getByRole('button', { name: 'Ajustar grafo' })).toBeEnabled();
  await expect(page.getByText('Análise estática', { exact: false }).first()).toBeVisible();
});

test('keyboard opens accessible AI dialog and restores focus', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Conversar com IA' });
  await opener.focus();
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog', { name: 'Converse com o código' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sua pergunta' })).toBeFocused();
  await expect(page.getByText('OPENAI_API_KEY', { exact: false })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('search empty state is explicit and recoverable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar símbolos' }).fill('does-not-exist');
  await expect(page.getByText('Nenhum símbolo encontrado.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar símbolos' }).fill('main');
  await expect(page.getByRole('button', { name: 'Abrir main', exact: true })).toBeVisible();
});

test('flow opens at a readable scale and still offers a full-graph fit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('tab', { name: 'Fluxo' }).click();
  const entry = page.getByRole('button', { name: 'Selecionar Entrada', exact: true });
  expect((await entry.boundingBox())!.width).toBeGreaterThanOrEqual(140);
  await page.getByRole('button', { name: 'Ajustar grafo' }).click();
  await expect(entry).toBeVisible();
});

test('a flow walkthrough offers branch choices rather than inventing an execution', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('button', { name: 'Percorrer fluxo' }).click();
  for (let i = 0; i < 8; i++) {
    if (await page.getByRole('button', { name: 'Seguir: sim', exact: true }).isVisible()) break;
    await page.getByRole('button', { name: 'Próximo passo' }).click();
  }
  await expect(page.getByRole('button', { name: 'Seguir: sim', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seguir: não', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir: sim', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Percurso no grafo' })).toBeVisible();
});

test('loading and graph errors are visible and retry is usable', async ({ page }) => {
  let release: () => void = () => {};
  const wait = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/graph', async route => { await wait; await route.fulfill({ status: 500, body: '' }); });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Carregando');
  release();
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar');
  await page.unroute('**/api/graph');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: 'Abrir main', exact: true })).toBeVisible();
});
