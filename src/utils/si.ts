import * as si from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import { slugToVariableName } from 'simple-icons/sdk';

function isSimpleIcon(obj: unknown): obj is SimpleIcon {
  return (
    typeof obj === 'object' && obj !== null && 'path' in obj
  );
}

export function getIcon(slug: string): SimpleIcon {
  const name = slugToVariableName(slug) as keyof typeof si;
  const icon = si[name];

  if (!isSimpleIcon(icon)) {
    throw new Error(`[${slug}] not found in the simpleicons catalog`);
  }

  return icon;
}
