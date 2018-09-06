const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');
const { assertRevert } = require('../helpers/assertRevert');

const ERC165 = artifacts.require('ERC165Mock');

require('chai')
  .should();

contract('ERC165', function () {
  beforeEach(async function () {
    this.mock = await ERC165.new();
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
