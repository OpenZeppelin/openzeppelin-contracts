const fs = require('fs');
const glob = require('glob');

const { version } = require('../../package.json');

const files = glob.sync('contracts/!(mocks)/**/*.sol');

for (const file of files) {
  const current = fs.readFileSync(file, 'utf8');
  const updated = current.replace(
    /(\/\/ SPDX-License-Identifier:.*)$(\n\/\/ OpenZeppelin Contracts v.*$)?/m,
    `$1\n// OpenZeppelin Contracts v${version} (${file.replace('contracts/', '')})`,
  );
  fs.writeFileSync(file, updated);
}
