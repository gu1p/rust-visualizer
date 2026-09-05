import type { Node } from './model';

const NS = 'http://www.w3.org/2000/svg';
const palettes: Record<string, string> = {
  crate: '#eab786', folder: '#86b9f5', rust: '#ee9677', toml: '#73d5c5', markdown: '#a3c6ff',
  yaml: '#c1a0f4', javascript: '#efd474', typescript: '#78b9f5', json: '#e8c478',
  html: '#f39d89', css: '#b9a1ff', image: '#94d3a2', lock: '#b7a2c9', git: '#eb9e97',
  shell: '#9fce87', proto: '#88d4dd', file: '#96a6bb', function: '#74d7c6', type: '#c9a7ed',
};
const paths: Record<string, string[]> = {
  crate: ['M12 2 3 7v10l9 5 9-5V7L12 2Z', 'm3 7 9 5 9-5M12 12v10M7.5 4.5l9 5'],
  folder: ['M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3V6Z', 'M3 10h18'],
  rust: ['m9 3 1-2h4l1 2 3 2 3 1v4l2 2-2 2v4l-3 1-3 2-1 2h-4l-1-2-3-2-3-1v-4l-2-2 2-2V6l3-1 3-2Z', 'M9 16V8h4a2 2 0 0 1 0 4H9m4 0 3 4'],
  toml: ['M5 4v16M12 4v16M19 4v16', 'M2 8h6M9 16h6M16 10h6'],
  markdown: ['M3 4h18v16H3V4Z', 'M6 15V9l3 3 3-3v6m3-3 2 3 2-3m-2-3v6'],
  image: ['M3 3h18v18H3V3Z', 'm3 17 6-6 4 4 3-3 5 5', 'M15 7h1'],
  lock: ['M5 10h14v11H5V10Z', 'M8 10V6a4 4 0 0 1 8 0v4M12 14v3'],
  git: ['m12 2 10 10-10 10L2 12 12 2Z', 'm8 6 8 8M8 6v10'],
  function: ['M16 4h-3c-2 0-3 2-3 4l-1 9c0 2-1 3-3 3H4M6 10h10'],
  type: ['m12 3 9 5v9l-9 5-9-5V8l9-5Z', 'm3 8 9 5 9-5M12 13v9'],
  file: ['M5 2h9l5 5v15H5V2Z', 'M14 2v6h5'],
};

export function iconKind(node: Pick<Node, 'kind' | 'name' | 'file'>): string {
  if (node.kind === 'crate' || node.kind === 'folder' || node.kind === 'function') return node.kind;
  if (['struct', 'enum', 'trait', 'module'].includes(node.kind)) return 'type';
  const name = (node.file || node.name).split('/').pop()!.toLowerCase();
  if (name.startsWith('.git')) return 'git';
  if (name.endsWith('.lock')) return 'lock';
  const extension = name.split('.').pop()!;
  return ({ rs: 'rust', toml: 'toml', md: 'markdown', mdx: 'markdown', yml: 'yaml', yaml: 'yaml',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', ts: 'typescript', tsx: 'typescript',
    json: 'json', html: 'html', css: 'css', scss: 'css', svg: 'image', png: 'image', jpg: 'image',
    jpeg: 'image', webp: 'image', sh: 'shell', bash: 'shell', proto: 'proto' } as Record<string, string>)[extension] || 'file';
}

export function fileIcon(node: Pick<Node, 'kind' | 'name' | 'file'>): SVGSVGElement {
  const kind = iconKind(node);
  const icon = document.createElementNS(NS, 'svg');
  icon.classList.add('file-icon'); icon.dataset.icon = kind;
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) icon.setAttribute(key, value);
  icon.style.color = palettes[kind];
  for (const d of paths[kind] || paths.file) {
    const path = document.createElementNS(NS, 'path'); path.setAttribute('d', d); icon.append(path);
  }
  const badge = ({ javascript: 'JS', typescript: 'TS', yaml: 'Y', json: '{}', html: '<>', css: '#', shell: '>_', proto: 'P' } as Record<string, string>)[kind];
  if (badge) {
    const text = document.createElementNS(NS, 'text'); text.setAttribute('x', '12'); text.setAttribute('y', '17');
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('stroke', 'none'); text.setAttribute('fill', 'currentColor');
    text.setAttribute('font-size', '8'); text.setAttribute('font-weight', '700'); text.textContent = badge; icon.append(text);
  }
  return icon;
}
