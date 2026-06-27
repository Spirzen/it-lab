import fs from 'node:fs';
import path from 'node:path';

const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|ico)$/i;

export function mirrorAssetsDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return 0;
  }
  fs.mkdirSync(destDir, {recursive: true});
  let copied = 0;
  for (const entry of fs.readdirSync(srcDir, {withFileTypes: true})) {
    if (entry.name === '_category_.json') {
      continue;
    }
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copied += mirrorAssetsDir(src, dest);
      continue;
    }
    if (!ASSET_RE.test(entry.name)) {
      continue;
    }
    fs.copyFileSync(src, dest);
    copied += 1;
  }
  return copied;
}
