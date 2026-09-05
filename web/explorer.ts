import { $, state, entityKinds, labels, button, owner, type Node } from './model';
import { fileIcon } from './icons';
import { initializeTree, loadTree, renderTree } from './tree';

let select: (id: string) => void;
let limit = 150;

export function initializeExplorer(onSelect: (id: string) => void): void {
  select = onSelect;
  initializeTree(onSelect);
  for (const panel of ['files', 'symbols']) $(`${panel}-tab`).onclick = () => {
    for (const name of ['files', 'symbols']) {
      $(`${name}-panel`).hidden = name !== panel;
      $(`${name}-tab`).setAttribute('aria-selected', String(name === panel));
    }
  };
  for (const id of ['search', 'entries', 'crate-filter']) $(id).addEventListener('input', () => { limit = 150; renderExplorer(); });
  $('more-symbols').onclick = () => { limit += 150; renderExplorer(); };
}

export function fillCrates(): void {
  loadTree();
  const options = $('crate-filter');
  options.replaceChildren(new Option('Todo o repositório', ''));
  for (const node of state.nodes.filter(n => n.kind === 'crate')) options.append(new Option(node.name, node.id));
}

export function renderExplorer(): void {
  renderTree();
  const query = ($('search') as HTMLInputElement).value.toLowerCase();
  const entries = ($('entries') as HTMLInputElement).checked;
  const crate = ($('crate-filter') as HTMLSelectElement).value;
  const nodes = state.nodes.filter(n => entityKinds.has(n.kind)
    && (!entries || n.entryPoint) && (!crate || belongsTo(n, crate))
    && `${n.name} ${n.qualifiedName} ${n.file}`.toLowerCase().includes(query));
  nodes.sort((a, b) => Number(b.entryPoint) - Number(a.entryPoint) || a.name.localeCompare(b.name));
  const list = $('symbol-list'); list.replaceChildren();
  for (const node of nodes.slice(0, limit)) list.append(symbolRow(node));
  if (!nodes.length) {
    const empty = document.createElement('p'); empty.className = 'empty-search'; empty.textContent = 'Nenhum símbolo encontrado.'; list.append(empty);
  }
  $('symbol-count').textContent = String(nodes.length);
  $('more-symbols').hidden = nodes.length <= limit;
}

function belongsTo(node: Node, crate: string): boolean {
  const seen = new Set<string>();
  let cursor: Node | undefined = node;
  while (cursor && !seen.has(cursor.id)) {
    if (cursor.id === crate) return true;
    seen.add(cursor.id); cursor = state.byId.get(cursor.parent);
  }
  return false;
}

function symbolRow(node: Node): HTMLButtonElement {
  const row = button('', () => select(node.id), `Abrir ${node.name}`);
  row.className = `symbol-row${state.selected === node.id ? ' selected' : ''}`;
  const icon = fileIcon(node);
  const content = document.createElement('span'); content.className = 'symbol-text';
  const name = document.createElement('strong'); name.textContent = node.name;
  const path = document.createElement('small'); path.textContent = node.file;
  content.append(name, path); row.append(icon, content); row.title = node.qualifiedName;
  return row;
}

export function renderInspector(): void {
  const node = state.byId.get(state.selected);
  $('inspector-empty').hidden = Boolean(node); $('inspector-content').hidden = !node;
  if (!node) return;
  $('detail-kind').textContent = `${labels[node.kind] || node.kind}${node.isAsync ? ' · async' : ''}${node.entryPoint ? ' · entrada candidata' : ''}`;
  $('detail-name').textContent = node.name;
  $('detail-file').textContent = `${node.file}:${node.line || 1}`;
  $('detail-docs').textContent = node.documentation;
  $('detail-note').textContent = node.detail;
  const fn = owner(node);
  for (const id of ['show-flow', 'show-calls', 'start-flow']) ($ (id) as HTMLButtonElement).disabled = !fn;
  $('follow-call').hidden = !node.targetId;
  $('follow-call').onclick = () => select(node.targetId);
  renderSource(node, fn);
  const connections = $('connections'); connections.replaceChildren();
  for (const edge of state.edges.filter(e => (e.kind !== 'contains' || ['file', 'folder', 'crate', 'module'].includes(node.kind)) && (e.from === node.id || e.to === node.id)).slice(0, 30)) {
    const target = state.byId.get(edge.from === node.id ? edge.to : edge.from);
    if (target) connections.append(button(`${edge.from === node.id ? '→' : '←'} ${target.name} · ${edge.label || edge.kind}`, () => select(target.id)));
  }
  if (!connections.childElementCount) connections.textContent = 'Nenhuma conexão resolvida nesta seleção.';
}

function renderSource(node: Node, fn?: Node): void {
  const source = fn || node;
  const block = $('source'); block.replaceChildren();
  source.source.split('\n').slice(0, 700).forEach((text, i) => {
    const line = document.createElement('span'); line.className = 'source-line';
    const number = source.line + i;
    if (node.id !== source.id && number >= node.line && number <= node.endLine) line.style.background = '#e9b5861a';
    const gutter = document.createElement('span'); gutter.className = 'line-number'; gutter.textContent = String(number);
    line.append(gutter, document.createTextNode(text)); block.append(line);
  });
  if (!source.source) block.textContent = 'Selecione uma declaração para ver o código-fonte.';
}
