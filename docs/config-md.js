const path = require('path');
const fs = require('fs');

/** @type import('solidity-docgen/dist/config').UserConfig */
module.exports = {
  outputDir: 'docs/modules/api/pages',
  templates: 'docs/templates-md',
  exclude: ['mocks'],
  pageExtension: '.mdx',
  pages: (_, file, config) => {
    const sourcesDir = path.resolve(config.root, config.sourcesDir);
    let dir = path.resolve(config.root, file.absolutePath);
    while (dir.startsWith(sourcesDir)) {
      dir = path.dirname(dir);
      if (fs.existsSync(path.join(dir, 'README.adoc'))) {
        return path.relative(sourcesDir, dir) + config.pageExtension;
      }
    }
  },
};
