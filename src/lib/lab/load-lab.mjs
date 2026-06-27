import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findRepoRoot} from '../ecosystem.mjs';
import {
  listMarkdownFilesRecursive,
  parseLabMarkdownFile,
  pathSegmentsToHref,
} from './parse-markdown.mjs';
import {renderMarkdownToHtml} from './render-markdown.mjs';

const SPIRZEN_BASE = 'https://spirzen.ru';

export async function loadLabPages(contentDir) {
  const dir =
    contentDir ?? path.join(findRepoRoot(path.dirname(fileURLToPath(import.meta.url))), 'content/lab');
  const relFiles = listMarkdownFilesRecursive(dir);
  const parsed = relFiles.map((rel) => parseLabMarkdownFile(path.join(dir, rel), dir));
  const byHref = new Map(parsed.map((page) => [page.href, page]));

  const pages = [];
  for (const page of parsed) {
    pages.push(await buildLabPage(page, byHref, dir));
  }

  pages.sort((a, b) => a.href.localeCompare(b.href, 'ru'));

  return {
    pages,
    sidebar: buildSidebar(pages),
  };
}

async function buildLabPage(page, byHref, contentDir) {
  let markdown = page.bodyMarkdown;
  if (markdown.includes('<!-- DOC_CARD_LIST -->')) {
    const cardsHtml = buildDocCardListHtml(page, byHref, contentDir);
    markdown = markdown.replace('<!-- DOC_CARD_LIST -->', cardsHtml);
  }

  return {
    ...page,
    pathSlug: page.pathSegments.join('/'),
    bodyHtml: await renderMarkdownToHtml(markdown),
    relatedLinks: buildRelatedLinks(page.related),
  };
}

function buildDocCardListHtml(page, byHref, contentDir) {
  const category = page.categoryLabel ?? page.pathSegments[0];
  const items = [];

  if (page.href === '/lab/intro') {
    for (const candidate of byHref.values()) {
      if (candidate.isIntro && candidate.href !== '/lab/intro' && candidate.categoryLabel) {
        items.push(candidate);
      }
    }
  } else if (category) {
    for (const candidate of byHref.values()) {
      if (
        candidate.categoryLabel === category &&
        !candidate.isIntro &&
        candidate.href.startsWith(`/lab/${category}/`)
      ) {
        items.push(candidate);
      }
    }
  }

  items.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  if (items.length === 0) {
    return '';
  }

  const cards = items
    .slice(0, 24)
    .map(
      (item) =>
        `<li><a class="lab-card" href="${item.href}"><strong>${escapeHtml(item.title)}</strong>` +
        (item.description ? `<span>${escapeHtml(item.description)}</span>` : '') +
        `</a></li>`,
    )
    .join('\n');

  return `<nav class="lab-card-list" aria-label="Материалы раздела"><ul>${cards}</ul></nav>`;
}

function buildRelatedLinks(related) {
  return related
    .map((item) => {
      const doc = item.doc ?? '';
      if (doc.startsWith('encyclopedia/')) {
        return {
          title: item.title ?? doc,
          href: `${SPIRZEN_BASE}/${doc}`,
          external: true,
        };
      }
      if (doc.startsWith('lab/')) {
        const rel = doc.replace(/^lab\//, '');
        const segments = rel.split('/');
        const folder = segments[0];
        const id = segments.slice(1).join('/') || 'intro';
        const categoryLabel = folderCategoryMap[folder] ?? folder;
        return {
          title: item.title ?? doc,
          href: pathSegmentsToHref([categoryLabel, id]),
          external: false,
        };
      }
      if (doc.startsWith('glossary/')) {
        return {
          title: item.title ?? doc,
          href: `https://terms.spirzen.ru/${doc}`,
          external: true,
        };
      }
      return null;
    })
    .filter(Boolean);
}

const folderCategoryMap = {
  examples: 'Примеры',
  questions: 'Вопросы',
  tasks: 'Задачи',
  cases: 'Кейсы',
  roadmap: 'Планы развития',
  trainers: 'Тренажеры',
  exams: 'Экзамены',
  experiments: 'Эксперименты',
};

function buildSidebar(pages) {
  const items = [];
  const rootIntro = pages.find((p) => p.href === '/lab/intro');
  if (rootIntro) {
    items.push({slug: 'intro', label: 'О разделе', href: '/lab/intro'});
  }

  const categories = new Map();
  for (const page of pages) {
    if (!page.categoryLabel) {
      continue;
    }
    if (!categories.has(page.categoryLabel)) {
      categories.set(page.categoryLabel, []);
    }
    categories.get(page.categoryLabel).push(page);
  }

  for (const [label, categoryPages] of [...categories.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], 'ru'),
  )) {
    const intro = categoryPages.find((p) => p.isIntro);
    if (intro) {
      items.push({
        slug: intro.pathSlug,
        label,
        href: intro.href,
      });
    }
  }

  return items;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
