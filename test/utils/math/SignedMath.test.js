const { BN, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MIN_INT256, MAX_INT256 } = constants;

const SignedMathMock = artifacts.require('SignedMathMock');

contract('SignedMath', function (accounts) {
  const min = new BN('-1234');
  const max = new BN('5678');

  beforeEach(async function () {
    this.math = await SignedMathMock.new();
  });

  describe('max', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.max(max, min)).to.be.bignumber.equal(max);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.max(min, max)).to.be.bignumber.equal(max);
    });
  });

  describe('min', function () {
    it('is correctly detected in first argument position', async function () {
      expect(await this.math.min(min, max)).to.be.bignumber.equal(min);
    });

    it('is correctly detected in second argument position', async function () {
      expect(await this.math.min(max, min)).to.be.bignumber.equal(min);
    });
  });

  describe('average', function () {
    function bnAverage (a, b) {
      return a.add(b).divn(2);
    }

    it('is correctly calculated with various input', async function () {
      const valuesX = [
        new BN('0'),
        new BN('3'),
        new BN('-3'),
        new BN('4'),
        new BN('-4'),
        new BN('57417'),
        new BN('-57417'),
        new BN('42304'),
        new BN('-42304'),
        MIN_INT256,
        MAX_INT256,
      ];

      const valuesY = [
        new BN('0'),
        new BN('5'),
        new BN('-5'),
        new BN('2'),
        new BN('-2'),
        new BN('57417'),
        new BN('-57417'),
        new BN('42304'),
        new BN('-42304'),
        MIN_INT256,
        MAX_INT256,
      ];

      for (const x of valuesX) {
        for (const y of valuesY) {
          expect(await this.math.average(x, y))
            .to.be.bignumber.equal(bnAverage(x, y), `Bad result for average(${x}, ${y})`);
        }
      }
    });
  });

  describe('abs', function () {
    for (const n of [
      MIN_INT256,
      MIN_INT256.addn(1),
      new BN('-1'),
      new BN('0'),
      new BN('1'),
      MAX_INT256.subn(1),
      MAX_INT256,
    ]) {
      it(`correctly computes the absolute value of ${n}`, async function () {
        expect(await this.math.abs(n)).to.be.bignumber.equal(n.abs());
      });
    }
  });
});
