const { expectEvent, shouldFail } = require('openzeppelin-test-helpers');

const CounterImpl = artifacts.require('CounterImpl');

contract('Counter', function () {
  beforeEach(async function () {
    this.counter = await CounterImpl.new();
  });

  it('starts at zero', async function () {
    (await this.counter.current()).should.be.bignumber.equal('0');
  });

  describe('increment', function () {
    it('increments the current value by one', async function () {
      await this.counter.increment();
      (await this.counter.current()).should.be.bignumber.equal('1');
    });

    it('returns the new value', async function () {
      const { logs } = await this.counter.increment();
      expectEvent.inLogs(logs, 'ValueChange', { current: '1' });
    });

    it('can be called multipl etimes', async function () {
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

    it('returns the new value', async function () {
      const { logs } = await this.counter.decrement();
      expectEvent.inLogs(logs, 'ValueChange', { current: '0' });
    });

    it('reverts if the current value is 0', async function () {
      await this.counter.decrement();
      await shouldFail.reverting(this.counter.decrement());
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
