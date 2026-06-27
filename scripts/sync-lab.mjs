#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {mirrorMarkdownDir, repoRoot, resolveKnowledgeBaseRoot} from './lib.mjs';

const dest = path.join(repoRoot, 'content/lab');
const src = path.join(resolveKnowledgeBaseRoot(), 'docs/lab');

if (fs.existsSync(dest)) {
  fs.rmSync(dest, {recursive: true, force: true});
}
fs.mkdirSync(dest, {recursive: true});
const count = mirrorMarkdownDir(src, dest, {copyCategory: true});
console.log(`sync-lab: ${count} files → content/lab`);
