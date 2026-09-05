import { $, button, state } from './model';
import { visualizer } from './gen/graph.js';
import { startTour } from './tour';

let history: visualizer.Turn[] = [];
let busy = false;
let returnFocus: HTMLElement | null = null;
const dialog = () => $('ai-dialog') as HTMLDialogElement;

export function initializeChat(): void {
  $('open-ai').onclick = openChat;
  $('close-ai').onclick = () => dialog().close();
  $('ask-symbol').onclick = () => {
    openChat(); ($('question') as HTMLTextAreaElement).value = `Explique o comportamento de ${state.byId.get(state.selected)?.name || 'esta seleção'} e mostre no grafo.`;
  };
  dialog().addEventListener('close', () => returnFocus?.focus());
  dialog().addEventListener('tour-start', () => dialog().close());
  $('ai-form').addEventListener('submit', event => { event.preventDefault(); void send(); });
  $('question').addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void send(); }
  });
  for (const suggestion of document.querySelectorAll<HTMLButtonElement>('.suggestion')) {
    suggestion.onclick = () => { ($('question') as HTMLTextAreaElement).value = suggestion.textContent || ''; $('question').focus(); };
  }
  $('clear-chat').onclick = () => {
    if (busy) return;
    history = []; $('conversation').replaceChildren(); $('ai-error').hidden = true;
    window.speechSynthesis?.cancel();
  };
}

export function openChat(): void {
  if (dialog().open) { dialog().close(); return; }
  returnFocus = document.activeElement as HTMLElement | null;
  refreshChat();
  dialog().showModal(); $('question').focus();
}

export function refreshChat(): void {
  $('ai-setup').hidden = state.offline || state.session.aiEnabled;
  $('offline-note').hidden = !state.offline;
  $('ai-provider').textContent = state.session.aiEnabled ? `${state.session.provider} · ${state.session.model}` : 'Uma pergunta. Um caminho mais claro.';
  $('selection-context').textContent = `Contexto: ${state.byId.get(state.selected)?.name || 'repositório'}`;
  ($('send-ai') as HTMLButtonElement).disabled = busy || !state.session.aiEnabled || state.offline;
}

async function send(): Promise<void> {
  const input = $('question') as HTMLTextAreaElement;
  const question = input.value.trim();
  if (!question || busy || !state.session.aiEnabled || state.offline) return;
  setBusy(true); $('ai-error').hidden = true;
  try {
    const body = visualizer.ChatRequest.encode({ question, selectedIds: state.selected ? [state.selected] : [], history: history.slice(-12) }).finish();
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/x-protobuf', 'x-rv-session': state.session.token }, body: new Uint8Array(body), signal: AbortSignal.timeout(100_000) });
    const bytes = new Uint8Array(await response.arrayBuffer());
    let answer: visualizer.ChatResponse;
    try { answer = visualizer.ChatResponse.decode(bytes); } catch { throw new Error(`Não foi possível ler a resposta (HTTP ${response.status}). Tente novamente.`); }
    if (!response.ok || answer.error) throw new Error(answer.error || `Provedor retornou HTTP ${response.status}`);
    renderMessage('user', question);
    renderMessage('assistant', answer.answer, answer);
    history.push(new visualizer.Turn({ role: 'user', text: question }), new visualizer.Turn({ role: 'assistant', text: answer.answer }));
    history = history.slice(-12); input.value = '';
  } catch (error) {
    $('ai-error').textContent = error instanceof Error ? error.message : 'Não foi possível conversar com a IA.';
    $('ai-error').hidden = false;
  } finally { setBusy(false); input.focus(); }
}

function setBusy(value: boolean): void {
  busy = value; $('ai-loading').hidden = !value;
  ($('send-ai') as HTMLButtonElement).disabled = value;
  ($('clear-chat') as HTMLButtonElement).disabled = value;
  $('ai-form').setAttribute('aria-busy', String(value));
}

function renderMessage(role: string, text: string, answer?: visualizer.ChatResponse): void {
  $('conversation').querySelector('.chat-welcome')?.remove();
  const article = document.createElement('article'); article.className = `message ${role}`;
  const label = document.createElement('div'); label.className = 'message-label'; label.textContent = role === 'user' ? 'VOCÊ' : '✦ EXPLICAÇÃO DA IA';
  const content = document.createElement('p'); content.textContent = text;
  article.append(label, content);
  if (answer) {
    const actions = document.createElement('div'); actions.className = 'message-actions';
    if (answer.highlights.length || answer.steps.length) actions.append(button('↗ Mostrar no grafo', () => startTour(answer), 'Mostrar no grafo'));
    const audio = button('◖ Ouvir resposta', () => speak(text, audio), 'Ouvir resposta');
    audio.disabled = !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window);
    audio.title = audio.disabled ? 'Áudio não disponível neste navegador.' : 'Voz sintetizada pelo navegador; a disponibilidade depende do sistema.';
    actions.append(audio); article.append(actions);
  }
  $('conversation').append(article);
  $('conversation').scrollTop = $('conversation').scrollHeight;
}

function speak(text: string, control: HTMLButtonElement): void {
  window.speechSynthesis.cancel();
  if (control.dataset.speaking) { restoreSpeech(control); return; }
  for (const other of document.querySelectorAll<HTMLButtonElement>('[data-speaking]')) restoreSpeech(other);
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'pt-BR'; utterance.rate = 1;
  control.dataset.speaking = 'true'; control.textContent = '■ Parar áudio'; control.setAttribute('aria-label', 'Parar áudio');
  utterance.onend = () => restoreSpeech(control);
  utterance.onerror = () => { restoreSpeech(control); control.title = 'Não foi possível reproduzir o áudio. Verifique as vozes do navegador.'; };
  window.speechSynthesis.speak(utterance);
}

function restoreSpeech(control: HTMLButtonElement): void {
  delete control.dataset.speaking; control.textContent = '◖ Ouvir resposta'; control.setAttribute('aria-label', 'Ouvir resposta');
}
