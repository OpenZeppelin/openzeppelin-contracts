const { BN, constants } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../helpers/customError');

const { expect } = require('chai');

const Strings = artifacts.require('$Strings');

contract('Strings', function () {
  before(async function () {
    this.strings = await Strings.new();
  });

  describe('toString', function () {
    const values = [
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
    ];

    describe('uint256', function () {
      it('converts MAX_UINT256', async function () {
        const value = constants.MAX_UINT256;
        expect(await this.strings.methods['$toString(uint256)'](value)).to.equal(value.toString(10));
      });

      for (const value of values) {
        it(`converts ${value}`, async function () {
          expect(await this.strings.methods['$toString(uint256)'](value)).to.equal(value);
        });
      }
    });

    describe('int256', function () {
      it('converts MAX_INT256', async function () {
        const value = constants.MAX_INT256;
        expect(await this.strings.methods['$toStringSigned(int256)'](value)).to.equal(value.toString(10));
      });

      it('converts MIN_INT256', async function () {
        const value = constants.MIN_INT256;
        expect(await this.strings.methods['$toStringSigned(int256)'](value)).to.equal(value.toString(10));
      });

      for (const value of values) {
        it(`convert ${value}`, async function () {
          expect(await this.strings.methods['$toStringSigned(int256)'](value)).to.equal(value);
        });

        it(`convert negative ${value}`, async function () {
          const negated = new BN(value).neg();
          expect(await this.strings.methods['$toStringSigned(int256)'](negated)).to.equal(negated.toString(10));
        });
      }
    });
  });

  describe('toHexString', function () {
    it('converts 0', async function () {
      expect(await this.strings.methods['$toHexString(uint256)'](0)).to.equal('0x00');
    });

    it('converts a positive number', async function () {
      expect(await this.strings.methods['$toHexString(uint256)'](0x4132)).to.equal('0x4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['$toHexString(uint256)'](constants.MAX_UINT256)).to.equal(
        web3.utils.toHex(constants.MAX_UINT256),
      );
    });
  });

  describe('toHexString fixed', function () {
    it('converts a positive number (long)', async function () {
      expect(await this.strings.methods['$toHexString(uint256,uint256)'](0x4132, 32)).to.equal(
        '0x0000000000000000000000000000000000000000000000000000000000004132',
      );
    });

    it('converts a positive number (short)', async function () {
      const length = 1;
      await expectRevertCustomError(
        this.strings.methods['$toHexString(uint256,uint256)'](0x4132, length),
        `StringsInsufficientHexLength`,
        [0x4132, length],
      );
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.methods['$toHexString(uint256,uint256)'](constants.MAX_UINT256, 32)).to.equal(
        web3.utils.toHex(constants.MAX_UINT256),
      );
    });
  });

  describe('toHexString address', function () {
    it('converts a random address', async function () {
      const addr = '0xa9036907dccae6a1e0033479b12e837e5cf5a02f';
      expect(await this.strings.methods['$toHexString(address)'](addr)).to.equal(addr);
    });

    it('converts an address with leading zeros', async function () {
      const addr = '0x0000e0ca771e21bd00057f54a68c30d400000000';
      expect(await this.strings.methods['$toHexString(address)'](addr)).to.equal(addr);
    });
  });

  describe('equal', function () {
    it('compares two empty strings', async function () {
      expect(await this.strings.methods['$equal(string,string)']('', '')).to.equal(true);
    });

    it('compares two equal strings', async function () {
      expect(await this.strings.methods['$equal(string,string)']('a', 'a')).to.equal(true);
    });

    it('compares two different strings', async function () {
      expect(await this.strings.methods['$equal(string,string)']('a', 'b')).to.equal(false);
    });

    it('compares two different strings of different lengths', async function () {
      expect(await this.strings.methods['$equal(string,string)']('a', 'aa')).to.equal(false);
      expect(await this.strings.methods['$equal(string,string)']('aa', 'a')).to.equal(false);
    });

    it('compares two different large strings', async function () {
      const str1 = 'a'.repeat(201);
      const str2 = 'a'.repeat(200) + 'b';
      expect(await this.strings.methods['$equal(string,string)'](str1, str2)).to.equal(false);
    });

    it('compares two equal large strings', async function () {
      const str1 = 'a'.repeat(201);
      const str2 = 'a'.repeat(201);
      expect(await this.strings.methods['$equal(string,string)'](str1, str2)).to.equal(true);
    });
  });
});
