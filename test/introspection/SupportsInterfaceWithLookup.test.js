import shouldSupportInterfaces from './SupportsInterface.behavior';
import assertRevert from '../helpers/assertRevert';

const SupportsInterfaceWithLookup = artifacts.require('SupportsInterfaceWithLookupMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('SupportsInterfaceWithLookup', function (accounts) {
  before(async function () {
    this.mock = await SupportsInterfaceWithLookup.new();
  });

  it('does not allow 0xffffffff', async function () {
    await assertRevert(
      this.mock.registerInterface(0xffffffff)
    );
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
