const { constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const StringsMock = artifacts.require('StringsMock');

contract('Strings', function (accounts) {
  beforeEach(async function () {
    this.strings = await StringsMock.new();
  });

  describe('from uint256', function () {
    it('converts 0', async function () {
      expect(await this.strings.fromUint256(0)).to.equal('0');
    });

    it('converts a positive number', async function () {
      expect(await this.strings.fromUint256(4132)).to.equal('4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.fromUint256(constants.MAX_UINT256)).to.equal(constants.MAX_UINT256.toString());
    });
  });
});
