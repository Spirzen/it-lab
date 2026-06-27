import {
  buildCodeEmbedUrl,
  buildCodePageUrl,
  getCodeBaseUrl,
  isTrustedCodeOrigin,
} from './code.mjs';
import {initEmbedHost} from './embed-host.js';

const LOADING_MESSAGE = 'Загрузка примера кода…';
const embedControllers = [];

function readTheme() {
  const stored = localStorage.getItem('itu-portal-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initCodeEmbed(host) {
  const example = host.dataset.example ?? '';
  const title = host.dataset.title ?? 'IT Code';
  const minHeight = Number(host.dataset.minHeight ?? 280);
  const baseUrl = getCodeBaseUrl();
  const codeOrigin = new URL(baseUrl).origin;

  const controller = initEmbedHost({
    kind: 'code',
    host,
    title,
    minHeight,
    fullPageUrl: buildCodePageUrl(baseUrl, example),
    buildSrc: (theme) => {
      const url = new URL(buildCodeEmbedUrl(baseUrl, example));
      url.searchParams.set('theme', theme);
      return url.toString();
    },
    origin: codeOrigin,
    loadingMessage: LOADING_MESSAGE,
    gateHint: 'Нажмите, чтобы загрузить пример кода',
    captionText: 'Полный пример на code.spirzen.ru ↗',
  });

  embedControllers.push(controller);
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

function broadcastTheme(theme) {
  for (const controller of embedControllers) {
    controller.sendTheme(theme);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCodeEmbeds);
} else {
  bootCodeEmbeds();
}

document.addEventListener('itu-theme-set', () => {
  broadcastTheme(readTheme());
});

document.addEventListener('astro:page-load', bootCodeEmbeds);

export {bootCodeEmbeds, isTrustedCodeOrigin, getCodeBaseUrl};
