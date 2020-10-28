const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CountersImpl = artifacts.require('CountersImpl');

contract('Counters', function (accounts) {
  beforeEach(async function () {
    this.counter = await CountersImpl.new();
  });

  it('starts at zero', async function () {
    expect(await this.counter.current()).to.be.bignumber.equal('0');
  });

  describe('increment', function () {
    context('starting from 0', function () {
      it('increments the current value by one', async function () {
        await this.counter.increment();
        expect(await this.counter.current()).to.be.bignumber.equal('1');
      });

      it('can be called multiple times', async function () {
        await this.counter.increment();
        await this.counter.increment();
        await this.counter.increment();

        expect(await this.counter.current()).to.be.bignumber.equal('3');
      });
    });
  });

  describe('decrement', function () {
    beforeEach(async function () {
      await this.counter.increment();
      expect(await this.counter.current()).to.be.bignumber.equal('1');
    });
    context('starting from 1', function () {
      it('decrements the current value by one', async function () {
        await this.counter.decrement();
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });

      it('reverts if the current value is 0', async function () {
        await this.counter.decrement();
        await expectRevert(this.counter.decrement(), 'SafeMath: subtraction overflow');
      });
    });
    context('after incremented to 3', function () {
      it('can be called multiple times', async function () {
        await this.counter.increment();
        await this.counter.increment();

        expect(await this.counter.current()).to.be.bignumber.equal('3');

        await this.counter.decrement();
        await this.counter.decrement();
        await this.counter.decrement();

        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });
    });
  });
});
