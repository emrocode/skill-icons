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

    const { stdout } = await exec.getExecOutput('git', [
      'status',
      '--porcelain',
    ]);

    if (stdout.trim() !== '') {
      await exec.exec('git', ['commit', '-m', gcmsg]);
      await exec.exec('git', ['push']);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
