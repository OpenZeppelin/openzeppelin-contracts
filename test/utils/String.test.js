const { contract } = require('@openzeppelin/test-environment');
const { constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const StringMock = contract.fromArtifact('StringMock');

describe('String', function () {
  beforeEach(async function () {
    this.string = await StringMock.new();
  });

  describe('from uint256', function () {
    it('converts 0', async function () {
      expect(await this.string.fromUint256(0)).to.equal('0');
    });

    it('converts a positive number', async function () {
      expect(await this.string.fromUint256(4132)).to.equal('4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.string.fromUint256(constants.MAX_UINT256)).to.equal(constants.MAX_UINT256.toString());
    });
  });
});
