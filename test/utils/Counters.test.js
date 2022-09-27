const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CountersImpl = artifacts.require('CountersImpl');

contract('Counters', function (accounts) {
  beforeEach(async function () {
    this.counter = await CountersImpl.new();
  });

  it('starts at zero', async function () {
    expect(await this.counter.current()).to.be.bignumber.equal('0');
    expect(await this.counter.helper()).to.be.bignumber.equal('0');
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
    context('starting from 0 and can be called multiple times', function () {
      it('assign the current value to the variable `helper` and increments by one', async function () {
        await this.counter.getAndIncrement();
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expect(await this.counter.helper()).to.be.bignumber.equal('0');

        await this.counter.getAndIncrement();
        expect(await this.counter.current()).to.be.bignumber.equal('2');
        expect(await this.counter.helper()).to.be.bignumber.equal('1');

        await this.counter.getAndIncrement();
        expect(await this.counter.current()).to.be.bignumber.equal('3');
        expect(await this.counter.helper()).to.be.bignumber.equal('2');
      });
    });
  });

  describe('incrementAndGet', function () {
    context('starting from 0', function () {
      it('increments by one the current value and assign to the variable `helper`', async function () {
        await this.counter.incrementAndGet();
        expect(await this.counter.current()).to.be.bignumber.equal('1');
        expect(await this.counter.helper()).to.be.bignumber.equal('1');
      });

      it('can be called multiple times', async function () {
        await this.counter.incrementAndGet();
        await this.counter.incrementAndGet();
        await this.counter.incrementAndGet();

        expect(await this.counter.current()).to.be.bignumber.equal('3');
        expect(await this.counter.helper()).to.be.bignumber.equal('3');
      });
    });
  });

  describe('getAndDecrement', function () {
    beforeEach(async function () {
      await this.counter.increment();
      expect(await this.counter.current()).to.be.bignumber.equal('1');
      expect(await this.counter.helper()).to.be.bignumber.equal('0');
    });
    context('starting from 1', function () {
      it('assign the current value to the variable `helper` and decrements by one', async function () {
        await this.counter.getAndDecrement();
        expect(await this.counter.current()).to.be.bignumber.equal('0');
        expect(await this.counter.helper()).to.be.bignumber.equal('1');
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
        expect(await this.counter.helper()).to.be.bignumber.equal('0');

        await this.counter.getAndDecrement();
        await this.counter.getAndDecrement();
        await this.counter.getAndDecrement();

        expect(await this.counter.current()).to.be.bignumber.equal('0');
        expect(await this.counter.helper()).to.be.bignumber.equal('1');
      });
    });
  });

  describe('decrementAndGet', function () {
    beforeEach(async function () {
      await this.counter.incrementAndGet();
      expect(await this.counter.current()).to.be.bignumber.equal('1');
      expect(await this.counter.helper()).to.be.bignumber.equal('1');
    });
    context('starting from 1', function () {
      it('decrements by one the current value and assign to the variable `helper`', async function () {
        await this.counter.decrementAndGet();
        expect(await this.counter.current()).to.be.bignumber.equal('0');
        expect(await this.counter.helper()).to.be.bignumber.equal('0');
      });

      it('reverts if the current value is 0', async function () {
        await this.counter.decrement();
        await expectRevert(this.counter.decrementAndGet(), 'Counter: decrement overflow');
      });
    });
    context('after incremented to 3', function () {
      it('can be called multiple times', async function () {
        await this.counter.incrementAndGet();
        await this.counter.incrementAndGet();

        expect(await this.counter.current()).to.be.bignumber.equal('3');
        expect(await this.counter.helper()).to.be.bignumber.equal('3');

        await this.counter.decrementAndGet();
        await this.counter.decrementAndGet();
        await this.counter.decrementAndGet();

        expect(await this.counter.current()).to.be.bignumber.equal('0');
        expect(await this.counter.helper()).to.be.bignumber.equal('0');
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
