import * as exec from '@actions/exec';
import fs from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_FILENAME = '.skill-icons.json';

async function loadGeneratedFiles(outPath: string) {
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

  for (const filePath of generatedFiles) {
    const absoluteFilePath = path.resolve(rootDir, filePath);
    const isInsideOutPath = absoluteFilePath.startsWith(outDirPath + path.sep);

    if (!isInsideOutPath) {
      continue;
    }

    await fs.rm(absoluteFilePath, { force: true });
  }
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
  filename: string,
  outPath: string,
  gcmsg: string,
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

    const generatedFiles = await loadGeneratedFiles(outPath);
    const manifestPath = path.join(outPath, MANIFEST_FILENAME);
    const filesToStage = [filename, manifestPath, ...generatedFiles];

    for (const filePath of filesToStage) {
      await exec.exec('git', ['add', '-A', '--', filePath]);
    }

    const { exitCode } = await exec.getExecOutput('git', [
      'diff',
      '--cached',
      '--quiet',
    ], { ignoreReturnCode: true });

    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;

    if (exitCode === 1) {
      await exec.exec('git', ['commit', '-m', gcmsg]);
      await exec.exec('git', ['push', 'origin', `HEAD:${branch}`]);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
