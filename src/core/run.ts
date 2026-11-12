import { cleanup, commitChanges, generateManifest } from '@/utils/commit.js';
import {
  getListFromReadme,
  readReadme,
  updateReadmeWithReferences,
  writeReadme,
} from '@/utils/readme.js';
import * as core from '@actions/core';
import { generateSvgFile } from './gen.js';

// options
// TODO: allow each delimiter to parse its own isolated options
const DEFAULTS = {
  ICON_SIZE: 48,
  PER_ROW: 15,
  OUT_PATH: 'assets/svgs',
  TAG: 'SKILL_ICONS',
  FILENAME: 'README.md',
  GCMSG: 'chore(si): update assets and docs',
};

// positive integer input or default
function getIntInput(name: string, fallback: number): number {
  const raw = core.getInput(name, { required: false }).trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (Number.isInteger(value) && value > 0) return value;

  core.warning(
    `[${name}] must be a positive integer, received "${raw}". Using default ${fallback}.`,
  );
  return fallback;
}

export async function run() {
  try {
    const rawOutPath = core.getInput('out_path', { required: false });
    const rawTag = core.getInput('tag', { required: false });
    const rawFilename = core.getInput('filename', { required: false });
    const rawGcmsg = core.getInput('commit_message', { required: false });

    const tag = rawTag || DEFAULTS.TAG;
    const filename = rawFilename || DEFAULTS.FILENAME;
    const outPath = rawOutPath || DEFAULTS.OUT_PATH;
    const gcmsg = rawGcmsg || DEFAULTS.GCMSG;
    const iconSize = getIntInput('icon_size', DEFAULTS.ICON_SIZE);
    const perRow = getIntInput('per_row', DEFAULTS.PER_ROW);

    const readme = await readReadme(filename);
    const list = getListFromReadme(readme, tag);

    await cleanup(outPath);

    const svgs = await Promise.all(
      Object.entries(list).map(([, l]) =>
        generateSvgFile({
          slugs: l.items,
          size: iconSize,
          perRow,
          outPath,
        })
      ),
    );

    await generateManifest(
      outPath,
      svgs.filter((svg): svg is string => Boolean(svg)),
    );

    const newReadme = updateReadmeWithReferences({
      content: readme,
      tag,
      svgPaths: svgs,
      list,
    });

    if (readme !== newReadme) {
      await writeReadme(newReadme, filename);
    }

    if (process.env.GITHUB_ACTIONS === 'true') {
      await commitChanges({ filename, outPath, gcmsg });
    }

    core.setOutput('list', list);
    // * 'updated' ignores icon options
    // only tracks markdown changes or custom out_path
    core.setOutput('updated', readme !== newReadme);
    core.setOutput('path', outPath);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
