import type { Node, Edge, View } from './model';

export interface LayerContext {
  view: View;
  focus: string;
  scope: string;
  expanded: Set<string>;
  revealed: Set<string>;
}

const containers = new Set(['crate', 'folder', 'file', 'module']);
const types = new Set(['struct', 'enum', 'trait']);

export function neighbors(id: string, nodes: Node[], edges: Edge[], view: View): string[] {
  const kinds = view === 'flow' ? ['flow'] : view === 'calls' ? ['calls']
    : view === 'types' ? ['contains', 'implements', 'uses'] : ['contains'];
  const adjacent = new Set<string>();
  for (const e of edges) {
    if (!kinds.includes(e.kind)) continue;
    if (e.from === id) adjacent.add(e.to);
    if (e.to === id && (view === 'calls' || e.kind === 'implements' || e.kind === 'uses')) adjacent.add(e.from);
  }
  return nodes.filter(n => adjacent.has(n.id) && (view !== 'types' || containers.has(n.kind) || types.has(n.kind))).map(n => n.id);
}

function roots(nodes: Node[], context: LayerContext): string[] {
  if (context.view === 'flow') return nodes.filter(n => n.parent === context.focus && n.kind === 'entry').map(n => n.id);
  if (context.view === 'calls') {
    const root = context.focus || nodes.find(n => n.kind === 'function' && n.entryPoint)?.id
      || nodes.find(n => n.kind === 'function')?.id;
    return root ? [root] : [];
  }
  if (context.scope) return [context.scope];
  return nodes.filter(n => !n.parent).map(n => n.id);
}

export function layeredGraph(nodes: Node[], edges: Edge[], context: LayerContext): { nodes: Node[]; edges: Edge[]; clipped: boolean } {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const queue = [...roots(nodes, context), ...context.revealed];
  const visible = new Map<string, Node>();
  let clipped = false;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    if (visible.has(id) || !byId.has(id)) continue;
    if (visible.size >= 160) { clipped = true; break; }
    visible.set(id, byId.get(id)!);
    if (context.expanded.has(id)) queue.push(...neighbors(id, nodes, edges, context.view));
  }
  const kinds = context.view === 'flow' ? ['flow'] : context.view === 'calls' ? ['calls']
    : context.view === 'types' ? ['contains', 'implements', 'uses'] : ['contains', 'depends'];
  return { nodes: [...visible.values()], clipped,
    edges: edges.filter(e => visible.has(e.from) && visible.has(e.to) && kinds.includes(e.kind)) };
}
