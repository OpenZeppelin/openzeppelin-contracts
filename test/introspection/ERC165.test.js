const { shouldFail } = require('openzeppelin-test-helpers');
const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165Mock = artifacts.require('ERC165Mock');

contract('ERC165', function () {
  beforeEach(async function () {
    this.mock = await ERC165Mock.new();
  });

  it('does not allow 0xffffffff', async function () {
    await shouldFail.reverting.withMessage(this.mock.registerInterface('0xffffffff'), 'ERC165: invalid interface id');
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
