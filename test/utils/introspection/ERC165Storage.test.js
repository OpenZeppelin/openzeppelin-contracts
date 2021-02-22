const { expectRevert } = require('@openzeppelin/test-helpers');

const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165Mock = artifacts.require('ERC165StorageMock');

contract('ERC165Storage', function (accounts) {
  beforeEach(async function () {
    this.mock = await ERC165Mock.new();
  });

  it('register interface', async function () {
    expect(await this.mock.supportsInterface('0x00000001')).to.be.equal(false);
    await this.mock.registerInterface('0x00000001');
    expect(await this.mock.supportsInterface('0x00000001')).to.be.equal(true);
  });

  it('does not allow 0xffffffff', async function () {
    await expectRevert(this.mock.registerInterface('0xffffffff'), 'ERC165: invalid interface id');
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
