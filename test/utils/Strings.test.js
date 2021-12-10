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
      expect(await this.strings.fromUint256Hex(constants.MAX_UINT256))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('from uint256 - fixed hex format', function () {
    it('converts a positive number (long)', async function () {
      expect(await this.strings.fromUint256HexFixed(0x4132, 32))
        .to.equal('0x0000000000000000000000000000000000000000000000000000000000004132');
    });

    it('converts a positive number (short)', async function () {
      await expectRevert(
        this.strings.fromUint256HexFixed(0x4132, 1),
        'Strings: hex length insufficient',
      );
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.strings.fromUint256HexFixed(constants.MAX_UINT256, 32))
        .to.equal(web3.utils.toHex(constants.MAX_UINT256));
    });
  });

  describe('toUpper', function () {
    it('converts a lowercase string to an uppercase string', async function () {
      // Start at the character before 'A' and end at the character after 'z'
      const allChars = '@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ ` ' +
                       'a b c d e f g h i j k l m n o p q r s t u v w x y z {';
      expect(await this.strings.toUpperMock(allChars))
        .to.equal(allChars.toUpperCase());
    });
  });

  describe('toLower', function () {
    it('converts a lowercase string to an uppercase string', async function () {
      // Start at the character before 'A' and end at the character after 'z'
      const allChars = '@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ ` ' +
                       'a b c d e f g h i j k l m n o p q r s t u v w x y z {';
      expect(await this.strings.toLowerMock(allChars))
        .to.equal(allChars.toLowerCase());
    });
  });
});
