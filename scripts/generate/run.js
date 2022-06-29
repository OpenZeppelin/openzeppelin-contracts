#!/usr/bin/env node

const fs = require('fs');
const format = require('./format-lines');

function getVersion (path) {
  try {
    return fs
      .readFileSync(path, 'utf8')
      .match(/\/\/ OpenZeppelin Contracts \(last updated v[^)]+\)/)[0];
  } catch (err) {
    return null;
  }
}

for (const [ file, template ] of Object.entries({
  'utils/math/SafeCast.sol': './templates/SafeCast',
  'mocks/SafeCastMock.sol': './templates/SafeCastMock',
})) {
  const path = `./contracts/${file}`;
  const version = getVersion(path);
  const content = format(
    '// SPDX-License-Identifier: MIT',
    (version ? version + ` (${file})\n` : ''),
    require(template).trimEnd(),
  );

  fs.writeFileSync(path, content);
}
