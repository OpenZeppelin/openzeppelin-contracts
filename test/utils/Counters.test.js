const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

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
        await expectRevert(this.counter.decrement(), 'Counter: decrement overflow');
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

  describe('getAndIncrement', function () {
    context('starting from 0', function () {
      it('gets the current counter value and increments by one', async function () {
        expectEvent(await this.counter.getAndIncrement(), 'ReturnedValue', { value: '0' });
        expect(await this.counter.current()).to.be.bignumber.equal('1');
      });

      it('can be called multiple times', async function () {
        expect(await this.counter.current()).to.be.bignumber.equal('0');
        expectEvent(await this.counter.getAndIncrement(), 'ReturnedValue', { value: '0' });
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expectEvent(await this.counter.getAndIncrement(), 'ReturnedValue', { value: '1' });
        expect(await this.counter.current()).to.be.bignumber.equal('2');
        expectEvent(await this.counter.getAndIncrement(), 'ReturnedValue', { value: '2' });
        expect(await this.counter.current()).to.be.bignumber.equal('3');
      });
    });
  });

  describe('incrementAndGet', function () {
    context('starting from 0', function () {
      it('increments the current counter value by one and gets it', async function () {
        expectEvent(await this.counter.incrementAndGet(), 'ReturnedValue', { value: '1' });
        expect(await this.counter.current()).to.be.bignumber.equal('1');
      });

      it('can be called multiple times', async function () {
        expect(await this.counter.current()).to.be.bignumber.equal('0');
        expectEvent(await this.counter.incrementAndGet(), 'ReturnedValue', { value: '1' });
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expectEvent(await this.counter.incrementAndGet(), 'ReturnedValue', { value: '2' });
        expect(await this.counter.current()).to.be.bignumber.equal('2');
        expectEvent(await this.counter.incrementAndGet(), 'ReturnedValue', { value: '3' });
        expect(await this.counter.current()).to.be.bignumber.equal('3');
      });
    });
  });

  describe('getAndDecrement', function () {
    beforeEach(async function () {
      await this.counter.increment();
    });
    context('starting from 1', function () {
      it('gets the current counter value and decrements by one', async function () {
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expectEvent(await this.counter.getAndDecrement(), 'ReturnedValue', { value: '1' });
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });

      it('reverts if the current value is 0', async function () {
        await this.counter.decrement();
        await expectRevert(this.counter.getAndDecrement(), 'Counter: decrement overflow');
      });
    });
    context('after incremented to 3', function () {
      it('can be called multiple times', async function () {
        await this.counter.increment();
        await this.counter.increment();

        expect(await this.counter.current()).to.be.bignumber.equal('3');
        expectEvent(await this.counter.getAndDecrement(), 'ReturnedValue', { value: '3' });
        expect(await this.counter.current()).to.be.bignumber.equal('2');
        expectEvent(await this.counter.getAndDecrement(), 'ReturnedValue', { value: '2' });
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expectEvent(await this.counter.getAndDecrement(), 'ReturnedValue', { value: '1' });
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });
    });
  });

  describe('decrementAndGet', function () {
    beforeEach(async function () {
      await this.counter.incrementAndGet();
    });
    context('starting from 1', function () {
      it('decrements by one the current value and gets it', async function () {
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expectEvent(await this.counter.decrementAndGet(), 'ReturnedValue', { value: '0' });
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });

      it('reverts if the current value is 0', async function () {
        await this.counter.decrement();
        await expectRevert(this.counter.decrementAndGet(), 'Counter: decrement overflow');
      });
    });
    context('after incremented to 3', function () {
      it('can be called multiple times', async function () {
        await this.counter.increment();
        await this.counter.increment();

        expect(await this.counter.current()).to.be.bignumber.equal('3');
        expectEvent(await this.counter.decrementAndGet(), 'ReturnedValue', { value: '2' });
        expect(await this.counter.current()).to.be.bignumber.equal('2');
        expectEvent(await this.counter.decrementAndGet(), 'ReturnedValue', { value: '1' });
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expectEvent(await this.counter.decrementAndGet(), 'ReturnedValue', { value: '0' });
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });
    });
  });

  describe('reset', function () {
    context('null counter', function () {
      it('does not throw', async function () {
        await this.counter.reset();
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });
    });

    context('non null counter', function () {
      beforeEach(async function () {
        await this.counter.increment();
        expect(await this.counter.current()).to.be.bignumber.equal('1');
      });
      it('reset to 0', async function () {
        await this.counter.reset();
        expect(await this.counter.current()).to.be.bignumber.equal('0');
      });
    });
  });
});
