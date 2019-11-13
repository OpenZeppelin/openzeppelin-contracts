const { load } = require('@openzeppelin/test-env');
const { expectRevert } = require('@openzeppelin/test-helpers');

const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const ERC165Mock = load.fromArtifacts('ERC165Mock');

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
