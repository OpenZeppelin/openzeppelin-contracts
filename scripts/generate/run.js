#!/usr/bin/env node

const fs = require('fs');
const format = require('./format-lines');

function getVersion (path) {
  try {
    return fs
      .readFileSync(path, 'utf8')
      .match(/\/\/ OpenZeppelin Contracts \(last updated v\d+\.\d+\.\d+\)/)[0];
  } catch (err) {
    return null;
  }
}

for (const [ file, template ] of Object.entries({
  // SafeCast
  'utils/math/SafeCast.sol': './templates/SafeCast',
  'mocks/SafeCastMock.sol': './templates/SafeCastMock',
  // EnumerableSet
  'utils/structs/EnumerableSet.sol': './templates/EnumerableSet',
  'mocks/EnumerableSetMock.sol': './templates/EnumerableSetMock',
  // EnumerableMap
  'utils/structs/EnumerableMap.sol': './templates/EnumerableMap',
  'mocks/EnumerableMapMock.sol': './templates/EnumerableMapMock',
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
