import {acquirePageScrollLock} from './embed-scroll-lock.js';
import {createHeightScheduler} from './embed-viewport.js';
import {mountLoader} from './itu-loader.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {object} options
 * @param {'code'|'play'} options.kind
 * @param {HTMLElement} options.host
 * @param {string} options.title
 * @param {number} options.minHeight
 * @param {string} options.fullPageUrl
 * @param {() => string} options.buildSrc
 * @param {string} options.origin
 * @param {string} options.loadingMessage
 * @param {string} options.gateHint
 * @param {string} options.captionText
 * @param {(data: object) => boolean} [options.onMessage]
 * @param {(iframe: HTMLIFrameElement) => void} [options.onIframeReady]
 */
export function initEmbedHost(options) {
  const {
    kind,
    host,
    title,
    minHeight,
    fullPageUrl,
    buildSrc,
    origin,
    loadingMessage,
    gateHint,
    captionText,
    onMessage,
    onIframeReady,
  } = options;

  const prefix = kind === 'play' ? 'itu-play-embed' : 'itu-code-embed';
  const fullscreenType = kind === 'play' ? 'it-play-fullscreen' : 'it-code-fullscreen';
  const closeType = kind === 'play' ? 'it-play-fullscreen-close' : 'it-code-fullscreen-close';
  const heightType = kind === 'play' ? 'it-play-embed-height' : 'it-code-embed-height';
  const themeType = kind === 'play' ? 'it-play-theme' : 'it-code-theme';

  let iframe = null;
  let releaseScroll = null;
  let isFullscreen = false;

  const {scheduleHeight, markExitFullscreen} = createHeightScheduler(
    host,
    minHeight,
    () => isFullscreen,
  );

  host.style.minHeight = `${minHeight}px`;
  host.classList.add(`${prefix}--pending`);

  const gate = document.createElement('button');
  gate.type = 'button';
  gate.className = `${prefix}__gate`;
  gate.innerHTML =
    `<span class="${prefix}__gate-title">${escapeHtml(title)}</span>` +
    `<span class="${prefix}__gate-hint">${escapeHtml(gateHint)}</span>`;

  const frameHost = document.createElement('div');
  frameHost.className = `${prefix}__frame-host`;
  frameHost.hidden = true;

  const caption = document.createElement('div');
  caption.className = `${prefix}__caption`;
  caption.innerHTML =
    `<a href="${escapeHtml(fullPageUrl)}" target="_blank" rel="noopener noreferrer">${captionText}</a>`;
  caption.hidden = true;

  host.append(gate, frameHost, caption);

  function setFullscreen(active) {
    isFullscreen = active;
    if (active) {
      host.classList.add('itu-embed--fullscreen');
      releaseScroll = acquirePageScrollLock();
      if (iframe) {
        iframe.style.height = '100%';
      }
    } else {
      host.classList.remove('itu-embed--fullscreen');
      releaseScroll?.();
      releaseScroll = null;
      markExitFullscreen();
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape' && isFullscreen) {
      iframe?.contentWindow?.postMessage({type: closeType}, origin);
      setFullscreen(false);
    }
  }

  function handleMessage(event) {
    if (event.origin !== origin) {
      return;
    }
    if (!iframe?.contentWindow || event.source !== iframe.contentWindow) {
      return;
    }
    const data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.type === heightType && typeof data.height === 'number') {
      scheduleHeight(data.height);
      return;
    }

    if (data.type === fullscreenType) {
      setFullscreen(Boolean(data.active));
      if (data.active) {
        window.addEventListener('keydown', onKeyDown);
      } else {
        window.removeEventListener('keydown', onKeyDown);
      }
      return;
    }

    if (kind === 'code' && data.type === 'it-code-copy') {
      const text = typeof data.text === 'string' ? data.text : '';
      const copyId = data.id;
      const reply = (ok) => {
        if (!copyId || !iframe?.contentWindow) {
          return;
        }
        iframe.contentWindow.postMessage({type: 'it-code-copy-result', id: copyId, ok: Boolean(ok)}, origin);
      };
      if (!text) {
        reply(false);
        return;
      }
      navigator.clipboard.writeText(text).then(() => reply(true)).catch(() => reply(false));
      return;
    }

    onMessage?.(data);
  }

  window.addEventListener('message', handleMessage);

  gate.addEventListener('click', () => {
    gate.remove();
    frameHost.hidden = false;
    caption.hidden = false;
    host.classList.remove(`${prefix}--pending`);
    host.classList.add(`${prefix}--active`);

    const theme =
      document.documentElement.dataset.theme === 'dark' ||
      document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';

    iframe = document.createElement('iframe');
    iframe.className = `${prefix}__frame`;
    iframe.title = title;
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allow = 'fullscreen';
    iframe.src = buildSrc(theme);

    const mask = document.createElement('div');
    mask.className = `${prefix}__loading`;
    mountLoader(mask, {
      title: kind === 'play' ? 'Play IT' : 'Код IT',
      label: loadingMessage,
      variant: 'overlay',
    });
    frameHost.append(mask, iframe);

    iframe.addEventListener('load', () => {
      mask.remove();
      iframe.contentWindow?.postMessage({type: themeType, theme}, origin);
      if (iframe) {
        onIframeReady?.(iframe);
      }
    });
  });

  return {
    sendTheme(theme) {
      iframe?.contentWindow?.postMessage({type: themeType, theme}, origin);
    },
  };
}

export {escapeHtml};
