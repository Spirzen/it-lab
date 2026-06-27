import {
  buildCodeEmbedUrl,
  buildCodePageUrl,
  getCodeBaseUrl,
  isTrustedCodeOrigin,
} from './code.mjs';

const LOADING_MESSAGE = 'Загрузка примера кода…';

function readTheme() {
  const stored = localStorage.getItem('itu-portal-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function buildEmbedSrc(baseUrl, example, theme) {
  const url = new URL(buildCodeEmbedUrl(baseUrl, example));
  url.searchParams.set('theme', theme);
  return url.toString();
}

function initCodeEmbed(host) {
  const example = host.dataset.example ?? '';
  const title = host.dataset.title ?? 'IT Code';
  const minHeight = Number(host.dataset.minHeight ?? 280);

  const baseUrl = getCodeBaseUrl();
  const codeOrigin = new URL(baseUrl).origin;
  const fullPageUrl = buildCodePageUrl(baseUrl, example);

  host.style.minHeight = `${minHeight}px`;
  host.classList.add('itu-code-embed--pending');

  const gate = document.createElement('button');
  gate.type = 'button';
  gate.className = 'itu-code-embed__gate';
  gate.innerHTML = `<span class="itu-code-embed__gate-title">${escapeHtml(title)}</span>` +
    `<span class="itu-code-embed__gate-hint">Нажмите, чтобы загрузить пример кода</span>`;

  const frameHost = document.createElement('div');
  frameHost.className = 'itu-code-embed__frame-host';
  frameHost.hidden = true;

  const caption = document.createElement('div');
  caption.className = 'itu-code-embed__caption';
  caption.innerHTML = `<a href="${fullPageUrl}" target="_blank" rel="noopener noreferrer">` +
    `Полный пример на code.spirzen.ru ↗</a>`;
  caption.hidden = true;

  host.append(gate, frameHost, caption);

  let iframe = null;
  let currentHeight = minHeight;

  const onMessage = (event) => {
    if (!isTrustedCodeOrigin(event.origin, baseUrl)) {
      return;
    }
    if (!iframe?.contentWindow || event.source !== iframe.contentWindow) {
      return;
    }
    const data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }
    if (data.type === 'it-code-embed-height' && typeof data.height === 'number') {
      currentHeight = Math.max(minHeight, data.height);
      iframe.style.height = `${currentHeight}px`;
    }
  };

  gate.addEventListener('click', () => {
    gate.remove();
    frameHost.hidden = false;
    caption.hidden = false;
    host.classList.remove('itu-code-embed--pending');
    host.classList.add('itu-code-embed--active');

    const theme = readTheme();
    iframe = document.createElement('iframe');
    iframe.className = 'itu-code-embed__frame';
    iframe.title = title;
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.style.height = `${currentHeight}px`;
    iframe.src = buildEmbedSrc(baseUrl, example, theme);

    const mask = document.createElement('div');
    mask.className = 'itu-code-embed__loading';
    mask.setAttribute('role', 'status');
    mask.textContent = LOADING_MESSAGE;
    frameHost.append(mask, iframe);

    iframe.addEventListener('load', () => {
      mask.remove();
      iframe.contentWindow?.postMessage({type: 'it-code-theme', theme: readTheme()}, codeOrigin);
    });

    window.addEventListener('message', onMessage);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bootCodeEmbeds() {
  for (const host of document.querySelectorAll('.itu-code-embed[data-example]')) {
    if (host.dataset.initialized === 'true') {
      continue;
    }
    host.dataset.initialized = 'true';
    initCodeEmbed(host);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCodeEmbeds);
} else {
  bootCodeEmbeds();
}

document.addEventListener('itu-theme-set', () => {
  const theme = readTheme();
  const baseUrl = getCodeBaseUrl();
  const codeOrigin = new URL(baseUrl).origin;
  for (const iframe of document.querySelectorAll('.itu-code-embed__frame')) {
    iframe.contentWindow?.postMessage({type: 'it-code-theme', theme}, codeOrigin);
  }
});

export {bootCodeEmbeds};
