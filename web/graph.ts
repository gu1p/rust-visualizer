import dagre from '@dagrejs/dagre';
import { $, state, graphModel, labels, type Node } from './model';

const NS = 'http://www.w3.org/2000/svg';
let camera = { x: 30, y: 20, zoom: 1 };
let extent = { width: 800, height: 500 };
let selectNode: (id: string) => void;
let positions = new Map<string, { x: number; y: number }>();

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>): SVGElementTagNameMap[K] {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

export function initializeGraph(select: (id: string) => void): void {
  selectNode = select;
  $('fit').onclick = fit;
  $('zoom-in').onclick = () => zoom(1.2);
  $('zoom-out').onclick = () => zoom(1 / 1.2);
  initializeCamera();
  new ResizeObserver(() => initialCamera()).observe($('graph'));
}

export function renderGraph(): void {
  const model = graphModel();
  const layout = new dagre.graphlib.Graph({ multigraph: true });
  layout.setGraph({ rankdir: state.view === 'flow' ? 'TB' : 'LR', nodesep: 40, ranksep: 70, marginx: 35, marginy: 35 });
  layout.setDefaultEdgeLabel(() => ({}));
  for (const node of model.nodes) layout.setNode(node.id, { width: 214, height: 88 });
  model.edges.forEach((edge, i) => layout.setEdge(edge.from, edge.to, { label: edge.label, width: Math.min(edge.label.length * 6, 160), height: 17 }, `${i}`));
  dagre.layout(layout);
  positions = new Map();
  $('nodes').replaceChildren();
  for (const node of model.nodes) {
    const position = layout.node(node.id);
    positions.set(node.id, position);
    const card = nodeCard(node);
    card.style.left = `${position.x - 107}px`;
    card.style.top = `${position.y - 44}px`;
    $('nodes').append(card);
  }
  renderEdges(layout);
  extent = { width: layout.graph().width || 400, height: layout.graph().height || 300 };
  $('graph-count').textContent = `${model.nodes.length} nós · ${model.edges.length} conexões${model.clipped ? ' · refine a seleção para ver mais' : ''}`;
  $('graph-empty').hidden = model.nodes.length > 0;
  const empty = $('graph-empty').querySelector('p')!;
  empty.textContent = state.view === 'flow' ? 'Selecione uma função para explorar seu fluxo.' : 'Nenhum nó nesta visualização. Escolha outro escopo ou símbolo.';
  initialCamera();
}

function initialCamera(): void {
  fit();
  if (state.view !== 'flow' || camera.zoom >= .7) return;
  const entry = state.nodes.find(n => n.parent === state.focus && n.kind === 'entry');
  const position = entry && positions.get(entry.id);
  if (!position) return;
  camera.zoom = .8;
  camera.x = $('graph').clientWidth / 2 - position.x * camera.zoom;
  camera.y = 22 - (position.y - 44) * camera.zoom;
  transform();
}

function nodeCard(node: Node): HTMLButtonElement {
  const card = document.createElement('button');
  card.className = 'graph-node';
  card.dataset.kind = node.kind;
  card.dataset.nodeId = node.id;
  card.setAttribute('aria-label', `Selecionar ${node.name}`);
  card.classList.toggle('selected', node.id === state.selected);
  card.classList.toggle('highlighted', state.highlights.has(node.id));
  card.classList.toggle('dimmed', state.highlights.size > 0 && !state.highlights.has(node.id));
  const band = document.createElement('span'); band.className = 'node-band';
  band.textContent = `${labels[node.kind] || node.kind}${node.entryPoint ? ' ↗' : ''}`;
  const name = document.createElement('strong'); name.textContent = node.name;
  const location = document.createElement('small'); location.textContent = node.file ? `${node.file}:${node.line || 1}` : 'repositório';
  card.append(band, name, location);
  card.title = node.name;
  card.onclick = () => selectNode(node.id);
  return card;
}

function renderEdges(layout: dagre.graphlib.Graph): void {
  const canvas = $('edges');
  canvas.replaceChildren();
  const defs = svg('defs', {});
  const marker = svg('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
  marker.append(svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#8293ad' }));
  defs.append(marker); canvas.append(defs);
  for (const name of layout.edges()) {
    const edge = layout.edge(name);
    const points = edge.points as { x: number; y: number }[];
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
    const error = /Err|None|não|falso/.test(edge.label || '');
    canvas.append(svg('path', { d, class: `graph-edge${error ? ' error-edge' : ''}`, 'marker-end': 'url(#arrow)' }));
    if (edge.label && edge.x !== undefined) {
      const label = svg('text', { x: String(edge.x), y: String(edge.y), class: 'edge-label', 'text-anchor': 'middle' });
      label.textContent = edge.label; canvas.append(label);
    }
  }
}

export function updateSelection(): void {
  for (const card of document.querySelectorAll<HTMLElement>('.graph-node')) {
    const id = card.dataset.nodeId || '';
    card.classList.toggle('selected', id === state.selected);
    card.classList.toggle('highlighted', state.highlights.has(id));
    card.classList.toggle('dimmed', state.highlights.size > 0 && !state.highlights.has(id));
  }
}

export function focusNode(id: string): void {
  const position = positions.get(id);
  if (!position) return;
  camera.zoom = Math.max(camera.zoom, .8);
  camera.x = $('graph').clientWidth / 2 - position.x * camera.zoom;
  camera.y = $('graph').clientHeight / 2 - position.y * camera.zoom;
  transform();
}

export function fit(): void {
  const box = $('graph');
  camera.zoom = Math.max(.12, Math.min(1, (box.clientWidth - 30) / extent.width, (box.clientHeight - 25) / extent.height));
  camera.x = (box.clientWidth - extent.width * camera.zoom) / 2;
  camera.y = Math.max(10, (box.clientHeight - extent.height * camera.zoom) / 2);
  transform();
}

function zoom(factor: number, x = $('graph').clientWidth / 2, y = $('graph').clientHeight / 2): void {
  const previous = camera.zoom;
  camera.zoom = Math.max(.12, Math.min(2.5, camera.zoom * factor));
  camera.x = x - (x - camera.x) * camera.zoom / previous;
  camera.y = y - (y - camera.y) * camera.zoom / previous;
  transform();
}

function transform(): void { $('scene').style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})`; }

function initializeCamera(): void {
  let drag: { x: number; y: number } | undefined;
  const graph = $('graph');
  graph.addEventListener('wheel', event => {
    event.preventDefault(); const box = graph.getBoundingClientRect();
    zoom(Math.exp(-event.deltaY * .0015), event.clientX - box.left, event.clientY - box.top);
  }, { passive: false });
  graph.addEventListener('pointerdown', event => {
    if ((event.target as Element).closest('button')) return;
    drag = { x: event.clientX, y: event.clientY }; graph.setPointerCapture(event.pointerId);
  });
  graph.addEventListener('pointermove', event => {
    if (!drag) return;
    camera.x += event.clientX - drag.x; camera.y += event.clientY - drag.y;
    drag = { x: event.clientX, y: event.clientY }; transform();
  });
  for (const event of ['pointerup', 'pointercancel']) graph.addEventListener(event, () => { drag = undefined; });
  graph.addEventListener('keydown', event => {
    if (event.target !== graph) return;
    const moves: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (moves[event.key]) { event.preventDefault(); camera.x += moves[event.key][0]; camera.y += moves[event.key][1]; transform(); }
    if (event.key === '+' || event.key === '=') zoom(1.2);
    if (event.key === '-') zoom(1 / 1.2);
    if (event.key === '0') fit();
  });
}
