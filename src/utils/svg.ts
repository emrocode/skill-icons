import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

type XmlDocument = ReturnType<DOMParser['parseFromString']>;
type XmlElement = NonNullable<XmlDocument['documentElement']>;

const UTF8_PREFIX = 'data:image/svg+xml;utf8,';
const BASE64_PREFIX = 'data:image/svg+xml;base64,';
const SKIPPED_ATTRIBUTES = new Set([
  'href',
  'xlink:href',
  'mask',
  'clip-path',
]);

function decodeSvgDataUri(href: string): string | null {
  try {
    if (href.startsWith(UTF8_PREFIX)) {
      return decodeURIComponent(href.slice(UTF8_PREFIX.length));
    }

    if (href.startsWith(BASE64_PREFIX)) {
      return Buffer.from(href.slice(BASE64_PREFIX.length), 'base64')
        .toString('utf8');
    }
  } catch {
    return null;
  }

  return null;
}

function getUrlId(value: string | null): string | null {
  return value?.match(/^url\(#(.+)\)$/)?.[1] ?? null;
}

function getElementSnapshot(
  root: XmlDocument | XmlElement,
  tagName: string,
): XmlElement[] {
  const nodes = root.getElementsByTagName(tagName);
  const snapshot: XmlElement[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes.item(i);
    if (node) snapshot.push(node);
  }

  return snapshot;
}

function collectUrlReferences(document: XmlDocument): Set<string> {
  const references = new Set<string>();

  for (const element of getElementSnapshot(document, '*')) {
    for (const name of ['mask', 'clip-path']) {
      const id = getUrlId(element.getAttribute(name));
      if (id) references.add(id);
    }
  }

  return references;
}

function removeUnusedDefinitions(document: XmlDocument) {
  const references = collectUrlReferences(document);

  for (const tagName of ['clipPath', 'mask']) {
    for (const element of getElementSnapshot(document, tagName)) {
      const id = element.getAttribute('id');
      if (id && !references.has(id)) {
        element.parentNode?.removeChild(element);
      }
    }
  }
}

export function vectorizeNestedSvgs(svg: string): string {
  const parser = new DOMParser();
  const document = parser.parseFromString(svg, 'image/svg+xml');
  const root = document.documentElement;

  if (!root || root.nodeName !== 'svg') return svg;

  for (const image of getElementSnapshot(root, 'image')) {
    const href = image.getAttribute('href') ?? image.getAttribute('xlink:href');
    if (!href) continue;

    const nestedSvg = decodeSvgDataUri(href);
    if (!nestedSvg) continue;

    const nestedDocument = parser.parseFromString(
      nestedSvg,
      'image/svg+xml',
    );
    const replacementSvg = nestedDocument.documentElement;
    if (!replacementSvg || replacementSvg.nodeName !== 'svg') continue;

    for (let i = 0; i < image.attributes.length; i++) {
      const attribute = image.attributes.item(i);
      if (!attribute || SKIPPED_ATTRIBUTES.has(attribute.name)) continue;
      replacementSvg.setAttribute(attribute.name, attribute.value);
    }

    const importedSvg = document.importNode(replacementSvg, true);
    image.parentNode?.replaceChild(importedSvg, image);
  }

  removeUnusedDefinitions(document);

  return new XMLSerializer().serializeToString(root);
}
