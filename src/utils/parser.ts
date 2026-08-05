import { createHash } from 'node:crypto';

function getSlugHash(slugs: string[]) {
  return createHash('sha1').update(slugs.join(',')).digest('hex').slice(0, 7);
}

export function parseSlug(slugs: string[]): string | null {
  if (!slugs.length) return null;
  if (slugs.length === 1) return `${slugs[0]}-${getSlugHash(slugs)}.svg`;

  const first = slugs[0];
  const last = slugs.at(-1);

  return `${first}..${last}-${getSlugHash(slugs)}.svg`;
}
