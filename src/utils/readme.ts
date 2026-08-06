import fs from 'node:fs/promises';
import path from 'node:path';
import { createRefRegex, createRegex } from './regex.js';

export async function readReadme(fileName: string) {
  const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
  const filePath = path.resolve(rootDir, fileName);
  return await fs.readFile(filePath, 'utf-8');
}

export async function writeReadme(content: string, fileName: string) {
  const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
  const filePath = path.resolve(rootDir, fileName);
  return await fs.writeFile(filePath, content, 'utf-8');
}

export function getListFromReadme(readmeContent: string, tag: string) {
  const regex = createRegex(tag);
  const results = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(readmeContent)) !== null) {
    const tagAttributes = match[2];
    const innerContent = match[3];

    const attrMatch = tagAttributes.match(/icons=["']([^"']+)["']/);

    const rawString = attrMatch
      ? attrMatch[1]
      : innerContent
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/!\[.*?\]\[.*?\]/g, '');

    const items = rawString
      .replace(/\n/g, '')
      .trim()
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    results.push({
      name: `${tag}_${idx}`,
      items,
    });

    idx++;
  }

  return results;
}

export function updateReadmeWithReferences(
  { content, tag, svgPaths, list }: {
    content: string;
    tag: string;
    svgPaths: Array<string | null>;
    list: Array<{ name: string; items: string[] }>;
  },
) {
  const blockRegex = createRegex(tag);
  let idx = 0;
  const references: string[] = [];

  let newReadme = content.replace(blockRegex, () => {
    const group = list[idx];
    const refKey = `${tag}_${idx}`;
    const imagePath = svgPaths[idx];

    if (imagePath) {
      references.push(`[${refKey}]: ${imagePath}`);
    }

    const itemsAttr = group?.items?.length
      ? ` icons="${group.items.join(',')}"`
      : '';

    idx++;

    return `<!-- ${tag}_START${itemsAttr} -->\n${
      imagePath ? `\n![][${refKey}]\n` : ''
    }\n<!-- ${tag}_END -->`;
  });

  const refRegex = createRefRegex(tag);
  newReadme = newReadme.replace(refRegex, '').trimEnd();

  if (references.length === 0) {
    return newReadme;
  }

  return `${newReadme}\n\n${references.join('\n')}\n`;
}
