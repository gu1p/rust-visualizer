import { test, expect } from '@playwright/test';
import protobuf from 'protobufjs';

const schema = protobuf.loadSync('proto/graph.proto');
const encode = (name: string, value: object) => Buffer.from(schema.lookupType(`visualizer.${name}`).encode(value).finish());

test('AI answers as text, graph tour and playable synthesized speech', async ({ page }) => {
  const raw = await (await page.request.get('/api/graph')).body();
  const graph = schema.lookupType('visualizer.Graph').decode(raw) as unknown as { nodes: { id: string; name: string }[] };
  const process = graph.nodes.find(n => n.name === 'process')!;
  const normalize = graph.nodes.find(n => n.name === 'normalize')!;
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: {
      cancel() {}, speak(utterance: SpeechSynthesisUtterance) { document.body.dataset.spoken = utterance.text; },
    } });
  });
  await page.route('**/api/session', route => route.fulfill({ contentType: 'application/x-protobuf', body: encode('Session', { aiEnabled: true, provider: 'mock', model: 'test', token: 'local-test' }) }));
  await page.route('**/api/chat', async route => {
    const request = schema.lookupType('visualizer.ChatRequest').decode(route.request().postDataBuffer()!) as unknown as { question: string; selectedIds: string[] };
    expect(request.question).toContain('fluxo');
    expect(request.selectedIds).toContain(process.id);
    expect(route.request().headers()['x-rv-session']).toBe('local-test');
    await route.fulfill({ contentType: 'application/x-protobuf', body: encode('ChatResponse', {
      answer: 'Primeiro valida. Depois normaliza. <script>alert(1)</script>',
      highlights: [process.id, normalize.id], steps: [
        { nodeId: process.id, explanation: 'Validação da entrada.' },
        { nodeId: normalize.id, explanation: 'Normalização do valor.' },
      ],
    }) });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir process', exact: true }).click();
  await page.getByRole('button', { name: 'Conversar com IA' }).click();
  await page.getByRole('textbox', { name: 'Sua pergunta' }).fill('Explique o fluxo');
  await page.getByRole('button', { name: 'Enviar', exact: false }).click();
  await expect(page.getByText('Primeiro valida. Depois normaliza.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Ouvir resposta' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-spoken', /Primeiro valida/);
  await page.getByRole('button', { name: 'Mostrar no grafo' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('region', { name: 'Percurso no grafo' })).toContainText('Validação da entrada.');
  await expect(page.locator('.graph-node.highlighted')).toHaveCount(2);
  await page.getByRole('button', { name: 'Próximo passo' }).click();
  await expect(page.getByRole('region', { name: 'Percurso no grafo' })).toContainText('Normalização do valor.');
});

test('provider failure leaves the question available to retry', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ body: encode('Session', { aiEnabled: true, token: 'test' }) }));
  await page.route('**/api/chat', route => route.fulfill({ status: 502, body: encode('ChatResponse', { error: 'Limite do provedor. Tente novamente.' }) }));
  await page.goto('/');
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('textbox', { name: 'Sua pergunta' }).fill('Por que falhou?');
  await page.getByRole('button', { name: 'Enviar', exact: false }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Limite do provedor' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sua pergunta' })).toHaveValue('Por que falhou?');
  await expect(page.getByRole('button', { name: 'Enviar', exact: false })).toBeEnabled();
});
