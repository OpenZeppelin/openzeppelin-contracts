const { shouldFail } = require('openzeppelin-test-helpers');

const CountersImpl = artifacts.require('CountersImpl');

contract('Counters', function () {
  beforeEach(async function () {
    this.counter = await CountersImpl.new();
  });

  it('starts at zero', async function () {
    (await this.counter.current()).should.be.bignumber.equal('0');
  });

  describe('increment', function () {
    it('increments the current value by one', async function () {
      await this.counter.increment();
      (await this.counter.current()).should.be.bignumber.equal('1');
    });

    it('can be called multiple times', async function () {
      await this.counter.increment();
      await this.counter.increment();
      await this.counter.increment();

      (await this.counter.current()).should.be.bignumber.equal('3');
    });
  });

  describe('decrement', function () {
    beforeEach(async function () {
      await this.counter.increment();
      (await this.counter.current()).should.be.bignumber.equal('1');
    });

    it('decrements the current value by one', async function () {
      await this.counter.decrement();
      (await this.counter.current()).should.be.bignumber.equal('0');
    });

    it('reverts if the current value is 0', async function () {
      await this.counter.decrement();
      await shouldFail.reverting.withMessage(this.counter.decrement(), 'SafeMath: subtraction overflow');
    });

    it('can be called multiple times', async function () {
      await this.counter.increment();
      await this.counter.increment();

      (await this.counter.current()).should.be.bignumber.equal('3');

      await this.counter.decrement();
      await this.counter.decrement();
      await this.counter.decrement();

      (await this.counter.current()).should.be.bignumber.equal('0');
    });
  });
});
