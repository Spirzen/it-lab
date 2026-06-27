import {remark} from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

const processor = remark().use(remarkGfm).use(remarkHtml, {sanitize: false});

export async function renderMarkdownToHtml(markdown) {
  if (!markdown?.trim()) {
    return '';
  }
  const file = await processor.process(markdown);
  return String(file);
}
