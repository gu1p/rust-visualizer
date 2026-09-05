import dagre from '@dagrejs/dagre';
import { $, state, graphModel, labels, currentLayer, contextKey, type Node, type Edge } from './model';
import { neighbors } from './progressive';
import { fileIcon } from './icons';

const NS = 'http://www.w3.org/2000/svg';
type Point = { x: number; y: number };
const WIDTH = 214, HEIGHT = 112;
let camera = { x: 30, y: 20, zoom: 1 };
let bounds = { left: 0, top: 0, width: 800, height: 500 };
let selectNode: (id: string) => void;
let positions = new Map<string, Point>();
const layouts = new Map<string, Map<string, Point>>();
let renderedContext = '';
let edges: Edge[] = [];
const manualCameras = new Set<string>();
const cameras = new Map<string, typeof camera>();

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>): SVGElementTagNameMap[K] {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

export function initializeGraph(select: (id: string) => void): void {
  selectNode = select;
  $('fit').onclick = () => { manualCameras.add(contextKey()); fit(); };
  $('zoom-in').onclick = () => zoom(1.2);
  $('zoom-out').onclick = () => zoom(1 / 1.2);
  $('expand').onclick = () => {
    for (const node of graphModel().nodes) currentLayer().expanded.add(node.id);
    renderGraph();
  };
  initializeCamera();
}

export function renderGraph(): void {
  const model = graphModel(); edges = model.edges;
  const context = contextKey();
  const changed = renderedContext !== context;
  if (changed && renderedContext) cameras.set(renderedContext, { ...camera });
  const saved = layouts.get(context) || new Map<string, Point>(); layouts.set(context, saved);
  positions = new Map(model.nodes.filter(n => saved.has(n.id)).map(n => [n.id, saved.get(n.id)!]));
  const layout = new dagre.graphlib.Graph({ multigraph: true });
  layout.setGraph({ rankdir: state.view === 'flow' ? 'TB' : 'LR', nodesep: 40, ranksep: 80 });
  layout.setDefaultEdgeLabel(() => ({}));
  for (const node of model.nodes) layout.setNode(node.id, { width: WIDTH, height: HEIGHT });
  edges.forEach((edge, i) => layout.setEdge(edge.from, edge.to, {}, String(i)));
  dagre.layout(layout);
  for (const node of model.nodes) {
    if (positions.has(node.id)) continue;
    const anchor = edges.find(e => e.to === node.id && positions.has(e.from));
    const parent = anchor && positions.get(anchor.from);
    const position = parent ? { x: parent.x + (state.view === 'flow' ? 0 : 300), y: parent.y + (state.view === 'flow' ? 175 : 0) }
      : { x: layout.node(node.id).x, y: layout.node(node.id).y };
    while ([...positions.values()].some(p => Math.abs(p.x - position.x) < WIDTH + 25 && Math.abs(p.y - position.y) < HEIGHT + 25)) position.y += HEIGHT + 45;
    positions.set(node.id, position); saved.set(node.id, position);
  }
  $('nodes').replaceChildren();
  for (const node of model.nodes) $('nodes').append(nodeCard(node));
  renderEdges(); measureBounds();
  $('graph-count').textContent = model.nodes.length + ' nós · ' + edges.length + ' conexões' + (model.clipped ? ' · limite de 160; selecione um arquivo' : '');
  $('graph-empty').hidden = model.nodes.length > 0;
  $('graph-empty').querySelector('p')!.textContent = state.view === 'flow' ? 'Selecione uma função para explorar seu fluxo.' : 'Nenhum nó nesta visualização. Escolha outro escopo ou símbolo.';
  renderedContext = context;
  if (changed && cameras.has(context)) { camera = { ...cameras.get(context)! }; transform(); }
  else if (!manualCameras.has(context)) automaticCamera();
  else transform();
}

function nodeCard(node: Node): HTMLElement {
  const wrapper = document.createElement('div'); wrapper.className = 'node-wrap';
  place(wrapper, positions.get(node.id)!);
  const card = document.createElement('button'); card.className = 'graph-node';
  card.dataset.kind = node.kind; card.dataset.nodeId = node.id;
  card.setAttribute('aria-label', 'Selecionar ' + node.name);
  card.classList.toggle('selected', node.id === state.selected);
  card.classList.toggle('highlighted', state.highlights.has(node.id));
  card.classList.toggle('dimmed', state.highlights.size > 0 && !state.highlights.has(node.id));
  const band = document.createElement('span'); band.className = 'node-band';
  const kind = document.createElement('span'); kind.textContent = (labels[node.kind] || node.kind) + (node.entryPoint ? ' ↗' : '');
  band.append(fileIcon(node), kind);
  const name = document.createElement('strong'); name.textContent = node.name;
  const location = document.createElement('small'); location.textContent = node.file ? node.file + (node.line ? ':' + node.line : '') : 'repositório';
  card.append(band, name, location); card.title = node.name + ' · arraste para organizar · Shift + setas para mover';
  wrapper.append(card); initializeNodeDrag(card, wrapper, node.id);
  const adjacent = neighbors(node.id, state.nodes, state.edges, state.view);
  if (adjacent.length) {
    const open = currentLayer().expanded.has(node.id);
    const expand = document.createElement('button'); expand.className = 'node-expand';
    expand.setAttribute('aria-label', (open ? 'Recolher ' : 'Expandir ') + node.name);
    expand.setAttribute('aria-expanded', String(open));
    expand.textContent = open ? '− Recolher' : '+ ' + adjacent.length + (state.view === 'flow' ? ' passos' : ' conexões');
    expand.onclick = () => {
      if (open) currentLayer().expanded.delete(node.id); else currentLayer().expanded.add(node.id);
      renderGraph();
      const replacement = [...$('nodes').querySelectorAll<HTMLButtonElement>('.node-expand')].find(b => b.getAttribute('aria-label') === (open ? 'Expandir ' : 'Recolher ') + node.name);
      replacement?.focus({ preventScroll: true });
    };
    wrapper.append(expand);
  }
  return wrapper;
}

function place(wrapper: HTMLElement, position: Point): void {
  wrapper.style.left = position.x - WIDTH / 2 + 'px'; wrapper.style.top = position.y - HEIGHT / 2 + 'px';
}

function moveNode(id: string, wrapper: HTMLElement, position: Point): void {
  manualCameras.add(contextKey());
  positions.set(id, position); layouts.get(contextKey())!.set(id, position);
  place(wrapper, position); renderEdges(); measureBounds();
}

function initializeNodeDrag(card: HTMLButtonElement, wrapper: HTMLElement, id: string): void {
  let drag: { x: number; y: number; origin: Point; moved: boolean } | undefined;
  let suppressClick = false;
  card.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.stopPropagation(); suppressClick = false;
    drag = { x: event.clientX, y: event.clientY, origin: { ...positions.get(id)! }, moved: false };
    card.setPointerCapture(event.pointerId);
  });
  card.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true; suppressClick = true; card.classList.add('dragging');
    moveNode(id, wrapper, { x: drag.origin.x + dx / camera.zoom, y: drag.origin.y + dy / camera.zoom });
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) card.addEventListener(event, () => {
    drag = undefined; card.classList.remove('dragging');
  });
  card.onclick = event => { if (suppressClick) { suppressClick = false; event.preventDefault(); } else selectNode(id); };
  card.addEventListener('keydown', event => {
    if (!event.shiftKey || !event.key.startsWith('Arrow')) return;
    const steps: Record<string, Point> = { ArrowLeft: { x: -20, y: 0 }, ArrowRight: { x: 20, y: 0 }, ArrowUp: { x: 0, y: -20 }, ArrowDown: { x: 0, y: 20 } };
    const step = steps[event.key]; if (!step) return;
    event.preventDefault(); event.stopPropagation(); const position = positions.get(id)!;
    moveNode(id, wrapper, { x: position.x + step.x, y: position.y + step.y });
  });
}

function renderEdges(): void {
  const canvas = $('edges'); canvas.replaceChildren();
  const defs = svg('defs', {});
  const marker = svg('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
  marker.append(svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#8293ad' })); defs.append(marker); canvas.append(defs);
  for (const edge of edges) {
    const from = positions.get(edge.from)!, to = positions.get(edge.to)!;
    const vertical = state.view === 'flow';
    const start = { x: from.x + (vertical ? 0 : WIDTH / 2), y: from.y + (vertical ? HEIGHT / 2 : 0) };
    const end = { x: to.x - (vertical ? 0 : WIDTH / 2), y: to.y - (vertical ? HEIGHT / 2 : 0) };
    const bend = Math.max(50, Math.abs(vertical ? end.y - start.y : end.x - start.x) / 2);
    const d = vertical ? 'M' + start.x + ',' + start.y + ' C' + start.x + ',' + (start.y + bend) + ' ' + end.x + ',' + (end.y - bend) + ' ' + end.x + ',' + end.y
      : 'M' + start.x + ',' + start.y + ' C' + (start.x + bend) + ',' + start.y + ' ' + (end.x - bend) + ',' + end.y + ' ' + end.x + ',' + end.y;
    canvas.append(svg('path', { d, class: 'graph-edge' + (/Err|None|não|falso/.test(edge.label || '') ? ' error-edge' : ''), 'marker-end': 'url(#arrow)' }));
    if (edge.label) {
      const label = svg('text', { x: String((start.x + end.x) / 2 + (vertical ? 12 : 0)), y: String((start.y + end.y) / 2 - 6), class: 'edge-label', 'text-anchor': 'middle' });
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
  const position = positions.get(id); if (!position) return;
  camera.zoom = Math.max(camera.zoom, .8);
  camera.x = $('graph').clientWidth / 2 - position.x * camera.zoom;
  camera.y = $('graph').clientHeight / 2 - position.y * camera.zoom;
  transform();
}

function measureBounds(): void {
  const points = [...positions.values()]; if (!points.length) return;
  bounds.left = Math.min(...points.map(p => p.x)) - WIDTH / 2;
  bounds.top = Math.min(...points.map(p => p.y)) - HEIGHT / 2;
  bounds.width = Math.max(...points.map(p => p.x)) + WIDTH / 2 - bounds.left;
  bounds.height = Math.max(...points.map(p => p.y)) + HEIGHT / 2 - bounds.top;
}

export function fit(): void {
  const box = $('graph');
  camera.zoom = Math.max(.12, Math.min(1, (box.clientWidth - 40) / bounds.width, (box.clientHeight - 35) / bounds.height));
  camera.x = (box.clientWidth - bounds.width * camera.zoom) / 2 - bounds.left * camera.zoom;
  camera.y = Math.max(15, (box.clientHeight - bounds.height * camera.zoom) / 2) - bounds.top * camera.zoom;
  transform();
}

function automaticCamera(): void {
  fit();
  if (camera.zoom >= .7) return;
  camera.zoom = .7;
  camera.x = 25 - bounds.left * camera.zoom;
  camera.y = 25 - bounds.top * camera.zoom;
  transform();
}

function zoom(factor: number, x = $('graph').clientWidth / 2, y = $('graph').clientHeight / 2): void {
  manualCameras.add(contextKey());
  const previous = camera.zoom; camera.zoom = Math.max(.12, Math.min(2.5, camera.zoom * factor));
  camera.x = x - (x - camera.x) * camera.zoom / previous; camera.y = y - (y - camera.y) * camera.zoom / previous;
  transform();
}

function transform(): void { $('scene').style.transform = 'translate(' + camera.x + 'px,' + camera.y + 'px) scale(' + camera.zoom + ')'; }

function initializeCamera(): void {
  let drag: Point | undefined;
  const graph = $('graph');
  graph.addEventListener('wheel', event => {
    event.preventDefault(); const box = graph.getBoundingClientRect();
    zoom(Math.exp(-event.deltaY * .0015), event.clientX - box.left, event.clientY - box.top);
  }, { passive: false });
  graph.addEventListener('pointerdown', event => {
    if (event.button !== 0 || (event.target as Element).closest('button')) return;
    drag = { x: event.clientX, y: event.clientY }; graph.setPointerCapture(event.pointerId);
  });
  graph.addEventListener('pointermove', event => {
    if (!drag) return;
    manualCameras.add(contextKey());
    camera.x += event.clientX - drag.x; camera.y += event.clientY - drag.y;
    drag = { x: event.clientX, y: event.clientY }; transform();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) graph.addEventListener(event, () => { drag = undefined; });
  graph.addEventListener('keydown', event => {
    if (event.target !== graph) return;
    const moves: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (moves[event.key]) { event.preventDefault(); manualCameras.add(contextKey()); camera.x += moves[event.key][0]; camera.y += moves[event.key][1]; transform(); }
    if (event.key === '+' || event.key === '=') zoom(1.2);
    if (event.key === '-') zoom(1 / 1.2);
    if (event.key === '0') fit();
  });
}
