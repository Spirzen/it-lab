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
import {buildPortalCardListHtml, extractTocFromMarkdown, sortByDocPath, compareByDocPath, categoryOrderKey} from '../markdown/shared.mjs';

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

  pages.sort(compareByDocPath);

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

  const toc = extractTocFromMarkdown(markdown);

  return {
    ...page,
    pathSlug: page.pathSegments.join('/'),
    bodyHtml: await renderMarkdownToHtml(markdown),
    relatedLinks: buildRelatedLinks(page.related),
    breadcrumbs: buildBreadcrumbs(page),
    toc,
  };
}

function buildBreadcrumbs(page) {
  const crumbs = [{label: 'Лаборатория', href: '/lab/intro'}];
  if (page.categoryLabel && page.href !== '/lab/intro') {
    crumbs.push({
      label: page.categoryLabel,
      href: `/lab/${page.categoryLabel}/intro`,
    });
  }
  if (!page.isIntro || page.pathSegments.length > 1) {
    crumbs.push({label: page.title, href: page.href, current: true});
  } else if (page.href === '/lab/intro') {
    crumbs[0].current = true;
  }
  return crumbs;
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

  sortByDocPath(items);
  if (items.length === 0) {
    return '';
  }

  const cards = items.slice(0, 24).map((item) => ({
    title: item.title,
    description: item.description,
    href: item.href,
  }));

  return buildPortalCardListHtml(cards);
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
    items.push({type: 'link', slug: 'intro', label: 'О разделе', href: '/lab/intro'});
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
    categoryOrderKey(a[1]).localeCompare(categoryOrderKey(b[1]), 'ru'),
  )) {
    const intro = categoryPages.find((p) => p.isIntro);
    const children = sortByDocPath(categoryPages.filter((p) => !p.isIntro)).map((p) => ({
        slug: p.pathSlug,
        label: p.title,
        href: p.href,
      }));

    items.push({
      type: 'category',
      slug: intro?.pathSlug ?? label,
      label,
      href: intro?.href ?? `/lab/${label}/intro`,
      children,
    });
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
