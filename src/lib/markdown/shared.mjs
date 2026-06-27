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
