const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165 = artifacts.require('XERC165');

contract('ERC165', function (accounts) {
  beforeEach(async function () {
    this.mock = await ERC165.new();
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
