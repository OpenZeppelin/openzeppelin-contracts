const { contract } = require('@openzeppelin/test-environment');
const { expectRevert } = require('@openzeppelin/test-helpers');

const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165Mock = contract.fromArtifact('ERC165Mock');

describe('ERC165', function () {
  beforeEach(async function () {
    this.mock = await ERC165Mock.new();
  });

  it('does not allow 0xffffffff', async function () {
    await expectRevert(this.mock.registerInterface('0xffffffff'), 'ERC165: invalid interface id');
  });

  shouldSupportInterfaces([
    'ERC165',
  ]);
});
