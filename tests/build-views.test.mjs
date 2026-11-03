import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('view artifacts are identical for LF, CRLF and mixed source checkouts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gymdo-views-'));
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'src/views'), { recursive: true });
    const script = join(root, 'scripts/build-views.mjs');
    await writeFile(script, await readFile(new URL('../scripts/build-views.mjs', import.meta.url)));
    const outputs = [];
    for (const [shellEnding, viewEnding] of [['\n', '\n'], ['\r\n', '\r\n'], ['\r\n', '\n']]) {
      await writeFile(join(root, 'src/views/shell.html'), ['<main>', '<!-- view:entry -->', '</main>', ''].join(shellEnding));
      await writeFile(join(root, 'src/views/entry.html'), ['<section>', '<p>Keep inline spaces', 'and prose.</p>', '</section>', ''].join(viewEnding));
      execFileSync(process.execPath, [script], { stdio: 'pipe' });
      outputs.push(await Promise.all(['app-body.html', 'ui.html'].map(name => readFile(join(root, name), 'utf8'))));
    }
    assert.deepEqual(outputs[1], outputs[0]);
    assert.deepEqual(outputs[2], outputs[0]);
    assert.match(outputs[0][1], /Keep inline spaces\r\nand prose\./);
  } finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.match(basename(root), /^gymdo-views-/);
    await rm(root, { recursive: true, force: true });
  }
});
