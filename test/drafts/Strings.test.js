const { constants } = require('openzeppelin-test-helpers');

const StringsMock = artifacts.require('StringsMock');

contract('Strings', function () {
  const a = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const b = 'BBBBBBBBBBBBBBBBBBBBBBB';
  const ab = a + b;
  const aa = a + a;
  const empty = '';
  const zero = 0;
  const positiveNumber = 3195;

  beforeEach(async function () {
    this.strings = await StringsMock.new();
  });

  describe('concatenate', function () {
    it('concatenates strings', async function () {
      (await this.strings.concatenate(a, b)).should.equal(ab);
    });

    it('concatenates a string with itself', async function () {
      (await this.strings.concatenate(a, a)).should.equal(aa);
    });

    it('concatenates with the empty string', async function () {
      (await this.strings.concatenate(a, empty)).should.equal(a);
    });

    it('concatenates two empty strings', async function () {
      (await this.strings.concatenate(empty, empty)).should.equal(empty);
    });
  });

  describe('from uint256', function () {
    it('converts 0', async function () {
      (await this.strings.uint256ToString(zero)).should.equal(zero.toString());
    });

    it('converts a positive number', async function () {
      (await this.strings.uint256ToString(positiveNumber)).should.equal(positiveNumber.toString());
    });

    it('converts MAX_UINT256', async function () {
      (await this.strings.uint256ToString(constants.MAX_UINT256)).should.equal(constants.MAX_UINT256.toString());
    });
  });
});
