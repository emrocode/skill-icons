import * as exec from '@actions/exec';

export async function commitChanges(
  filename: string,
  path: string,
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

    await exec.exec('git', ['add', filename]);
    await exec.exec('git', ['add', path]);

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
