export { main as docgen } from './main';
export { docItemTypes } from './doc-item';
export { DocItemWithContext } from './site';

import './hardhat/type-extensions';

if ('extendConfig' in global && 'task' in global) {
  // Assume Hardhat.
  require('./hardhat');
}

// We ask Node.js not to cache this file.
delete require.cache[__filename];
