/** Синхронизация темы портала с родительским окном (postMessage, как code/play embed). */
(function initPortalTheme() {
  const STORAGE_KEY = 'itu-portal-theme';
  const root = document.documentElement;

  /** @type {import('../../ecosystem-urls.json')} */
  let pm = {themeRequest: 'itu-theme-request', themeChange: 'itu-theme-change', source: 'itu-portal'};

  try {
    const el = document.getElementById('itu-ecosystem-config');
    if (el?.textContent) {
      const cfg = JSON.parse(el.textContent);
      if (cfg.postMessage) {
        pm = cfg.postMessage;
      }
    }
  } catch {
    /* ignore */
  }

  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function resolveTheme(stored) {
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }

  function persist(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* private mode */
    }
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function broadcast(theme) {
    window.parent.postMessage(
      {type: pm.themeChange, theme, source: pm.source},
      '*',
    );
  }

  function setTheme(mode, {broadcastChange = true} = {}) {
    persist(mode);
    applyTheme(resolveTheme(mode));
    if (broadcastChange) {
      broadcast(resolveTheme(mode));
    }
    window.dispatchEvent(new CustomEvent('itu-theme-set', {detail: {mode}}));
  }

  function cycleTheme() {
    const current = readStored();
    const resolved = resolveTheme(current);
    const next = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  applyTheme(resolveTheme(readStored()));

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const stored = readStored();
    if (stored !== 'light' && stored !== 'dark') {
      applyTheme(resolveTheme(stored));
    }
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }
    if (data.type === pm.themeChange && (data.theme === 'light' || data.theme === 'dark')) {
      setTheme(data.theme, {broadcastChange: false});
    }
    if (data.type === pm.themeRequest) {
      broadcast(resolveTheme(readStored()));
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const btn = target.closest('[data-itu-theme-toggle]');
    if (btn) {
      cycleTheme();
    }
  });

  window.ITUPortalTheme = {setTheme, cycleTheme, readStored, resolveTheme};
})();
