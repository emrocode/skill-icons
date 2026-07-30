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
const DEFAULT_ICON_SIZE = 48;
const DEFAULT_PER_ROW = 15;
const DEFAULT_OUT_PATH = '/assets/svgs/';
const DEFAULT_TAG = 'SKILL_ICONS';
const DEFAULT_FILENAME = 'README.md';

export async function run() {
  try {
    const rawIconSize = core.getInput('icon_size', { required: false });
    const rawPerRow = core.getInput('per_row', { required: false });
    const rawOutPath = core.getInput('out_path', { required: false });
    const rawTag = core.getInput('tag', { required: false });
    const rawFilename = core.getInput('filename', { required: false });

    const tag = rawTag || DEFAULT_TAG;
    const filename = rawFilename || DEFAULT_FILENAME;
    const outPath = rawOutPath || DEFAULT_OUT_PATH;

    const readme = await readReadme(filename);
    const list = getListFromReadme(readme, tag);

    const svgs = await Promise.all(
      Object.entries(list).map(([, l]) =>
        generateSvgFile({
          slugs: l.items,
          size: parseInt(rawIconSize) || DEFAULT_ICON_SIZE,
          perRow: parseInt(rawPerRow) || DEFAULT_PER_ROW,
          outPath,
        })
      ),
    );

    const updatedReadme = updateReadmeWithReferences(readme, tag, svgs, list);
    const hasChanged = readme !== updatedReadme;

    if (hasChanged) {
      await writeReadme(updatedReadme, filename);
    }

    core.setOutput('list', list);
    // * 'updated' ignores icon options
    // only tracks markdown changes or custom out_path
    core.setOutput('updated', hasChanged);
    core.setOutput('path', outPath);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
