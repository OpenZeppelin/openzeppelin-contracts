const shouldFail = require('../helpers/shouldFail');
const { MAX_UINT256, MIN_INT256, MAX_INT256 } = require('../helpers/constants');

const SafeMathMock = artifacts.require('SafeMathMock');

const { BigNumber } = require('../helpers/setup');

contract('SafeMath', function () {
  beforeEach(async function () {
    this.safeMath = await SafeMathMock.new();
  });

  describe('unsigned', function () {
    describe('add', function () {
      it('adds correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(1234);

        (await this.safeMath.addUints(a, b)).should.be.bignumber.equal(a.plus(b));
      });

      it('reverts on addition overflow', async function () {
        const a = MAX_UINT256;
        const b = new BigNumber(1);

        await shouldFail.reverting(this.safeMath.addUints(a, b));
      });
    });

    describe('sub', function () {
      it('subtracts correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(1234);

        (await this.safeMath.subUints(a, b)).should.be.bignumber.equal(a.minus(b));
      });

      it('reverts if subtraction result would be negative', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        await shouldFail.reverting(this.safeMath.subUints(a, b));
      });
    });

    describe('mul', function () {
      it('multiplies correctly', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        (await this.safeMath.mulUints(a, b)).should.be.bignumber.equal(a.times(b));
      });

      it('handles a zero product correctly (first number as zero)', async function () {
        const a = new BigNumber(0);
        const b = new BigNumber(5678);

        (await this.safeMath.mulUints(a, b)).should.be.bignumber.equal(a.times(b));
      });

      it('handles a zero product correctly (second number as zero)', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(0);

        (await this.safeMath.mulUints(a, b)).should.be.bignumber.equal(a.times(b));
      });

      it('reverts on multiplication overflow', async function () {
        const a = MAX_UINT256;
        const b = new BigNumber(2);

        await shouldFail.reverting(this.safeMath.mulUints(a, b));
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(5678);

        (await this.safeMath.divUints(a, b)).should.be.bignumber.equal(a.div(b));
      });

      it('divides zero correctly', async function () {
        const a = new BigNumber(0);
        const b = new BigNumber(5678);

        (await this.safeMath.divUints(a, b)).should.be.bignumber.equal(0);
      });

      it('returns complete number result on non-even division', async function () {
        const a = new BigNumber(7000);
        const b = new BigNumber(5678);

        (await this.safeMath.divUints(a, b)).should.be.bignumber.equal(1);
      });

      it('reverts on zero division', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(0);

        await shouldFail.reverting(this.safeMath.divUints(a, b));
      });
    });

    describe('mod', function () {
      describe('modulos correctly', async function () {
        it('when the dividend is smaller than the divisor', async function () {
          const a = new BigNumber(284);
          const b = new BigNumber(5678);

          (await this.safeMath.modUints(a, b)).should.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is equal to the divisor', async function () {
          const a = new BigNumber(5678);
          const b = new BigNumber(5678);

          (await this.safeMath.modUints(a, b)).should.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is larger than the divisor', async function () {
          const a = new BigNumber(7000);
          const b = new BigNumber(5678);

          (await this.safeMath.modUints(a, b)).should.be.bignumber.equal(a.mod(b));
        });

        it('when the dividend is a multiple of the divisor', async function () {
          const a = new BigNumber(17034); // 17034 == 5678 * 3
          const b = new BigNumber(5678);

          (await this.safeMath.modUints(a, b)).should.be.bignumber.equal(a.mod(b));
        });
      });

      it('reverts with a 0 divisor', async function () {
        const a = new BigNumber(5678);
        const b = new BigNumber(0);

        await shouldFail.reverting(this.safeMath.modUints(a, b));
      });
    });
  });

  describe('signed', function () {
    describe('add', function () {
      it('adds correctly if it does not overflow and the result is positve', async function () {
        const a = new BigNumber(1234);
        const b = new BigNumber(5678);

        (await this.safeMath.addUints(a, b)).should.be.bignumber.equal(a.plus(b));
      });

      it('adds correctly if it does not overflow and the result is negative', async function () {
        const a = MAX_INT256;
        const b = MIN_INT256;

        const result = await this.safeMath.addInts(a, b);
        result.should.be.bignumber.equal(a.plus(b));
      });

      it('reverts on positive addition overflow', async function () {
        const a = MAX_INT256;
        const b = new BigNumber(1);

        await shouldFail.reverting(this.safeMath.addInts(a, b));
      });

      it('reverts on negative addition overflow', async function () {
        const a = MIN_INT256;
        const b = new BigNumber(-1);

        await shouldFail.reverting(this.safeMath.addInts(a, b));
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

      it('reverts on positive subtraction overflow', async function () {
        const a = MAX_INT256;
        const b = new BigNumber(-1);

        await shouldFail.reverting(this.safeMath.subInts(a, b));
      });

      it('reverts on negative subtraction overflow', async function () {
        const a = MIN_INT256;
        const b = new BigNumber(1);

        await shouldFail.reverting(this.safeMath.subInts(a, b));
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

      it('reverts on multiplication overflow, positive operands', async function () {
        const a = MAX_INT256;
        const b = new BigNumber(2);

        await shouldFail.reverting(this.safeMath.mulInts(a, b));
      });

      it('reverts when minimum integer is multiplied by -1', async function () {
        const a = MIN_INT256;
        const b = new BigNumber(-1);

        await shouldFail.reverting(this.safeMath.mulInts(a, b));
      });

      it('reverts when -1 is multiplied by minimum integer', async function () {
        const a = new BigNumber(-1);
        const b = MIN_INT256;

        await shouldFail.reverting(this.safeMath.mulInts(a, b));
      });
    });

    describe('div', function () {
      it('divides correctly', async function () {
        const a = new BigNumber(-5678);
        const b = new BigNumber(5678);

        const result = await this.safeMath.divInts(a, b);
        result.should.be.bignumber.equal(a.div(b));
      });

      it('reverts on zero division', async function () {
        const a = new BigNumber(-5678);
        const b = new BigNumber(0);

        await shouldFail.reverting(this.safeMath.divInts(a, b));
      });

      it('reverts on overflow, negative second', async function () {
        const a = new BigNumber(MIN_INT256);
        const b = new BigNumber(-1);

        await shouldFail.reverting(this.safeMath.divInts(a, b));
      });
    });
  });
});
