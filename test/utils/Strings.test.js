const { constants, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const StringsMock = artifacts.require('StringsMock');

contract('Strings', function (accounts) {
  beforeEach(async function () {
    this.strings = await StringsMock.new();
  });

  describe('from uint256 - decimal format', function () {
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

  describe('from uint256 - hex format', function () {
    it('converts 0', async function () {
      expect(await this.strings.fromUint256Hex(0)).to.equal('0x00');
    });

    it('converts a positive number', async function () {
      expect(await this.strings.fromUint256Hex(0x4132)).to.equal('0x4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.fromUint256Hex(constants.MAX_UINT256)).to.equal(
        web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('from uint256 - fixed hex format', function () {
    it('converts a positive number (long)', async function () {
      expect(await this.strings.fromUint256HexFixed(0x4132, 32)).to.equal(
        '0x0000000000000000000000000000000000000000000000000000000000004132');
    });

    it('converts a positive number (short)', async function () {
      await expectRevert(this.strings.fromUint256HexFixed(0x4132, 1), 'Strings: hex length insufficient');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.fromUint256HexFixed(constants.MAX_UINT256, 32)).to.equal(
        web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('mockNormalizeUpperASCII', function () {
    it('Normalizes a string to use upper-case basic-ASCII.', async function () {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const caseless = ' !"#$%&\'()*+,-./0123456789:;<=>?@[\\]^_`{|}~';

      expect(await this.strings.mockNormalizeUpperASCII(lowercase))
        .to.equal(uppercase)
        .to.equal(lowercase.toUpperCase());

      expect(await this.strings.mockNormalizeUpperASCII(uppercase))
        .to.equal(uppercase)
        .to.equal(uppercase.toUpperCase());

      expect(await this.strings.mockNormalizeUpperASCII(caseless))
        .to.equal(caseless)
        .to.equal(caseless.toUpperCase());
    });
  });

  describe('mockNormalizeLowerASCII', function () {
    it('Normalizes a string to use lower-case basic-ASCII.', async function () {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const caseless = ' !"#$%&\'()*+,-./0123456789:;<=>?@[\\]^_`{|}~';

      expect(await this.strings.mockNormalizeLowerASCII(uppercase))
        .to.equal(lowercase)
        .to.equal(uppercase.toLowerCase());

      expect(await this.strings.mockNormalizeLowerASCII(lowercase))
        .to.equal(lowercase)
        .to.equal(lowercase.toLowerCase());

      expect(await this.strings.mockNormalizeLowerASCII(caseless))
        .to.equal(caseless)
        .to.equal(caseless.toLowerCase());
    });
  });
});
