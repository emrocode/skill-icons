import { getBackgroundColor, getContrastColor } from '@/utils/color.js';
import { parseSlug } from '@/utils/parser.js';
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
  const snapToPx = (value: number) => Math.round(value);

  const filename = parseSlug(slugs);
  if (!filename) return null;

  const dir = path.join(process.cwd(), outPath);

  await fs.mkdir(dir, { recursive: true });

  const siIcons = slugs.map(i => getIcon(i));
  const iconSize = snapToPx(size * 0.8);
  const gap = snapToPx(size / 6);
  const borderRadius = snapToPx(size / 6);

  const iconEl = siIcons.map(icon => ({
    type: 'div',
    props: {
      style: {
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: getBackgroundColor(getContrastColor('#' + icon.hex)),
        borderRadius,
      },
      children: {
        type: 'svg',
        props: {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 24 24',
          width: iconSize,
          height: iconSize,
          fill: getContrastColor('#' + icon.hex),
          children: {
            type: 'path',
            props: {
              d: icon.path,
            },
          },
        },
      },
    },
  }));

  const el = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: gap,
        rowGap: gap,
      },
      children: iconEl,
    },
  };

  const totalItems = slugs.length;
  const cols = Math.min(totalItems, perRow);
  const rows = Math.ceil(totalItems / perRow);

  const rawSvg = await satori(el, {
    width: cols * size + Math.max(0, cols - 1) * gap,
    height: rows * size + Math.max(0, rows - 1) * gap,
    pointScaleFactor: 2,
    fonts: [],
  });

  const { data: svg } = optimize(rawSvg, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupNumericValues: { floatPrecision: 2 },
            convertPathData: { floatPrecision: 2 },
          },
        },
      },
      'reusePaths',
    ],
  });

  await fs.writeFile(path.join(dir, filename), svg, 'utf-8');

  // return svgs location
  // needed to replace in readme
  return path.posix.join(outPath, filename);
}
