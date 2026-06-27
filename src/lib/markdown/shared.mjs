import path from 'node:path';

export const SPIRZEN_BASE = 'https://spirzen.ru';
export const TERMS_BASE = 'https://terms.spirzen.ru';
export const ASSETS_BASE = 'https://assets.spirzen.ru';

/** @param {string} content */
export function stripJsxComments(content) {
  return content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

/**
 * @param {string} markdown
 * @param {string} relPath — путь файла от content/{portal}/
 * @param {string} assetsPublicBase — `/doc-assets/lab` или `/doc-assets/tools`
 */
export function fixImageUrls(markdown, relPath, assetsPublicBase) {
  const dir = path.dirname(relPath).replace(/\\/g, '/');
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:|\/\/|\/|data:)([^)]+)\)/g,
    (_, alt, src) => {
      const file = src.replace(/^\.\//, '');
      if (file.includes('/')) {
        return `![${alt}](${assetsPublicBase}/${file})`;
      }
      const folder = dir && dir !== '.' ? `${dir}/` : '';
      return `![${alt}](${assetsPublicBase}/${folder}${file})`;
    },
  );
}

/** @param {string} content */
export function fixCrossPortalLinks(content) {
  let body = content;
  body = body.replace(/\]\(\/encyclopedia\//g, `](${SPIRZEN_BASE}/encyclopedia/`);
  body = body.replace(/\]\(\/glossary\//g, `](${TERMS_BASE}/glossary/`);
  body = body.replace(/\]\(\/about\//g, `](${SPIRZEN_BASE}/about/`);
  body = body.replace(/\]\(\/section\//g, `](${SPIRZEN_BASE}/section/`);
  body = body.replace(/\]\(\.\.\/\.\.\/encyclopedia\//g, `](${SPIRZEN_BASE}/encyclopedia/`);
  body = body.replace(/\]\(\.\.\/encyclopedia\//g, `](${SPIRZEN_BASE}/encyclopedia/`);
  body = body.replace(/\]\(\.\.\/glossary\//g, `](${TERMS_BASE}/glossary/`);
  body = body.replace(/\]\(\.\.\/\.\.\/glossary\//g, `](${TERMS_BASE}/glossary/`);
  body = body.replace(/\]\(https:\/\/spirzen\.github\.io\/WebEditor\/?\)/g, '](https://html.spirzen.ru/)');
  return body;
}

/** @param {string} value */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Array<{ title: string, description?: string, href: string }>} items
 * @param {string} [ariaLabel]
 */
export function buildPortalCardListHtml(items, ariaLabel = 'Материалы раздела') {
  if (items.length === 0) {
    return '';
  }
  const cards = items
    .map(
      (item) =>
        `<li class="portal-card-list__item"><a class="portal-card" href="${item.href}">` +
        `<span class="portal-card__title">${escapeHtml(item.title)}</span>` +
        (item.description
          ? `<span class="portal-card__desc">${escapeHtml(item.description)}</span>`
          : '') +
        `</a></li>`,
    )
    .join('');
  return `<nav class="portal-card-list" aria-label="${escapeHtml(ariaLabel)}"><ul class="portal-card-list__grid">${cards}</ul></nav>`;
}

/** @param {string} text */
function convertInlineMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safeHref = href.replace(/"/g, '&quot;');
      return `<a href="${safeHref}">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Markdown внутри HTML-блоков (callout, faq) не обрабатывается remark — конвертируем до рендера.
 * @param {string} content
 */
export function preprocessMarkdownInHtmlBlocks(content) {
  return content.replace(
    /(<div class="callout-body">\s*)([\s\S]*?)(\s*<\/div>)/g,
    (_, open, inner, close) => {
      const body = inner
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return '';
          }
          if (/^<\/?[a-z]/i.test(trimmed)) {
            return line;
          }
          return `<p>${convertInlineMarkdown(trimmed)}</p>`;
        })
        .filter(Boolean)
        .join('\n');
      return `${open}${body}${close}`;
    },
  );
}

/**
 * Страховка после remark: оставшиеся [text](url) в callout/faq.
 * @param {string} html
 */
export function fixMarkdownLinksInHtmlBlocks(html) {
  const replaceLinks = (chunk) =>
    chunk.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  let out = html.replace(
    /(<div class="callout-body">)([\s\S]*?)(<\/div>)/g,
    (_, open, inner, close) => `${open}${replaceLinks(inner)}${close}`,
  );
  out = out.replace(
    /(<p class="faq-(?:a|q)">)([\s\S]*?)(<\/p>)/g,
    (_, open, inner, close) => `${open}${replaceLinks(inner)}${close}`,
  );
  return out;
}

/** @param {string} text */
export function slugifyHeading(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** @param {string} markdown */
export function extractTocFromMarkdown(markdown) {
  const items = [];
  for (const line of markdown.split('\n')) {
    const h2 = /^##\s+(.+)$/.exec(line.trim());
    const h3 = /^###\s+(.+)$/.exec(line.trim());
    if (h2) {
      items.push({level: 2, text: h2[1].trim(), id: slugifyHeading(h2[1])});
    } else if (h3) {
      items.push({level: 3, text: h3[1].trim(), id: slugifyHeading(h3[1])});
    }
  }
  return items;
}

/** @param {string} html */
export function addHeadingIds(html) {
  return html.replace(/<h([23])>([^<]+)<\/h\1>/g, (_, level, text) => {
    const id = slugifyHeading(text);
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}
