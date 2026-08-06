import * as exec from '@actions/exec';
import fs from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_FILENAME = '.skill-icons.json';

async function loadGeneratedFiles(outPath: string): Promise<string[]> {
  const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
  const manifestPath = path.resolve(rootDir, outPath, MANIFEST_FILENAME);

  try {
    const rawManifest = await fs.readFile(manifestPath, 'utf-8');
    const parsedManifest = JSON.parse(rawManifest);
    return Array.isArray(parsedManifest.generatedFiles)
      ? parsedManifest.generatedFiles
      : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function cleanup(outPath: string) {
  const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
  const outDirPath = path.resolve(rootDir, outPath);
  const generatedFiles = await loadGeneratedFiles(outPath);

  const deleteTasks = generatedFiles
    .map(filePath => path.resolve(rootDir, filePath))
    .filter(fullPath => fullPath.startsWith(outDirPath + path.sep))
    .map(fullPath => fs.rm(fullPath, { force: true }));

  await Promise.all(deleteTasks);
}

export async function generateManifest(
  outPath: string,
  generatedFiles: string[],
) {
  const rootDir = process.env.GITHUB_WORKSPACE || process.cwd();
  const manifestPath = path.resolve(rootDir, outPath, MANIFEST_FILENAME);
  const outDirPath = path.dirname(manifestPath);
  const manifest = { generatedFiles: Array.from(new Set(generatedFiles)) };

  await fs.mkdir(outDirPath, { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

export async function commitChanges(
  { filename, outPath, gcmsg }: {
    filename: string;
    outPath: string;
    gcmsg: string;
  },
) {
  try {
    await exec.exec('git', [
      'config',
      '--global',
      'user.name',
      'github-actions[bot]',
    ]);
    await exec.exec('git', [
      'config',
      '--global',
      'user.email',
      'github-actions[bot]@users.noreply.github.com',
    ]);

    await exec.exec('git', ['add', filename]);
    await exec.exec('git', ['add', '-A', outPath]);

    const { exitCode } = await exec.getExecOutput('git', [
      'diff',
      '--cached',
      '--quiet',
    ], { ignoreReturnCode: true });

    if (exitCode === 1) {
      const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
      await exec.exec('git', ['commit', '-m', gcmsg]);
      await exec.exec('git', ['push', 'origin', `HEAD:${branch}`]);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
