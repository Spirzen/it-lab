import {
  buildPlayEmbedUrl,
  buildPlayPageUrl,
  getPlayBaseUrl,
  isTrustedPlayOrigin,
} from './play.mjs';
import {initEmbedHost} from './embed-host.js';

const LOADING_MESSAGE = 'Загрузка интерактивного демо…';
const embedControllers = [];

function readTheme() {
  const stored = localStorage.getItem('itu-portal-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function buildEmbedSrc(baseUrl, example, src, playProps, theme) {
  if (src) {
    try {
      const url = new URL(src);
      url.searchParams.set('theme', theme);
      return url.toString();
    } catch {
      return src;
    }
  }
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
  const src = host.dataset.src ?? '';
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
  const fullPageUrl = src || buildPlayPageUrl(baseUrl, example);

  const controller = initEmbedHost({
    kind: 'play',
    host,
    title,
    minHeight,
    fullPageUrl,
    buildSrc: (theme) => buildEmbedSrc(baseUrl, example, src, playProps, theme),
    origin: playOrigin,
    loadingMessage: LOADING_MESSAGE,
    gateHint: 'Нажмите, чтобы загрузить интерактивное демо',
    captionText: 'Полное демо на play.spirzen.ru ↗',
  });

  embedControllers.push(controller);
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

function broadcastTheme(theme) {
  for (const controller of embedControllers) {
    controller.sendTheme(theme);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPlayEmbeds);
} else {
  bootPlayEmbeds();
}

document.addEventListener('itu-theme-set', () => {
  broadcastTheme(readTheme());
});

document.addEventListener('astro:page-load', bootPlayEmbeds);

export {bootPlayEmbeds, isTrustedPlayOrigin, getPlayBaseUrl};
