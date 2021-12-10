const { constants, expectRevert } = require('@openzeppelin/test-helpers');

const { expect, assert } = require('chai');

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

  describe('toUpper -', function(){
    it('converts a lowercase string to an uppercase string', async function(){
      let allChars = '␀ ␁ ␂ ␃ ␄ ␅ ␆ ␇ ␈ ␉ ␊ ␋ ␌ ␍ ␎ ␏ ␐ ␑ ␒ ␓ ␔ ␕ ␖ ␗ ␘ ␙ ␚ ␛ ' +
                    '␜ ␝ ␞ ␟ ␠ ! \" # $ % & \' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ? @ ' +
                    'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ ` ' +
                    'a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~ ␡          '+
                    '                         ¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ­ ® ¯ ° ± ' +
                    '² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ð Ñ Ò Ó Ô Õ Ö × Ø Ù Ú ' +
                    'Û Ü Ý Þ ß à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ÷ ø ù ú û ü ý þ ÿ';

      let capChars = '␀ ␁ ␂ ␃ ␄ ␅ ␆ ␇ ␈ ␉ ␊ ␋ ␌ ␍ ␎ ␏ ␐ ␑ ␒ ␓ ␔ ␕ ␖ ␗ ␘ ␙ ␚ ␛ ' +
                    '␜ ␝ ␞ ␟ ␠ ! \" # $ % & \' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ? @ ' +
                    'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ ` ' +
                    'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z { | } ~ ␡          '+
                    '                         ¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ­ ® ¯ ° ± ' +
                    '² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ð Ñ Ò Ó Ô Õ Ö × Ø Ù Ú ' +
                    'Û Ü Ý Þ ß à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ÷ ø ù ú û ü ý þ ÿ';

      expect(await this.contract.toUpper(allChars).to.equal(capChars));
    })
  });

  describe('toLower', function(){
    it('converts a lowercase string to an uppercase string', async function(){
      let allChars = '␀ ␁ ␂ ␃ ␄ ␅ ␆ ␇ ␈ ␉ ␊ ␋ ␌ ␍ ␎ ␏ ␐ ␑ ␒ ␓ ␔ ␕ ␖ ␗ ␘ ␙ ␚ ␛ ' +
                    '␜ ␝ ␞ ␟ ␠ ! \" # $ % & \' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ? @ ' +
                    'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ ` ' +
                    'a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~ ␡          '+
                    '                         ¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ­ ® ¯ ° ± ' +
                    '² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ð Ñ Ò Ó Ô Õ Ö × Ø Ù Ú ' +
                    'Û Ü Ý Þ ß à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ÷ ø ù ú û ü ý þ ÿ';

      let lowChars = '␀ ␁ ␂ ␃ ␄ ␅ ␆ ␇ ␈ ␉ ␊ ␋ ␌ ␍ ␎ ␏ ␐ ␑ ␒ ␓ ␔ ␕ ␖ ␗ ␘ ␙ ␚ ␛ ' +
                    '␜ ␝ ␞ ␟ ␠ ! \" # $ % & \' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ? @ ' +
                    'a b c d e f g h i j k l m n o p q r s t u v w x y z [ \\ ] ^ _ ` ' +
                    'a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~ ␡          '+
                    '                         ¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ­ ® ¯ ° ± ' +
                    '² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ð Ñ Ò Ó Ô Õ Ö × Ø Ù Ú ' +
                    'Û Ü Ý Þ ß à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ÷ ø ù ú û ü ý þ ÿ';

      expect(await this.contract.toLower(allChars).to.equal(lowChars));
    })
  });
});
