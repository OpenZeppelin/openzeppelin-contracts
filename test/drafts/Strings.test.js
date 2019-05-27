const { constants } = require('openzeppelin-test-helpers');

const StringsMock = artifacts.require('StringsMock');

contract('Strings', function () {
  beforeEach(async function () {
    this.strings = await StringsMock.new();
  });

  describe('from uint256', function () {
    it('converts 0', async function () {
      (await this.strings.uint256ToString(0)).should.equal('0');
    });

    it('converts a positive number', async function () {
      (await this.strings.uint256ToString(4132)).should.equal('4132');
    });

    it('converts MAX_UINT256', async function () {
      (await this.strings.uint256ToString(constants.MAX_UINT256)).should.equal(constants.MAX_UINT256.toString());
    });
  });
});
