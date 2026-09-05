import { visualizer } from './gen/graph.js';

export type Node = visualizer.Node;
export type Edge = visualizer.Edge;
export type View = 'architecture' | 'calls' | 'types' | 'flow';
export const entityKinds = new Set(['crate', 'module', 'function', 'struct', 'enum', 'trait']);
export const labels: Record<string, string> = {
  crate: 'crate', module: 'módulo', function: 'função', struct: 'struct', enum: 'enum',
  trait: 'trait', entry: 'entrada', exit: 'saída', branch: 'decisão', match: 'match',
  call: 'chamada', await: 'async', try: 'erro · ?', loop: 'laço', return: 'retorno',
  deferred: 'adiado', statement: 'instrução', expression: 'expressão', merge: 'junção',
  break: 'break', continue: 'continue', macro: 'macro',
};

export const state = {
  graph: new visualizer.Graph(), nodes: [] as Node[], edges: [] as Edge[],
  byId: new Map<string, Node>(), session: new visualizer.Session(),
  view: 'architecture' as View, selected: '', focus: '', scope: '', depth: 1,
  highlights: new Set<string>(), offline: Boolean(document.getElementById('graph-data')),
};

export function $(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing UI contract: ${id}`);
  return element;
}

export function button(text: string, action: () => void, label?: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = text;
  if (label) element.setAttribute('aria-label', label);
  element.addEventListener('click', action);
  return element;
}

export function owner(node?: Node): Node | undefined {
  if (!node) return undefined;
  return node.kind === 'function' ? node : state.byId.get(node.parent)?.kind === 'function' ? state.byId.get(node.parent) : undefined;
}

export function setGraph(graph: visualizer.Graph): void {
  state.graph = graph;
  state.nodes = graph.nodes.map(n => new visualizer.Node(n));
  state.edges = graph.edges.map(e => new visualizer.Edge(e));
  state.byId = new Map(state.nodes.map(n => [n.id, n]));
}

export function graphModel(): { nodes: Node[]; edges: Edge[]; clipped: boolean } {
  let nodes: Node[];
  if (state.view === 'flow') nodes = state.nodes.filter(n => n.parent === state.focus);
  else if (state.view === 'types') nodes = state.nodes.filter(n => ['struct', 'enum', 'trait'].includes(n.kind));
  else if (state.view === 'calls') nodes = callNeighborhood();
  else nodes = architecture();
  const highlighted = state.nodes.filter(n => state.highlights.has(n.id));
  if (state.view !== 'flow') nodes = [...new Map([...nodes, ...highlighted].map(n => [n.id, n])).values()];
  const clipped = nodes.length > 160;
  nodes = nodes.slice(0, 160);
  const ids = new Set(nodes.map(n => n.id));
  const kinds = state.view === 'flow' ? ['flow'] : state.view === 'calls' ? ['calls'] : state.view === 'types' ? ['implements', 'uses'] : ['contains', 'depends'];
  const edges = state.edges.filter(e => ids.has(e.from) && ids.has(e.to) && kinds.includes(e.kind));
  return { nodes, edges, clipped };
}

function architecture(): Node[] {
  if (state.scope) return state.nodes.filter(n => n.parent === state.scope && entityKinds.has(n.kind));
  const crates = state.nodes.filter(n => n.kind === 'crate');
  if (crates.length) return crates;
  return state.nodes.filter(n => entityKinds.has(n.kind) && !n.parent);
}

function callNeighborhood(): Node[] {
  const focus = owner(state.byId.get(state.selected))?.id || state.focus;
  let ids = new Set(focus ? [focus] : state.nodes.filter(n => n.kind === 'function' && n.entryPoint).map(n => n.id));
  if (!ids.size) ids = new Set(state.nodes.filter(n => n.kind === 'function').slice(0, 30).map(n => n.id));
  for (let i = 0; i < state.depth; i++) {
    const next = new Set(ids);
    for (const edge of state.edges) {
      if (edge.kind === 'calls' && (ids.has(edge.from) || ids.has(edge.to))) { next.add(edge.from); next.add(edge.to); }
    }
    ids = next;
  }
  return state.nodes.filter(n => ids.has(n.id));
}
