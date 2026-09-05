import { $, state, owner, setGraph, type View } from './model';
import { visualizer } from './gen/graph.js';
import { initializeGraph, renderGraph, updateSelection } from './graph';
import { initializeExplorer, fillCrates, renderExplorer, renderInspector } from './explorer';
import { initializeChat, openChat, refreshChat } from './chat';
import { initializeTour, stopTour } from './tour';

function select(id: string, view?: View): void {
  const node = state.byId.get(id); if (!node) return;
  const priorFocus = state.focus;
  state.selected = id;
  const fn = owner(node);
  if (fn) state.focus = fn.id;
  if (node.kind === 'crate' || node.kind === 'module') { state.scope = node.id; state.view = 'architecture'; }
  if (view) state.view = view;
  if (!view && node.kind === 'function' && state.view === 'architecture') state.view = 'calls';
  renderInspector(); renderExplorer(); headings();
  if (view || priorFocus !== state.focus || ['crate', 'module'].includes(node.kind)) renderGraph();
  else updateSelection();
}

function changeView(view: View): void {
  state.view = view; state.depth = 1;
  if (view === 'flow' && !state.focus) {
    const entry = state.nodes.find(n => n.kind === 'function' && n.entryPoint);
    if (entry) { state.focus = entry.id; state.selected = entry.id; }
  }
  headings(); renderGraph(); renderInspector();
}

function headings(): void {
  for (const tab of document.querySelectorAll<HTMLButtonElement>('[data-view]')) tab.setAttribute('aria-selected', String(tab.dataset.view === state.view));
  const focus = state.byId.get(state.focus);
  const scope = state.byId.get(state.scope);
  const descriptions = {
    architecture: ['MAPA DO REPOSITÓRIO', scope?.name || 'Uma visão do todo.', 'Abra uma crate ou módulo para explorar suas partes.'],
    calls: ['RELAÇÕES ENTRE FUNÇÕES', focus?.name || 'De onde tudo começa.', 'Chamadas identificadas por caminhos lexicais. Abra o fluxo para ver chamadas não resolvidas.'],
    types: ['ESTRUTURAS E CONTRATOS', 'A forma dos dados.', 'Tipos, implementações de traits e referências em campos.'],
    flow: ['COMPORTAMENTO DA FUNÇÃO', focus?.name || 'Siga o programa.', 'Decisões, chamadas, laços e saídas. Escolha um nó para ver a fonte.'],
  }[state.view];
  $('view-eyebrow').textContent = descriptions[0]; $('graph-title').textContent = descriptions[1]; $('graph-subtitle').textContent = descriptions[2];
  $('expand').hidden = state.view !== 'calls';
}

async function load(): Promise<void> {
  $('load-status').hidden = false; $('load-error').hidden = true;
  try {
    let bytes: Uint8Array;
    if (state.offline) {
      const encoded = $('graph-data').textContent?.trim() || '';
      bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    } else {
      const response = await fetch('/api/graph');
      if (!response.ok) throw new Error('graph unavailable');
      bytes = new Uint8Array(await response.arrayBuffer());
      const session = await fetch('/api/session');
      if (session.ok) state.session = visualizer.Session.decode(new Uint8Array(await session.arrayBuffer()));
    }
    setGraph(visualizer.Graph.decode(bytes));
    $('repo-name').textContent = state.graph.name;
    $('file-count').textContent = `${state.graph.fileCount} arquivos Rust`;
    $('diagnostics').replaceChildren();
    for (const diagnostic of state.graph.diagnostics.slice(0, 30)) {
      const item = document.createElement('li'); item.textContent = diagnostic; $('diagnostics').append(item);
    }
    fillCrates(); renderExplorer(); headings(); renderGraph(); refreshChat();
    $('load-status').hidden = true;
  } catch {
    $('load-status').hidden = true; $('load-error').hidden = false;
  }
}

initializeGraph(select); initializeExplorer(select); initializeChat(); initializeTour(select);
for (const tab of document.querySelectorAll<HTMLButtonElement>('[data-view]')) tab.onclick = () => changeView(tab.dataset.view as View);
$('show-flow').onclick = () => changeView('flow'); $('show-calls').onclick = () => changeView('calls');
$('expand').onclick = () => { state.depth = Math.min(state.depth + 1, 8); renderGraph(); };
$('retry').onclick = () => void load();
$('home').onclick = () => { stopTour(); state.scope = ''; state.selected = ''; state.focus = ''; changeView('architecture'); renderExplorer(); };
document.querySelector('.brand')?.addEventListener('click', event => { event.preventDefault(); $('home').click(); });
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openChat(); }
  const editing = (event.target as HTMLElement).matches('input,textarea,select');
  if (event.key === '/' && !editing && !($('ai-dialog') as HTMLDialogElement).open) { event.preventDefault(); $('search').focus(); }
});
void load();
