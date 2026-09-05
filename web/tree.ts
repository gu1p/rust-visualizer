import { $, state, type Node } from './model';
import { fileIcon } from './icons';

const kinds = new Set(['crate', 'folder', 'file']);
const expanded = new Set<string>();
let select: (id: string) => void;
let initialized = false;
let focused = '';
let entries: Node[] = [];
let children = new Map<string, Node[]>();

export function initializeTree(onSelect: typeof select): void {
  select = onSelect;
  $('tree-search').addEventListener('input', () => renderTree());
  $('collapse-tree').onclick = () => { expanded.clear(); renderTree(); };
}

export function loadTree(): void {
  entries = state.nodes.filter(n => kinds.has(n.kind));
  children = new Map(); expanded.clear(); focused = '';
  for (const node of entries) {
    const siblings = children.get(node.parent) || []; siblings.push(node); children.set(node.parent, siblings);
  }
  for (const siblings of children.values()) siblings.sort((a, b) => Number(a.kind === 'file') - Number(b.kind === 'file') || treeName(a).localeCompare(treeName(b)));
  for (const node of entries.filter(n => !n.parent)) expanded.add(node.id);
  initialized = true;
  renderTree();
}

export function renderTree(): void {
  if (!initialized) return;
  const query = ($('tree-search') as HTMLInputElement).value.trim().toLowerCase();
  const visible = new Set<string>();
  if (query) for (const node of entries.filter(n => `${treeName(n)} ${n.name} ${n.file}`.toLowerCase().includes(query))) {
    let cursor: Node | undefined = node;
    while (cursor && !visible.has(cursor.id)) { visible.add(cursor.id); cursor = state.byId.get(cursor.parent); }
  }
  const tree = $('file-tree'); tree.replaceChildren();
  for (const node of children.get('') || []) appendItem(tree, node, 1, query, visible);
  $('tree-empty').hidden = Boolean(tree.childElementCount);
  $('tree-empty').textContent = query ? 'Nenhum arquivo encontrado.' : 'Nenhum arquivo disponível nesta análise.';
  const items = [...tree.querySelectorAll<HTMLElement>('[role=treeitem]')];
  if (!items.some(item => item.dataset.id === focused)) focused = items[0]?.dataset.id || '';
  for (const item of items) item.tabIndex = item.dataset.id === focused ? 0 : -1;
}

function appendItem(parent: HTMLElement, node: Node, level: number, query: string, visible: Set<string>): void {
  if (query && !visible.has(node.id)) return;
  const item = document.createElement('li'); item.role = 'treeitem'; item.dataset.id = node.id;
  item.setAttribute('aria-label', treeName(node)); item.setAttribute('aria-level', String(level));
  item.setAttribute('aria-selected', String(state.selected === node.id));
  const descendants = children.get(node.id) || [];
  const open = query ? true : expanded.has(node.id);
  if (node.kind !== 'file') item.setAttribute('aria-expanded', String(open));
  const row = document.createElement('div'); row.className = 'tree-row'; row.style.paddingLeft = `${(level - 1) * 14 + 5}px`;
  const disclosure = document.createElement('span'); disclosure.className = 'tree-chevron'; disclosure.setAttribute('aria-hidden', 'true');
  disclosure.textContent = node.kind === 'file' ? '' : open ? '⌄' : '›';
  const name = document.createElement('span'); name.className = 'tree-name'; name.textContent = treeName(node);
  row.append(disclosure, fileIcon(node), name);
  if (node.kind === 'crate') { const badge = document.createElement('small'); badge.textContent = 'crate'; row.append(badge); }
  item.append(row); item.title = (node.file || state.graph.name) + (node.kind === 'crate' ? ` · crate ${node.name}` : '');
  item.addEventListener('focus', () => { focused = node.id; });
  item.addEventListener('click', event => {
    if ((event.target as Element).closest('[role=treeitem]') !== item) return;
    event.stopPropagation(); focused = node.id;
    if (node.kind !== 'file') toggle(node.id);
    else { select(node.id); renderTree(); }
    focusItem(node.id);
  });
  item.addEventListener('keydown', event => { if (event.target === item) navigate(event, node, open); });
  if (open && descendants.length) {
    const group = document.createElement('ul'); group.role = 'group';
    for (const child of descendants) appendItem(group, child, level + 1, query, visible);
    item.append(group);
  }
  parent.append(item);
}

function toggle(id: string): void {
  if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
  renderTree();
}

function treeName(node: Node): string {
  if (node.kind !== 'crate') return node.name;
  return node.parent ? node.file.split('/').at(-2) || node.name : state.graph.name;
}

function focusItem(id: string): void {
  const items = [...$('file-tree').querySelectorAll<HTMLElement>('[role=treeitem]')];
  for (const item of items) { item.tabIndex = item.dataset.id === id ? 0 : -1; if (!item.tabIndex) item.focus(); }
}

function navigate(event: KeyboardEvent, node: Node, open: boolean): void {
  const items = [...$('file-tree').querySelectorAll<HTMLElement>('[role=treeitem]')];
  const index = items.findIndex(item => item.dataset.id === node.id);
  let target = node.id;
  if (event.key === 'ArrowDown') target = items[Math.min(items.length - 1, index + 1)]?.dataset.id || target;
  else if (event.key === 'ArrowUp') target = items[Math.max(0, index - 1)]?.dataset.id || target;
  else if (event.key === 'Home') target = items[0]?.dataset.id || target;
  else if (event.key === 'End') target = items.at(-1)?.dataset.id || target;
  else if (event.key === 'ArrowRight' && node.kind !== 'file') {
    if (!open) toggle(node.id); else target = children.get(node.id)?.[0]?.id || target;
  } else if (event.key === 'ArrowLeft') {
    if (open && node.kind !== 'file') toggle(node.id); else target = node.parent || target;
  } else if (event.key === 'Enter' || event.key === ' ') {
    if (node.kind === 'file') select(node.id); else toggle(node.id);
  } else return;
  event.preventDefault(); event.stopPropagation(); focused = target; focusItem(target);
}
