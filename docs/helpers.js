const { version } = require('../package.json');

module.exports = {
  'github-link': (contractPath) => {
    if (typeof contractPath !== 'string') {
      throw new Error('Missing argument');
    }
    return `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v${version}/contracts/${contractPath}`;
  },
};
