import { visualizer } from './gen/graph.js';
import { layeredGraph } from './progressive';

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
  folder: 'pasta', file: 'arquivo',
};

export const state = {
  graph: new visualizer.Graph(), nodes: [] as Node[], edges: [] as Edge[],
  byId: new Map<string, Node>(), session: new visualizer.Session(),
  view: 'architecture' as View, selected: '', focus: '', scope: '',
  highlights: new Set<string>(), offline: Boolean(document.getElementById('graph-data')),
  layers: new Map<string, { expanded: Set<string>; revealed: Set<string> }>(),
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
  state.layers.clear();
}

export function contextKey(): string {
  return `${state.view}:${state.view === 'flow' || state.view === 'calls' ? state.focus : state.scope}`;
}

export function currentLayer(): { expanded: Set<string>; revealed: Set<string> } {
  const key = contextKey();
  if (!state.layers.has(key)) state.layers.set(key, { expanded: new Set(), revealed: new Set() });
  return state.layers.get(key)!;
}

export function graphModel(): { nodes: Node[]; edges: Edge[]; clipped: boolean } {
  const layer = currentLayer();
  return layeredGraph(state.nodes, state.edges, { ...state, ...layer,
    revealed: new Set([...layer.revealed, ...state.highlights]) });
}
