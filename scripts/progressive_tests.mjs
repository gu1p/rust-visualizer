import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['web/progressive.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { layeredGraph, neighbors } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const node = (id, kind, parent = '') => ({ id, kind, parent, name: id, entryPoint: false });
const edge = (from, to, kind = 'contains') => ({ from, to, kind, label: '' });
const nodes = [node('crate', 'crate'), node('src', 'folder', 'crate'), node('file', 'file', 'src'),
  node('main', 'function', 'file'), node('entry', 'entry', 'main'), node('branch', 'branch', 'main'),
  node('yes', 'return', 'main'), node('no', 'return', 'main'), node('helper', 'function', 'file')];
const edges = [edge('crate', 'src'), edge('src', 'file'), edge('file', 'main'), edge('file', 'helper'),
  edge('entry', 'branch', 'flow'), edge('branch', 'yes', 'flow'), edge('branch', 'no', 'flow'),
  edge('yes', 'entry', 'flow'), edge('main', 'helper', 'calls')];
const context = (view, expanded = [], extra = {}) => ({ view, focus: 'main', scope: '', expanded: new Set(expanded), revealed: new Set(), ...extra });
const ids = model => model.nodes.map(n => n.id);

test('architecture reveals only the next explicitly expanded filesystem level', () => {
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('architecture'))), ['crate']);
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('architecture', ['crate']))), ['crate', 'src']);
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('architecture', ['crate', 'src']))), ['crate', 'src', 'file']);
});

test('collapsing an ancestor hides descendants even when their expansion is remembered', () => {
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('architecture', ['src', 'file']))), ['crate']);
});

test('flow starts at entry and expands branches one layer at a time without looping', () => {
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('flow'))), ['entry']);
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('flow', ['entry']))), ['entry', 'branch']);
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('flow', ['entry', 'branch', 'yes']))), ['entry', 'branch', 'yes', 'no']);
});

test('call neighbors are not shown until the selected root is expanded', () => {
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('calls'))), ['main']);
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('calls', ['main']))), ['main', 'helper']);
  assert.deepEqual(neighbors('helper', nodes, edges, 'calls'), ['main']);
});

test('a tour can reveal its next node without revealing the rest of the function', () => {
  const model = layeredGraph(nodes, edges, context('flow', [], { revealed: new Set(['branch']) }));
  assert.deepEqual(new Set(ids(model)), new Set(['entry', 'branch']));
  assert.equal(model.edges.length, 1);
});

test('a selected file becomes a scoped root, keeping unrelated symbols hidden', () => {
  assert.deepEqual(ids(layeredGraph(nodes, edges, context('architecture', ['file'], { scope: 'file' }))), ['file', 'main', 'helper']);
});

test('the visible graph budget never emits dangling edges', () => {
  const many = [node('root', 'crate'), ...Array.from({ length: 200 }, (_, i) => node(String(i), 'file', 'root'))];
  const links = many.slice(1).map(n => edge('root', n.id));
  const model = layeredGraph(many, links, context('architecture', ['root']));
  assert.equal(model.nodes.length, 160);
  assert.equal(model.clipped, true);
  const visible = new Set(ids(model));
  assert.ok(model.edges.every(e => visible.has(e.from) && visible.has(e.to)));
});

test('types start in their containing hierarchy rather than dumping every type', () => {
  const typed = [...nodes, node('Data', 'struct', 'file'), node('Other', 'struct', 'file')];
  const links = [...edges, edge('file', 'Data'), edge('file', 'Other')];
  assert.deepEqual(ids(layeredGraph(typed, links, context('types'))), ['crate']);
  assert.deepEqual(ids(layeredGraph(typed, links, context('types', ['crate', 'src', 'file']))), ['crate', 'src', 'file', 'Data', 'Other']);
});
