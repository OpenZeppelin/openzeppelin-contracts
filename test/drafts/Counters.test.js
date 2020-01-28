const { contract } = require('@openzeppelin/test-environment');
const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CountersImpl = contract.fromArtifact('CountersImpl');

describe('Counters', function () {
  beforeEach(async function () {
    this.counter = await CountersImpl.new();
  });

  it('starts at zero', async function () {
    expect(await this.counter.current()).to.be.bignumber.equal('0');
  });

  describe('increment', function () {
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

  describe('decrement', function () {
    beforeEach(async function () {
      await this.counter.increment();
      expect(await this.counter.current()).to.be.bignumber.equal('1');
    });

    it('decrements the current value by one', async function () {
      await this.counter.decrement();
      expect(await this.counter.current()).to.be.bignumber.equal('0');
    });

    it('reverts if the current value is 0', async function () {
      await this.counter.decrement();
      await expectRevert(this.counter.decrement(), 'SafeMath: subtraction overflow');
    });

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
