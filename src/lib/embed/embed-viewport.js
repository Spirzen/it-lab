/**
 * Планировщик высоты embed — debounce через rAF, компенсация scroll (как в KB).
 * @param {HTMLElement} host
 * @param {number} minHeight
 * @param {() => boolean} isFullscreen
 */
export function createHeightScheduler(host, minHeight, isFullscreen) {
  let lastHeight = minHeight;
  let rafId = 0;
  let quietUntil = 0;

  function applyFrameHeight(height) {
    const iframe = host.querySelector('iframe');
    const frameHost = host.querySelector('.itu-code-embed__frame-host, .itu-play-embed__frame-host');
    host.style.minHeight = `${height}px`;
    if (frameHost) {
      frameHost.style.minHeight = `${height}px`;
    }
    if (iframe) {
      iframe.style.height = isFullscreen() ? '100%' : `${height}px`;
    }
  }

  applyFrameHeight(minHeight);

  function scheduleHeight(nextHeight) {
    if (typeof nextHeight !== 'number' || nextHeight < 48 || isFullscreen()) {
      return;
    }

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const normalized = Math.max(minHeight, Math.ceil(nextHeight) + 2);
      if (Math.abs(normalized - lastHeight) < 2) {
        return;
      }

      const delta = normalized - lastHeight;
      if (delta > 0 && Date.now() >= quietUntil) {
        const top = host.getBoundingClientRect().top;
        if (top < -4) {
          window.scrollBy(0, delta);
        }
      }

      lastHeight = normalized;
      applyFrameHeight(normalized);
    });
  }

  function markExitFullscreen() {
    quietUntil = Date.now() + 450;
    applyFrameHeight(lastHeight);
  }

  return {scheduleHeight, markExitFullscreen, applyFrameHeight};
}
