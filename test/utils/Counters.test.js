const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const Counters = artifacts.require('$Counters');

contract('Counters', function () {
  beforeEach(async function () {
    this.counter = await Counters.new();
  });

  it('starts at zero', async function () {
    expect(await this.counter.$current(0)).to.be.bignumber.equal('0');
  });

  describe('increment', function () {
    context('starting from 0', function () {
      it('increments the current value by one', async function () {
        await this.counter.$increment(0);
        expect(await this.counter.$current(0)).to.be.bignumber.equal('1');
      });

      it('can be called multiple times', async function () {
        await this.counter.$increment(0);
        await this.counter.$increment(0);
        await this.counter.$increment(0);

        expect(await this.counter.$current(0)).to.be.bignumber.equal('3');
      });
    });
  });

  describe('decrement', function () {
    beforeEach(async function () {
      await this.counter.$increment(0);
      expect(await this.counter.$current(0)).to.be.bignumber.equal('1');
    });
    context('starting from 1', function () {
      it('decrements the current value by one', async function () {
        await this.counter.$decrement(0);
        expect(await this.counter.$current(0)).to.be.bignumber.equal('0');
      });

      it('reverts if the current value is 0', async function () {
        await this.counter.$decrement(0);
        await expectRevert(this.counter.$decrement(0), 'Counter: decrement overflow');
      });
    });
    context('after incremented to 3', function () {
      it('can be called multiple times', async function () {
        await this.counter.$increment(0);
        await this.counter.$increment(0);

        expect(await this.counter.$current(0)).to.be.bignumber.equal('3');

        await this.counter.$decrement(0);
        await this.counter.$decrement(0);
        await this.counter.$decrement(0);

        expect(await this.counter.$current(0)).to.be.bignumber.equal('0');
      });
    });
  });

  describe('reset', function () {
    context('null counter', function () {
      it('does not throw', async function () {
        await this.counter.$reset(0);
        expect(await this.counter.$current(0)).to.be.bignumber.equal('0');
      });
    });

    context('non null counter', function () {
      beforeEach(async function () {
        await this.counter.$increment(0);
        expect(await this.counter.$current(0)).to.be.bignumber.equal('1');
      });
      it('reset to 0', async function () {
        await this.counter.$reset(0);
        expect(await this.counter.$current(0)).to.be.bignumber.equal('0');
      });
    });
  });
});
