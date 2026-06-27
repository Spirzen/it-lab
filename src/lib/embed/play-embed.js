import {
  buildPlayEmbedUrl,
  buildPlayPageUrl,
  getPlayBaseUrl,
  isTrustedPlayOrigin,
} from './play.mjs';

const LOADING_MESSAGE = 'Загрузка интерактивного демо…';

function readTheme() {
  const stored = localStorage.getItem('itu-portal-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function buildEmbedSrc(baseUrl, example, playProps, theme) {
  const url = new URL(buildPlayEmbedUrl(baseUrl, example));
  url.searchParams.set('theme', theme);
  if (playProps && typeof playProps === 'object') {
    for (const [key, value] of Object.entries(playProps)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  }
  return url.toString();
}

function initPlayEmbed(host) {
  const example = host.dataset.example ?? '';
  const title = host.dataset.title ?? 'IT Play';
  const minHeight = Number(host.dataset.minHeight ?? 320);
  let playProps = {};
  try {
    playProps = JSON.parse(host.dataset.playProps ?? '{}');
  } catch {
    playProps = {};
  }

  const baseUrl = getPlayBaseUrl();
  const playOrigin = new URL(baseUrl).origin;
  const fullPageUrl = buildPlayPageUrl(baseUrl, example);

  host.style.minHeight = `${minHeight}px`;
  host.classList.add('itu-play-embed--pending');

  const gate = document.createElement('button');
  gate.type = 'button';
  gate.className = 'itu-play-embed__gate';
  gate.innerHTML = `<span class="itu-play-embed__gate-title">${escapeHtml(title)}</span>` +
    `<span class="itu-play-embed__gate-hint">Нажмите, чтобы загрузить интерактивное демо</span>`;

  const frameHost = document.createElement('div');
  frameHost.className = 'itu-play-embed__frame-host';
  frameHost.hidden = true;

  const caption = document.createElement('div');
  caption.className = 'itu-play-embed__caption';
  caption.innerHTML = `<a href="${fullPageUrl}" target="_blank" rel="noopener noreferrer">` +
    `Полное демо на play.spirzen.ru ↗</a>`;
  caption.hidden = true;

  host.append(gate, frameHost, caption);

  let iframe = null;
  let currentHeight = minHeight;

  const onMessage = (event) => {
    if (!isTrustedPlayOrigin(event.origin, baseUrl)) {
      return;
    }
    if (!iframe?.contentWindow || event.source !== iframe.contentWindow) {
      return;
    }
    const data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }
    if (data.type === 'it-play-embed-height' && typeof data.height === 'number') {
      currentHeight = Math.max(minHeight, data.height);
      iframe.style.height = `${currentHeight}px`;
    }
  };

  gate.addEventListener('click', () => {
    gate.remove();
    frameHost.hidden = false;
    caption.hidden = false;
    host.classList.remove('itu-play-embed--pending');
    host.classList.add('itu-play-embed--active');

    const theme = readTheme();
    iframe = document.createElement('iframe');
    iframe.className = 'itu-play-embed__frame';
    iframe.title = title;
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allow = 'fullscreen';
    iframe.style.height = `${currentHeight}px`;
    iframe.src = buildEmbedSrc(baseUrl, example, playProps, theme);

    const mask = document.createElement('div');
    mask.className = 'itu-play-embed__loading';
    mask.setAttribute('role', 'status');
    mask.textContent = LOADING_MESSAGE;
    frameHost.append(mask, iframe);

    iframe.addEventListener('load', () => {
      mask.remove();
      iframe.contentWindow?.postMessage({type: 'it-play-theme', theme: readTheme()}, playOrigin);
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

function bootPlayEmbeds() {
  for (const host of document.querySelectorAll('.itu-play-embed')) {
    if (host.dataset.initialized === 'true') {
      continue;
    }
    host.dataset.initialized = 'true';
    initPlayEmbed(host);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPlayEmbeds);
} else {
  bootPlayEmbeds();
}

document.addEventListener('itu-theme-set', () => {
  const theme = readTheme();
  const baseUrl = getPlayBaseUrl();
  const playOrigin = new URL(baseUrl).origin;
  for (const iframe of document.querySelectorAll('.itu-play-embed__frame')) {
    iframe.contentWindow?.postMessage({type: 'it-play-theme', theme}, playOrigin);
  }
});

export {bootPlayEmbeds};
