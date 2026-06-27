/** Инициализация mermaid-диаграмм в теле статьи. */
async function initMermaid() {
  const blocks = [...document.querySelectorAll('pre code.language-mermaid')];
  if (blocks.length === 0) {
    return;
  }

  const {default: mermaid} = await import('mermaid');

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre) {
      continue;
    }
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent ?? '';
    pre.replaceWith(div);
  }

  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: 'loose',
  });
  await mermaid.run({querySelector: '.mermaid'});
}

function bootMermaid() {
  initMermaid().catch(() => {
    /* diagrams stay as code blocks */
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootMermaid);
} else {
  bootMermaid();
}

document.addEventListener('itu-theme-set', bootMermaid);
document.addEventListener('astro:page-load', bootMermaid);

export {bootMermaid};
