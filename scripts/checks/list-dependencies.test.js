import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('list-dependencies follows both Solidity quote styles and import forms', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oz-imports-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'contracts'));
  const sources = {
    'Imported.sol': 'contract Imported {}',
    'Single.sol': "import './Imported.sol';",
    'Named.sol': "import {Imported} from './Imported.sol';",
    'Namespace.sol': "import * as Namespace from './Imported.sol';",
    'Double.sol': 'import "./Imported.sol";',
    'BlockComment.sol': `import /* 'note'; */ "./Imported.sol";`,
    'LineComment.sol': `import // "note"
      './Imported.sol';`,
    "O'Reilly.sol": 'contract Apostrophe {}',
    'ApostrophePath.sol': `import "./O'Reilly.sol";`,
  };
  const unaffected = {
    'CommentedOut.sol': `/*
      import "./Imported.sol";
    */`,
    'StringLiteral.sol': `contract StringLiteral { string constant text = "import './Imported.sol';"; }`,
  };
  for (const [name, source] of Object.entries({ ...sources, ...unaffected })) {
    fs.writeFileSync(path.join(root, 'contracts', name), source);
  }
  const script = fileURLToPath(new URL('../list-dependencies.js', import.meta.url));
  const output = execFileSync(process.execPath, [script, `--root=${root}`, '--src=contracts', '--ext=.sol'], {
    input: ['Imported.sol', "O'Reilly.sol"].map(name => path.join('contracts', name)).join('\n'),
    encoding: 'utf8',
  });
  assert.deepEqual(
    JSON.parse(output).sort(),
    Object.keys(sources)
      .map(name => path.join('contracts', name))
      .sort(),
  );
});
