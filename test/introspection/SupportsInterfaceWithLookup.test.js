import shouldSupportInterfaces from './SupportsInterface.behavior';

const SupportsInterfaceWithLookup = artifacts.require('SupportsInterfaceWithLookup.sol');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('SupportsInterfaceWithLookup', function (accounts) {
  before(async function () {
    this.mock = await SupportsInterfaceWithLookup.new();
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
