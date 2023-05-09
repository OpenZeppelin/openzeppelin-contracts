const { expectRevert } = require('@openzeppelin/test-helpers');

const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165Storage = artifacts.require('$ERC165Storage');

contract('ERC165Storage', function () {
  beforeEach(async function () {
    this.mock = await ERC165Storage.new();
  });

  it('register interface', async function () {
    expect(await this.mock.supportsInterface('0x00000001')).to.be.equal(false);
    await this.mock.$_registerInterface('0x00000001');
    expect(await this.mock.supportsInterface('0x00000001')).to.be.equal(true);
  });

  it('does not allow 0xffffffff', async function () {
    await expectRevert(this.mock.$_registerInterface('0xffffffff'), 'ERC165: invalid interface id');
  });

  shouldSupportInterfaces(['ERC165']);
});
