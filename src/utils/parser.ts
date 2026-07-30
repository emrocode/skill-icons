export function parse(rawJson: string, data: Record<string, any>): any {
  if (Array.isArray(data)) {
    return data.map((item) => parse(rawJson, item));
  }

  let content = rawJson;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;

    if (typeof value === 'object' && value !== null) {
      content = content.replaceAll(`"${placeholder}"`, JSON.stringify(value));
      content = content.replaceAll(placeholder, JSON.stringify(value));
    } else {
      content = content.replaceAll(placeholder, String(value));
    }
  }

  return JSON.parse(content);
}

export function parseSlug(slugs: string[]): string {
  const now = Date.now();

  if (!slugs.length) return `i..${now}.svg`;
  if (slugs.length === 1) return `${slugs[0]}.svg`;

  const first = slugs[0];
  const last = slugs.at(-1);

  return `${first}..${last}.svg`;
}
