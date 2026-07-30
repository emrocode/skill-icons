import rawContainer from '@/templates/container.json' with { type: 'json' };
import rawIcon from '@/templates/icon.json' with { type: 'json' };
import { getBackgroundColor, getContrastColor } from '@/utils/color.js';
import { parse, parseSlug } from '@/utils/parser.js';
import { getIcon } from '@/utils/si.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { optimize } from 'svgo';

export async function generateSvgFile({
  slugs,
  size,
  perRow,
  outPath,
}: {
  slugs: string[];
  size: number;
  perRow: number;
  outPath: string;
}) {
  const filename = parseSlug(slugs);
  const dir = path.join(process.cwd(), outPath);

  if (dir) {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
  }

  const siIcons = slugs.map(i => getIcon(i));

  const iconEl = parse(
    JSON.stringify(rawIcon),
    siIcons.map(icon => ({
      size,
      iconSize: size * 0.8,
      bgColor: getBackgroundColor(getContrastColor('#' + icon.hex)),
      borderRadius: size / 6,
      fill: getContrastColor('#' + icon.hex),
      path: icon.path,
    })),
  );

  const el = parse(JSON.stringify(rawContainer), {
    gap: size / 6,
    children: iconEl,
  });

  const totalItems = slugs.length;
  const cols = Math.min(totalItems, perRow);
  const rows = Math.ceil(totalItems / perRow);

  const rawSvg = await satori(el, {
    width: cols * size + (cols - 1) * (size / 6),
    height: rows * size + (rows - 1) * (size / 6),
    fonts: [],
  });

  const { data: svg } = optimize(rawSvg, {
    multipass: true,
    plugins: [
      'preset-default',
      'reusePaths',
    ],
  });

  await fs.writeFile(path.join(dir, filename), svg, 'utf-8');

  // return svgs location
  // needed to replace in readme
  return path.posix.join(outPath, filename);
}
