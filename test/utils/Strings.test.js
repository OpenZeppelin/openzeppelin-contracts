const { constants, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const StringsMock = artifacts.require('StringsMock');

contract('Strings', function (accounts) {
  let strings;

  before(async function () {
    strings = await StringsMock.new();
  });

  describe('toString', function () {
    async function testToString (input) {
      expect(await strings.toStringDecimal(input)).to.equal(input);
    }

    it('converts 0', async function () {
      await testToString('0');
    });

    it('converts 7', async function () {
      await testToString('7');
    });

    it('converts 42', async function () {
      await testToString('42');
    });

    it('converts 123', async function () {
      await testToString('123');
    });

    it('converts 4132', async function () {
      await testToString('4132');
    });

    it('converts 12345', async function () {
      await testToString('12345');
    });

    it('converts 1234567', async function () {
      await testToString('1234567');
    });

    it('converts 1234567890', async function () {
      await testToString('1234567890');
    });

    it('converts 123456789012345', async function () {
      await testToString('123456789012345');
    });

    it('converts 12345678901234567890', async function () {
      await testToString('12345678901234567890');
    });

    it('converts 123456789012345678901234567890', async function () {
      await testToString('123456789012345678901234567890');
    });

    it('converts 1234567890123456789012345678901234567890', async function () {
      await testToString('1234567890123456789012345678901234567890');
    });

    it('converts 12345678901234567890123456789012345678901234567890', async function () {
      await testToString('12345678901234567890123456789012345678901234567890');
    });

    it('converts 123456789012345678901234567890123456789012345678901234567890', async function () {
      await testToString('123456789012345678901234567890123456789012345678901234567890');
    });

    it('converts 1234567890123456789012345678901234567890123456789012345678901234567890', async function () {
      await testToString('1234567890123456789012345678901234567890123456789012345678901234567890');
    });

    it('converts MAX_UINT256', async function () {
      await testToString(constants.MAX_UINT256.toString());
    });
  });

  describe('toHexString', function () {
    it('converts 0', async function () {
      expect(await strings.toHexString(0)).to.equal('0x00');
    });

    it('converts a positive number', async function () {
      expect(await strings.toHexString(0x4132)).to.equal('0x4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await strings.toHexString(constants.MAX_UINT256))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('toHexString fixed', function () {
    it('converts a positive number (long)', async function () {
      expect(await strings.toHexString(0x4132, 32))
        .to.equal('0x0000000000000000000000000000000000000000000000000000000000004132');
    });

    it('converts a positive number (short)', async function () {
      await expectRevert(
        strings.toHexString(0x4132, 1),
        'Strings: hex length insufficient',
      );
    });

    it('converts MAX_UINT256', async function () {
      expect(await strings.toHexString(constants.MAX_UINT256, 32))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('toHexString address', function () {
    it('converts a random address', async function () {
      const addr = '0xa9036907dccae6a1e0033479b12e837e5cf5a02f';
      expect(await strings.toHexStringAddress(addr)).to.equal(addr);
    });

    it('converts an address with leading zeros', async function () {
      const addr = '0x0000e0ca771e21bd00057f54a68c30d400000000';
      expect(await strings.toHexStringAddress(addr)).to.equal(addr);
    });
  });
});
