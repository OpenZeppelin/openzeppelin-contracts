const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const StringsMock = artifacts.require('StringsMock');

contract('Strings', function (accounts) {
  before(async function () {
    this.strings = await StringsMock.new();
  });

  describe('toString', function () {
    for (const [ key, value ] of Object.entries([
      '0',
      '7',
      '10',
      '99',
      '100',
      '101',
      '123',
      '4132',
      '12345',
      '1234567',
      '1234567890',
      '123456789012345',
      '12345678901234567890',
      '123456789012345678901234567890',
      '1234567890123456789012345678901234567890',
      '12345678901234567890123456789012345678901234567890',
      '123456789012345678901234567890123456789012345678901234567890',
      '1234567890123456789012345678901234567890123456789012345678901234567890',
    ].reduce((acc, value) => Object.assign(acc, { [value]: new BN(value) }), {
      MAX_UINT256: constants.MAX_UINT256.toString(),
    }))) {
      it(`converts ${key}`, async function () {
        expect(await this.strings.methods['toString(uint256)'](value)).to.equal(value.toString(10));
      });
    }
  });

  describe('toHexString', function () {
    it('converts 0', async function () {
      expect(await this.strings.methods['toHexString(uint256)'](0)).to.equal('0x00');
    });

    it('converts a positive number', async function () {
      expect(await this.strings.methods['toHexString(uint256)'](0x4132)).to.equal('0x4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['toHexString(uint256)'](constants.MAX_UINT256))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('toHexString fixed', function () {
    it('converts a positive number (long)', async function () {
      expect(await this.strings.methods['toHexString(uint256,uint256)'](0x4132, 32))
        .to.equal('0x0000000000000000000000000000000000000000000000000000000000004132');
    });

    it('converts a positive number (short)', async function () {
      await expectRevert(
        this.strings.methods['toHexString(uint256,uint256)'](0x4132, 1),
        'Strings: hex length insufficient',
      );
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['toHexString(uint256,uint256)'](constants.MAX_UINT256, 32))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('toHexString address', function () {
    it('converts a random address', async function () {
      const addr = '0xa9036907dccae6a1e0033479b12e837e5cf5a02f';
      expect(await this.strings.methods['toHexString(address)'](addr)).to.equal(addr);
    });

    it('converts an address with leading zeros', async function () {
      const addr = '0x0000e0ca771e21bd00057f54a68c30d400000000';
      expect(await this.strings.methods['toHexString(address)'](addr)).to.equal(addr);
    });
  });
});
