import { $, button, state, owner, type View } from './model';
import { visualizer } from './gen/graph.js';
import { focusNode, updateSelection } from './graph';

let steps: visualizer.TourStep[] = [];
let index = 0;
let mode: 'ai' | 'flow' = 'ai';
let select: (id: string, view?: View) => void;

export function initializeTour(onSelect: typeof select): void {
  select = onSelect;
  $('next-step').onclick = next;
  $('previous-step').onclick = () => { if (index > 0) { index--; if (mode === 'flow') steps = steps.slice(0, index + 1); show(); } };
  $('stop-tour').onclick = stopTour;
  $('start-flow').onclick = startFlow;
}

export function startTour(answer: visualizer.ChatResponse): void {
  mode = 'ai'; index = 0;
  steps = answer.steps.map(s => new visualizer.TourStep(s)).filter(s => state.byId.has(s.nodeId));
  state.highlights = new Set(answer.highlights.filter(id => state.byId.has(id)));
  if (!steps.length) steps = [...state.highlights].map(nodeId => new visualizer.TourStep({ nodeId, explanation: answer.answer }));
  if (!steps.length) return;
  $('ai-dialog').dispatchEvent(new Event('tour-start'));
  show();
}

function startFlow(): void {
  const fn = owner(state.byId.get(state.selected));
  const entry = state.nodes.find(n => n.parent === fn?.id && n.kind === 'entry');
  if (!entry) return;
  mode = 'flow'; index = 0; state.highlights.clear();
  steps = [new visualizer.TourStep({ nodeId: entry.id, explanation: `Entrada em ${fn!.name}. Escolha as condições para seguir um caminho possível.` })];
  show();
}

function show(): void {
  const step = steps[index]; if (!step) return;
  const node = state.byId.get(step.nodeId); if (!node) return;
  const isFlow = !['function', 'crate', 'struct', 'enum', 'trait', 'module'].includes(node.kind);
  select(node.id, isFlow ? 'flow' : node.kind === 'function' ? 'calls' : 'architecture');
  $('tour').hidden = false;
  $('tour-label').textContent = mode === 'ai' ? 'PERCURSO DA IA · CONFIRA NO CÓDIGO' : 'CAMINHO POSSÍVEL · ESCOLHA AS CONDIÇÕES';
  $('tour-text').textContent = step.explanation;
  $('tour-position').textContent = mode === 'ai' ? `${index + 1} / ${steps.length}` : `Passo ${index + 1}`;
  ($('previous-step') as HTMLButtonElement).disabled = index === 0;
  const outgoing = state.edges.filter(e => e.kind === 'flow' && e.from === node.id);
  ($('next-step') as HTMLButtonElement).disabled = mode === 'ai' ? index >= steps.length - 1 : outgoing.length === 0;
  $('tour-choices').replaceChildren();
  if (mode === 'flow' && outgoing.length > 1) {
    for (const edge of outgoing) $('tour-choices').append(button(edge.label || 'Seguir', () => follow(edge.to, edge.label), `Seguir: ${edge.label || 'próximo'}`));
  }
  updateSelection(); focusNode(node.id);
}

function next(): void {
  if (mode === 'ai') { if (index < steps.length - 1) { index++; show(); } return; }
  const outgoing = state.edges.filter(e => e.kind === 'flow' && e.from === steps[index]?.nodeId);
  if (outgoing.length === 1) follow(outgoing[0].to, outgoing[0].label);
  else ($('tour-choices').querySelector('button') as HTMLButtonElement | null)?.focus();
}

function follow(nodeId: string, label: string): void {
  const node = state.byId.get(nodeId); if (!node || steps.length >= 500) return;
  steps = steps.slice(0, index + 1);
  steps.push(new visualizer.TourStep({ nodeId, explanation: `${label ? `${label} → ` : ''}${node.name}` }));
  index++; show();
}

export function stopTour(): void {
  steps = []; index = 0; state.highlights.clear(); $('tour').hidden = true;
  updateSelection(); window.speechSynthesis?.cancel();
}
