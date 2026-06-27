/** Содержание, share/PDF, сворачивание панелей. */

const TOC_COLLAPSED_KEY = 'itu-portal-toc-collapsed';
const SIDEBAR_COLLAPSED_KEY = 'itu-portal-sidebar-collapsed';

function readBool(key, fallback = false) {
  try {
    const v = localStorage.getItem(key);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

function initTocPanel() {
  const toc = document.querySelector('.article-toc');
  if (!toc) return;

  const collapsed = readBool(TOC_COLLAPSED_KEY, window.innerWidth <= 1366);
  toc.classList.toggle('is-collapsed', collapsed);

  const toggle = toc.querySelector('[data-toc-collapse]');
  toggle?.addEventListener('click', () => {
    const next = !toc.classList.contains('is-collapsed');
    toc.classList.toggle('is-collapsed', next);
    toggle.setAttribute('aria-expanded', next ? 'false' : 'true');
    writeBool(TOC_COLLAPSED_KEY, next);
  });

  const links = [...toc.querySelectorAll('.article-toc__nav a[href^="#"]')];
  if (links.length === 0) return;

  const headings = links
    .map((link) => {
      const id = link.getAttribute('href')?.slice(1);
      const el = id ? document.getElementById(id) : null;
      return el ? {link, el} : null;
    })
    .filter(Boolean);

  if (headings.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length === 0) return;
      const id = visible[0].target.id;
      for (const {link} of headings) {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      }
    },
    {rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.25, 0.5, 1]},
  );

  for (const {el} of headings) {
    observer.observe(el);
  }
}

function initSidebarCollapse() {
  const shell = document.querySelector('.portal-shell.has-sidebar');
  const sidebar = document.querySelector('.portal-sidebar');
  if (!shell || !sidebar) return;

  const collapsed = readBool(SIDEBAR_COLLAPSED_KEY, false);
  shell.classList.toggle('sidebar-collapsed', collapsed);

  sidebar.querySelector('[data-sidebar-collapse]')?.addEventListener('click', () => {
    const next = !shell.classList.contains('sidebar-collapsed');
    shell.classList.toggle('sidebar-collapsed', next);
    writeBool(SIDEBAR_COLLAPSED_KEY, next);
  });
}

async function shareArticle(button) {
  const title = button.dataset.title || document.title;
  const url = button.dataset.url || window.location.href;
  const payload = {title, text: `Посмотри: «${title}»`, url};

  try {
    if (typeof navigator.share === 'function') {
      await navigator.share(payload);
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }

  await navigator.clipboard.writeText(url);
  button.textContent = 'Ссылка скопирована';
  setTimeout(() => {
    button.textContent = 'Поделиться';
  }, 2000);
}

function initArticleToolbar() {
  document.querySelector('[data-article-share]')?.addEventListener('click', (event) => {
    const btn = event.currentTarget;
    if (btn instanceof HTMLButtonElement) {
      shareArticle(btn).catch(() => {});
    }
  });

  document.querySelector('[data-article-pdf]')?.addEventListener('click', () => {
    window.print();
  });
}

function bootArticleChrome() {
  initTocPanel();
  initSidebarCollapse();
  initArticleToolbar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootArticleChrome);
} else {
  bootArticleChrome();
}

document.addEventListener('astro:page-load', bootArticleChrome);

export {bootArticleChrome};
