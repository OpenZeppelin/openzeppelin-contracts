const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165Mock = artifacts.require('ERC165Mock');

contract('ERC165', function (accounts) {
  beforeEach(async function () {
    this.mock = await ERC165Mock.new();
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
