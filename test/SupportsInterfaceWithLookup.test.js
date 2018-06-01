import makeInterfaceId from './helpers/makeInterfaceId';

const SupportsInterfaceWithLookup = artifacts.require('SupportsInterfaceWithLookup.sol');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('SupportsInterfaceWithLookup', function (accounts) {
  before(async function () {
    this.mock = await SupportsInterfaceWithLookup.new();
  });

  it('should support supportsInterface()', async function () {
    await this.mock.supportsInterface(
      makeInterfaceId([
        'supportsInterface(bytes4)',
      ])
    ).should.eventually.eq(true);
  });
});
