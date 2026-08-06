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

export async function run() {
  try {
    const rawIconSize = core.getInput('icon_size', { required: false });
    const rawPerRow = core.getInput('per_row', { required: false });
    const rawOutPath = core.getInput('out_path', { required: false });
    const rawTag = core.getInput('tag', { required: false });
    const rawFilename = core.getInput('filename', { required: false });
    const rawGcmsg = core.getInput('commit_message', { required: false });

    const tag = rawTag || DEFAULTS.TAG;
    const filename = rawFilename || DEFAULTS.FILENAME;
    const outPath = rawOutPath || DEFAULTS.OUT_PATH;
    const gcmsg = rawGcmsg || DEFAULTS.GCMSG;

    const readme = await readReadme(filename);
    const list = getListFromReadme(readme, tag);

    await cleanup(outPath);

    const svgs = await Promise.all(
      Object.entries(list).map(([, l]) =>
        generateSvgFile({
          slugs: l.items,
          size: parseInt(rawIconSize) || DEFAULTS.ICON_SIZE,
          perRow: parseInt(rawPerRow) || DEFAULTS.PER_ROW,
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
