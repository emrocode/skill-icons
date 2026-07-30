export function createRegex(tag: string) {
  return new RegExp(
    `(<!--\\s*${tag}_START\\s*(.*?)-->)([\\s\\S]*?)(<!--\\s*${tag}_END\\s*-->)`,
    'gi',
  );
}

// multiline md image reference blocks
// (e.g., '[tag_0]: url')
export function createRefRegex(tag: string) {
  return new RegExp(`^\\[${tag}_\\d+\\]:.*$\\n?`, 'gm');
}
