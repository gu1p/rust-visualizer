import { test, expect } from '@playwright/test';
import protobuf from 'protobufjs';

const graphSchema = protobuf.loadSync('proto/graph.proto').lookupType('visualizer.Graph');

test('repository tree starts shallow and exposes colorful crate, folder, and file icons', async ({ page }) => {
  await page.goto('/');
  const tree = page.getByRole('tree', { name: 'Arquivos do repositório' });
  await expect(tree).toBeVisible();
  const crate = tree.getByRole('treeitem', { name: 'journey', exact: true });
  await expect(crate).toHaveAttribute('aria-expanded', 'true');
  const folder = tree.getByRole('treeitem', { name: 'src', exact: true });
  await expect(folder).toHaveAttribute('aria-expanded', 'false');
  await expect(tree.getByRole('treeitem', { name: 'main.rs', exact: true })).toHaveCount(0);
  await folder.focus();
  await page.keyboard.press('ArrowRight');
  const file = tree.getByRole('treeitem', { name: 'main.rs', exact: true });
  await expect(file).toBeVisible();
  await file.click();
  await expect(page.getByRole('region', { name: 'Grafo interativo' })).toContainText('process');
  await expect(page.getByRole('region', { name: 'Grafo interativo' })).not.toContainText('Entrada');
  for (const kind of ['crate', 'folder', 'rust', 'toml', 'markdown']) {
    await expect(tree.locator(`svg[data-icon="${kind}"]`).first()).toBeVisible();
  }
  const colors = await tree.locator('svg[data-icon]').evaluateAll(icons => icons.map(icon => getComputedStyle(icon).color));
  expect(new Set(colors).size).toBeGreaterThanOrEqual(4);
  await page.getByRole('searchbox', { name: 'Buscar arquivos' }).fill('check.yml');
  await expect(tree.getByRole('treeitem', { name: 'check.yml', exact: true })).toBeVisible();
  await expect(tree.locator('svg[data-icon="yaml"]')).toBeVisible();
});

test('architecture expands exactly one layer and can collapse it again', async ({ page }) => {
  await page.goto('/');
  const graph = page.getByRole('region', { name: 'Grafo interativo' });
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(1);
  await graph.getByRole('button', { name: 'Selecionar journey', exact: true }).click();
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(1);
  await graph.getByRole('button', { name: 'Expandir journey', exact: true }).click();
  await expect(graph.getByRole('button', { name: 'Selecionar src', exact: true })).toBeVisible();
  await expect(graph.getByRole('button', { name: 'Selecionar main.rs', exact: true })).toHaveCount(0);
  await graph.getByRole('button', { name: 'Expandir src', exact: true }).click();
  await expect(graph.getByRole('button', { name: 'Selecionar main.rs', exact: true })).toBeAttached();
  await expect(graph.getByRole('button', { name: 'Selecionar process', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Recolher tudo' }).click();
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(1);
});

test('flow and calls start at one node, expand on demand, and retain separate exploration state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Símbolos', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  const graph = page.getByRole('region', { name: 'Grafo interativo' });
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(1);
  await page.getByRole('button', { name: 'Expandir próxima camada' }).click();
  expect(await graph.getByRole('button', { name: /^Selecionar / }).count()).toBeGreaterThan(1);
  await page.getByRole('tab', { name: 'Fluxo', exact: true }).click();
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(1);
  await expect(graph.getByRole('button', { name: 'Selecionar Entrada', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expandir próxima camada' }).click();
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(2);
  await page.getByRole('tab', { name: 'Chamadas', exact: true }).click();
  expect(await graph.getByRole('button', { name: /^Selecionar / }).count()).toBeGreaterThan(1);
  await page.getByRole('tab', { name: 'Fluxo', exact: true }).click();
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(2);
});

test('dragging moves a node rather than the camera, updates edges, and survives expansion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Símbolos', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('tab', { name: 'Fluxo', exact: true }).click();
  await page.getByRole('button', { name: 'Expandir próxima camada' }).click();
  const entry = page.getByRole('button', { name: 'Selecionar Entrada', exact: true });
  const before = (await entry.boundingBox())!;
  const camera = await page.locator('#scene').getAttribute('style');
  const edge = await page.locator('.graph-edge').first().getAttribute('d');
  await page.mouse.move(before.x + 45, before.y + 35);
  await page.mouse.down();
  await page.mouse.move(before.x + 125, before.y + 70, { steps: 8 });
  await page.mouse.up();
  const after = (await entry.boundingBox())!;
  expect(after.x - before.x).toBeCloseTo(80, 0);
  expect(after.y - before.y).toBeCloseTo(35, 0);
  expect(await page.locator('#scene').getAttribute('style')).toBe(camera);
  expect(await page.locator('.graph-edge').first().getAttribute('d')).not.toBe(edge);
  await expect(page.locator('#detail-name')).toHaveText('process');
  await page.getByRole('button', { name: 'Expandir próxima camada' }).click();
  expect((await entry.boundingBox())!.x).toBeCloseTo(after.x, 0);
  await entry.focus();
  await page.keyboard.press('Shift+ArrowLeft');
  expect((await entry.boundingBox())!.x).toBeLessThan(after.x - 5);
});

test('file tree search has a recoverable empty state and does not lose expansion', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Buscar arquivos' });
  await search.fill('missing-file-xyz');
  await expect(page.getByText('Nenhum arquivo encontrado.')).toBeVisible();
  await search.fill('storage.rs');
  await expect(page.getByRole('treeitem', { name: 'storage.rs', exact: true })).toBeVisible();
  await search.clear();
  await expect(page.getByRole('treeitem', { name: 'src', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

test('newly revealed flow steps stay in view until the user manually arranges the canvas', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Símbolos', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('tab', { name: 'Fluxo', exact: true }).click();
  await page.getByRole('button', { name: 'Expandir próxima camada' }).click();
  await page.getByRole('button', { name: 'Expandir próxima camada' }).click();
  const graph = page.getByRole('region', { name: 'Grafo interativo' });
  const viewport = (await graph.boundingBox())!;
  for (const card of await graph.getByRole('button', { name: /^Selecionar / }).all()) {
    const box = (await card.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(viewport.y);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.y + viewport.height);
  }
});

test('choosing a type opens only that type and explicitly expands its relationships', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Símbolos', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir Store', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Tipos', exact: true })).toHaveAttribute('aria-selected', 'true');
  const graph = page.getByRole('region', { name: 'Grafo interativo' });
  await expect(graph.getByRole('button', { name: /^Selecionar / })).toHaveCount(1);
  await graph.getByRole('button', { name: 'Expandir Store', exact: true }).click();
  await expect(graph.getByRole('button', { name: 'Selecionar Repository', exact: true })).toBeVisible();
});

test('crate rows retain physical folder names even when the package has a different name', async ({ page }) => {
  const body = Buffer.from(graphSchema.encode({ name: 'workspace', nodes: [
    { id: 'root', name: 'workspace', kind: 'folder' },
    { id: 'tools', name: 'tools', kind: 'folder', parent: 'root', file: 'tools' },
    { id: 'crate', name: 'format_core', kind: 'crate', parent: 'tools', file: 'tools/formatter/Cargo.toml' },
  ] }).finish());
  await page.route('**/api/graph', route => route.fulfill({ contentType: 'application/x-protobuf', body }));
  await page.goto('/');
  await page.getByRole('treeitem', { name: 'tools', exact: true }).click();
  const crate = page.getByRole('treeitem', { name: 'formatter', exact: true });
  await expect(crate).toBeVisible();
  await expect(crate).toHaveAttribute('title', /format_core/);
});

test('an empty repository has an explicit file-tree empty state', async ({ page }) => {
  const body = Buffer.from(graphSchema.encode({ name: 'empty', nodes: [] }).finish());
  await page.route('**/api/graph', route => route.fulfill({ contentType: 'application/x-protobuf', body }));
  await page.goto('/');
  await expect(page.getByText('Nenhum arquivo disponível nesta análise.')).toBeVisible();
  await expect(page.getByRole('treeitem')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Conversar com IA' })).toBeEnabled();
});
