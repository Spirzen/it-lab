import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export {parseLabMarkdownFile, listMarkdownFilesRecursive, slugToPathSegments, pathSegmentsToHref, readCategoryLabel};

const SPIRZEN_BASE = 'https://spirzen.ru';
const TERMS_BASE = 'https://terms.spirzen.ru';

function listMarkdownFilesRecursive(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFilesRecursive(full, baseDir));
      continue;
    }
    if (/\.mdx?$/i.test(entry.name)) {
      files.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return files.sort((a, b) => a.localeCompare(b, 'ru'));
}

function slugToPathSegments(slug) {
  const normalized = String(slug ?? '')
    .replace(/^\/lab\/?/, '')
    .replace(/\/$/, '');
  if (!normalized) {
    return ['intro'];
  }
  return normalized.split('/').filter(Boolean);
}

function pathSegmentsToHref(segments) {
  return `/lab/${segments.join('/')}`;
}

function readCategoryLabel(relDir, contentRoot) {
  if (!relDir || relDir === '.') {
    return null;
  }
  const categoryPath = path.join(contentRoot, relDir, '_category_.json');
  if (!fs.existsSync(categoryPath)) {
    return null;
  }
  try {
    const json = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
    return json.label ?? null;
  } catch {
    return null;
  }
}

function resolveSlugFromFile(data, relPath, contentRoot) {
  if (data.slug) {
    return String(data.slug).replace(/\/$/, '');
  }
  const parts = relPath.replace(/\.mdx?$/i, '').split('/');
  const id = parts.at(-1) ?? 'intro';
  if (parts.length === 1) {
    return id === 'intro' ? '/lab/intro' : `/lab/${id}`;
  }
  const categoryLabel = readCategoryLabel(path.dirname(relPath), contentRoot);
  if (categoryLabel) {
    return `/lab/${categoryLabel}/${id}`;
  }
  return `/lab/${parts.at(-2)}/${id}`;
}

function parseLabMarkdownFile(filePath, contentRoot) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const {data, content} = matter(raw);
  const relPath = path.relative(contentRoot, filePath).replace(/\\/g, '/');
  const slug = resolveSlugFromFile(data, relPath, contentRoot);
  const pathSegments = slugToPathSegments(slug);

  return {
    relPath,
    fileName: path.basename(filePath),
    slug,
    pathSegments,
    href: pathSegmentsToHref(pathSegments),
    title: data.title ?? data.sidebar_label ?? pathSegments.at(-1) ?? 'Лаборатория',
    description: data.description ?? '',
    sidebarLabel: data.sidebar_label ?? data.title ?? pathSegments.at(-1) ?? '',
    related: Array.isArray(data.related) ? data.related : [],
    bodyMarkdown: prepareLabBody(content),
    categoryLabel: pathSegments.length > 1 ? pathSegments[0] : null,
    isIntro: pathSegments.at(-1) === 'intro' || slug === '/lab/intro',
  };
}

function prepareLabBody(content) {
  let body = content;
  body = body.replace(/import\s+[\s\S]*?from\s+['"]@theme\/[^'"]+['"];?\s*/g, '');
  body = body.replace(/import\s+[\s\S]*?from\s+['"]@site\/[^'"]+['"];?\s*/g, '');
  body = transformPlayEmbeds(body);
  body = transformCodeEmbeds(body);
  body = transformLabTrainersHub(body);
  body = body.replace(/<DocCardList\s*\/>/g, '<!-- DOC_CARD_LIST -->');
  body = stripRemainingJsx(body);
  body = stripArticleTags(body);
  body = fixCrossPortalLinks(body);
  return body.trim();
}

function transformPlayEmbeds(content) {
  return content.replace(/<ExternalPlayEmbed\s+([\s\S]*?)\/>/g, (_, attrs) => {
    const example = readAttr(attrs, 'example');
    const src = readAttr(attrs, 'src');
    const title = readAttr(attrs, 'title');
    const minHeight = readAttr(attrs, 'minHeight', {jsx: true}) ?? '320';
    const playProps = readPlayProps(attrs);
    const propsJson = escapeAttr(JSON.stringify(playProps));
    return [
      `<div class="itu-play-embed"`,
      `data-example="${escapeAttr(example)}"`,
      `data-src="${escapeAttr(src)}"`,
      `data-title="${escapeAttr(title)}"`,
      `data-min-height="${escapeAttr(minHeight)}"`,
      `data-play-props="${propsJson}">`,
      `</div>`,
    ].join(' ');
  });
}

function transformCodeEmbeds(content) {
  return content.replace(/<ExternalCodeEmbed\s+([\s\S]*?)\/>/g, (_, attrs) => {
    const example = readAttr(attrs, 'example');
    const title = readAttr(attrs, 'title');
    const minHeight = readAttr(attrs, 'minHeight', {jsx: true}) ?? '280';
    return [
      `<div class="itu-code-embed"`,
      `data-example="${escapeAttr(example)}"`,
      `data-title="${escapeAttr(title)}"`,
      `data-min-height="${escapeAttr(minHeight)}">`,
      `</div>`,
    ].join(' ');
  });
}

function transformLabTrainersHub(content) {
  return content.replace(/<LabTrainersHub\s*\/>/g, '<div class="itu-trainers-hub"></div>');
}

function readAttr(attrs, name, options = {}) {
  const quoted = new RegExp(`${name}=["']([^"']*)["']`).exec(attrs);
  if (quoted) {
    return quoted[1];
  }
  if (options.jsx) {
    const jsx = new RegExp(`${name}=\\{(\\d+)\\}`).exec(attrs);
    if (jsx) {
      return jsx[1];
    }
  }
  return '';
}

function readPlayProps(attrs) {
  const match = /playProps=\{\{([\s\S]*?)\}\}/.exec(attrs);
  if (!match) {
    return {};
  }
  const props = {};
  for (const part of match[1].split(',')) {
    const kv = /(\w+)\s*:\s*['"]([^'"]*)['"]/.exec(part.trim());
    if (kv) {
      props[kv[1]] = kv[2];
    }
  }
  return props;
}

function stripRemainingJsx(content) {
  return content.replace(/<[A-Z][A-Za-z0-9]*[^>]*\/>/g, '');
}

function stripArticleTags(content) {
  const lines = content.split(/\r?\n/);
  const kept = [];
  let inTags = false;
  for (const line of lines) {
    if (/^<div class="article-tags">/.test(line)) {
      inTags = true;
      continue;
    }
    if (inTags) {
      if (/<\/div>/.test(line)) {
        inTags = false;
      }
      continue;
    }
    kept.push(line);
  }
  return kept.join('\n');
}

function fixCrossPortalLinks(content) {
  let body = content;
  body = body.replace(/\]\(\/encyclopedia\//g, `](${SPIRZEN_BASE}/encyclopedia/`);
  body = body.replace(/\]\(\/glossary\//g, `](${TERMS_BASE}/glossary/`);
  body = body.replace(/\]\(\.\.\/\.\.\/encyclopedia\//g, `](${SPIRZEN_BASE}/encyclopedia/`);
  body = body.replace(/\]\(\.\.\/encyclopedia\//g, `](${SPIRZEN_BASE}/encyclopedia/`);
  body = body.replace(/\]\(\.\.\/glossary\//g, `](${TERMS_BASE}/glossary/`);
  body = body.replace(/\]\(\.\.\/\.\.\/glossary\//g, `](${TERMS_BASE}/glossary/`);
  return body;
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
