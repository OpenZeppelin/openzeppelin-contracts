import assertJump from '../helpers/assertJump';
const BigNumber = web3.BigNumber;
const SafeMathMock = artifacts.require('SafeMathMock');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SafeMath', () => {
  const MIN_INT = new BigNumber(2).pow(255).times(-1);
  const MAX_INT = new BigNumber(2).pow(255).minus(1);
  const MAX_UINT = new BigNumber(2).pow(256).minus(1);

  before(async function () {
    this.safeMath = await SafeMathMock.new();
  });

  describe('unsigned integers', function () {
    describe('add', function () {
      it('adds correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(1234);

        const result = await this.safeMath.addUints(a, b);
        result.should.be.bignumber.equal(a.plus(b));
      });

      it('throws an error on addition overflow', async function () {
        const a = MAX_UINT;
        const b = new BigNumber(1);

        await assertJump(this.safeMath.addUints(a, b));
      });
    });

    describe('sub', function () {
      it('subtracts correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(1234);

        const result = await this.safeMath.subUints(a, b);
        result.should.be.bignumber.equal(a.minus(b));
      });

      it('throws an error if subtraction result would be negative', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        await assertJump(this.safeMath.subUints(a, b));
      });
    });

    describe('mul', function () {
      it('multiplies correctly', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        const result = await this.safeMath.mulUints(a, b);
        result.should.be.bignumber.equal(a.times(b));
      });

      it('handles a zero product correctly', async function () {
        const a = new BigNumber(0);
        const b = new BigNumber(5678);

        const result = await this.safeMath.mulUints(a, b);
        result.should.be.bignumber.equal(a.times(b));
      });

      it('throws an error on multiplication overflow', async function () {
        const a = MAX_UINT;
        const b = new BigNumber(2);

        await assertJump(this.safeMath.mulUints(a, b));
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(5678);

        const result = await this.safeMath.divUints(a, b);
        result.should.be.bignumber.equal(a.div(b));
      });

      it('throws an error on zero division', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(0);

        await assertJump(this.safeMath.divUints(a, b));
      });
    });
  });

  describe('signed integers', function () {
    describe('add', function () {
      it('adds correctly if it does not overflow and the result is positve', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        const result = await this.safeMath.addInts(a, b);
        result.should.be.bignumber.equal(a.plus(b));
      });

      it('adds correctly if it does not overflow and the result is negative', async function () {
        const a = MAX_INT;
        const b = MIN_INT;

        const result = await this.safeMath.addInts(a, b);
        result.should.be.bignumber.equal(a.plus(b));
      });

      it('throws an error on positive addition overflow', async function () {
        const a = MAX_INT;
        const b = new BigNumber(1);

        await assertJump(this.safeMath.addInts(a, b));
      });

      it('throws an error on negative addition overflow', async function () {
        const a = MIN_INT;
        const b = new BigNumber(-1);

        await assertJump(this.safeMath.addInts(a, b));
      });
    });

    describe('mul', function () {
      it('multiplies correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(-1234);

        const result = await this.safeMath.mulInts(a, b);
        result.should.be.bignumber.equal(a.times(b));
      });

      it('handles a zero product correctly', async function () {
        const a = new BigNumber(0);
        const b = new BigNumber(5678);

        const result = await this.safeMath.mulInts(a, b);
        result.should.be.bignumber.equal(a.times(b));
      });

      it('throws an error on multiplication overflow', async function () {
        const a = MAX_INT;
        const b = new BigNumber(2);

        await assertJump(this.safeMath.mulInts(a, b));
      });
    });

    describe('sub', function () {
      it('subtracts correctly if it does not overflow and the result is positive', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(1234);

        const result = await this.safeMath.subInts(a, b);
        result.should.be.bignumber.equal(a.minus(b));
      });

      it('subtracts correctly if it does not overflow and the result is negative', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        const result = await this.safeMath.subInts(a, b);
        result.should.be.bignumber.equal(a.minus(b));
      });

      it('throws an error on positive subtraction overflow', async function () {
        const a = MAX_INT;
        const b = new BigNumber(-1);

        await assertJump(this.safeMath.subInts(a, b));
      });

      it('throws an error on negative subtraction overflow', async function () {
        const a = MIN_INT;
        const b = new BigNumber(1);

        await assertJump(this.safeMath.subInts(a, b));
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BigNumber(-5678);
        const b = new BigNumber(5678);

        const result = await this.safeMath.divInts(a, b);
        result.should.be.bignumber.equal(a.div(b));
      });

      it('throws an error on zero division', async function () {
        const a = new BigNumber(-5678);
        const b = new BigNumber(0);

        await assertJump(this.safeMath.divInts(a, b));
      });
    });
  });
});
