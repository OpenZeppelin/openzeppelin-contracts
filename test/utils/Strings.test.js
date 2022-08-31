const { constants, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const Strings = artifacts.require('$Strings');

contract('Strings', function (accounts) {
  beforeEach(async function () {
    this.strings = await Strings.new();
  });

  describe('from uint256 - decimal format', function () {
    it('converts 0', async function () {
      expect(await this.strings.methods['$toString(uint256)'](0)).to.equal('0');
    });

    it('converts a positive number', async function () {
      expect(await this.strings.methods['$toString(uint256)'](4132)).to.equal('4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['$toString(uint256)'](constants.MAX_UINT256))
        .to.equal(constants.MAX_UINT256.toString());
    });
  });

  describe('from uint256 - hex format', function () {
    it('converts 0', async function () {
      expect(await this.strings.methods['$toHexString(uint256)'](0)).to.equal('0x00');
    });

    it('converts a positive number', async function () {
      expect(await this.strings.methods['$toHexString(uint256)'](0x4132)).to.equal('0x4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['$toHexString(uint256)'](constants.MAX_UINT256))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('from uint256 - fixed hex format', function () {
    it('converts a positive number (long)', async function () {
      expect(await this.strings.methods['$toHexString(uint256,uint256)'](0x4132, 32))
        .to.equal('0x0000000000000000000000000000000000000000000000000000000000004132');
    });

    it('converts a positive number (short)', async function () {
      await expectRevert(
        this.strings.methods['$toHexString(uint256,uint256)'](0x4132, 1),
        'Strings: hex length insufficient',
      );
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['$toHexString(uint256,uint256)'](constants.MAX_UINT256, 32))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('from address - fixed hex format', function () {
    it('converts a random address', async function () {
      const addr = '0xa9036907dccae6a1e0033479b12e837e5cf5a02f';
      expect(await this.strings.methods['$toHexString(address)'](addr)).to.equal(addr);
    });

    it('converts an address with leading zeros', async function () {
      const addr = '0x0000e0ca771e21bd00057f54a68c30d400000000';
      expect(await this.strings.methods['$toHexString(address)'](addr)).to.equal(addr);
    });
  });
});
