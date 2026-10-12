// Runs every suite co-located with the local Hardhat plugins (`hardhat/<plugin>/test/**/*.test.js`), so the
// `test/` runner picks them up in CI. To be removed if all plugins get extracted.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pluginsDir = path.resolve(import.meta.dirname, '../../hardhat');
const suites = fs
  .readdirSync(pluginsDir, { recursive: true })
  .filter(f => typeof f === 'string' && /(^|[/\\])test[/\\].*\.test\.js$/.test(f));

for (const suite of suites) {
  await import(pathToFileURL(path.join(pluginsDir, suite)).href);
}
