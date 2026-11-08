import assert from 'node:assert/strict';
import proc from 'node:child_process';
import fs from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packagePath = fileURLToPath(new URL('../package.json', import.meta.url));
const script = new URL('./update-docs-branch.js', import.meta.url);

for (const [current, published, shouldPublish] of [
  ['5.10.0', '5.9.0', true],
  ['5.9.0', '5.10.0', false],
  ['5.10.1', '5.10.0', true],
]) {
  test(`docs ${current} after ${published}`, async t => {
    const commands = [];
    const readFileSync = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', (file, ...args) =>
      file === packagePath ? JSON.stringify({ version: current }) : readFileSync(file, ...args),
    );
    t.mock.method(proc, 'execSync', command => {
      commands.push(command);
      if (command === 'git rev-parse --abbrev-ref HEAD') return `release-v${current}`;
      if (command === "git rev-parse --glob='*/docs-v5.x'") return 'published-ref';
      if (command === 'git show published-ref:package.json') return JSON.stringify({ version: published });
      return '';
    });
    const exit = new Error('exit');
    t.mock.method(process, 'exit', code => {
      assert.equal(code, 0);
      throw exit;
    });
    t.mock.method(console, 'error', () => {});

    const run = import(`${script.href}?version=${current}-${published}`);
    if (shouldPublish) await run;
    else await assert.rejects(run, error => error === exit);
    assert.equal(commands.includes('npm run prepare-docs'), shouldPublish);
  });
}
