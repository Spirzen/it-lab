import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');

export function resolveKnowledgeBaseRoot() {
  const fromEnv = process.env.IT_KB_ROOT;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return path.resolve(fromEnv);
  }
  const sibling = path.resolve(repoRoot, '../it-knowledge-base');
  if (fs.existsSync(sibling)) {
    return sibling;
  }
  throw new Error(`it-knowledge-base not found. Set IT_KB_ROOT or clone next to repo.`);
}

export function mirrorMarkdownDir(srcDir, destDir, options = {}) {
  const copyCategory = options.copyCategory ?? false;
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source missing: ${srcDir}`);
  }
  fs.mkdirSync(destDir, {recursive: true});
  let copied = 0;
  for (const entry of fs.readdirSync(srcDir, {withFileTypes: true})) {
    if (entry.name === '_category_.json') {
      if (copyCategory) {
        fs.copyFileSync(path.join(srcDir, entry.name), path.join(destDir, entry.name));
      }
      continue;
    }
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copied += mirrorMarkdownDir(src, dest, options);
      continue;
    }
    if (!/\.mdx?$/i.test(entry.name)) {
      continue;
    }
    fs.copyFileSync(src, dest);
    copied += 1;
  }
  return copied;
}
