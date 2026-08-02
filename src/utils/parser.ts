export function parseSlug(slugs: string[]): string {
  const now = Date.now();

  if (!slugs.length) return `i..${now}.svg`;
  if (slugs.length === 1) return `${slugs[0]}.svg`;

  const first = slugs[0];
  const last = slugs.at(-1);

  return `${first}..${last}.svg`;
}
