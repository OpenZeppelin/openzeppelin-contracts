const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { MAX_UINT48 } = require('../helpers/constants');
const time = require('../helpers/time');

const WINDOW = 100n;
const CAPACITY = 1000n;
const refillPerSecond = CAPACITY / WINDOW;

async function fixture() {
  const mock = await ethers.deployContract('$RateLimiter');
  return { mock };
}

const wrap = (mock, type) => ({
  state: (key = ethers.ZeroHash) => mock.getFunction(`$state_RateLimiter_${type}`)(0n, key),
  used: (key = ethers.ZeroHash) => mock.getFunction(`$used_RateLimiter_${type}`)(0n, key),
  available: (key = ethers.ZeroHash) => mock.getFunction(`$available_RateLimiter_${type}`)(0n, key),
  tryConsume: (amount, key = ethers.ZeroHash) => mock.getFunction(`$tryConsume_RateLimiter_${type}`)(0n, key, amount),
  tryConsumeStatic: (amount, key = ethers.ZeroHash) =>
    mock.getFunction(`$tryConsume_RateLimiter_${type}`).staticCall(0n, key, amount),
  consume: (amount, key = ethers.ZeroHash) => mock.getFunction(`$consume_RateLimiter_${type}`)(0n, key, amount),
  reset: (key = ethers.ZeroHash) => mock.getFunction(`$reset_RateLimiter_${type}`)(0n, key),
  updateSettings: (window, capacity) => mock.getFunction(`$updateSettings_RateLimiter_${type}`)(0n, window, capacity),
});

describe('RateLimiter', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('RefillingBucket', function () {
    beforeEach(async function () {
      Object.assign(this.mock, wrap(this.mock, 'RefillingBucket'));
    });

    it('starts empty', async function () {
      await expect(this.mock.state()).to.eventually.deep.equal([0n, 0n]);
      await expect(this.mock.used()).to.eventually.equal(0n);
      await expect(this.mock.available()).to.eventually.equal(0n);
    });

    describe('with some capacity', function () {
      beforeEach(async function () {
        await this.mock.updateSettings(WINDOW, CAPACITY);
      });

      it('reports full capacity available', async function () {
        await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
        await expect(this.mock.used()).to.eventually.equal(0n);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY);
      });

      describe('consume', function () {
        it('consume reduces available and increases used', async function () {
          await this.mock.consume(17n);

          await expect(this.mock.state()).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used()).to.eventually.equal(17n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 17n);
        });

        it('consume one key does not affect another key', async function () {
          const key1 = ethers.id('key1');
          const key2 = ethers.id('key2');

          await expect(this.mock.state(key1)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key1)).to.eventually.equal(0n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await this.mock.consume(17n, key1);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await this.mock.consume(42n, key2);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([
            17n - refillPerSecond,
            CAPACITY - 17n + refillPerSecond,
          ]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n - refillPerSecond);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n + refillPerSecond);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used(key2)).to.eventually.equal(42n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY - 42n);
        });

        it('consume reverts when over capacity', async function () {
          await expect(this.mock.consume(CAPACITY + 1n)).to.be.revertedWithCustomError(this.mock, 'RateLimitExceeded');
        });

        it('consume(0) is a no-op that returns true', async function () {
          await this.mock.consume(42n);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);

          await this.mock.consume(0n);

          // one second passed so we have to account for the auto refill
          await expect(this.mock.state()).to.eventually.deep.equal([
            42n - refillPerSecond,
            CAPACITY - 42n + refillPerSecond,
          ]);
          await expect(this.mock.used()).to.eventually.equal(42n - refillPerSecond);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n + refillPerSecond);
        });
      });

      describe('tryConsume', function () {
        it('tryConsume reduces available and increases used', async function () {
          // Static
          await expect(this.mock.tryConsumeStatic(42n)).to.eventually.be.true;

          // execute (and get event)
          await expect(this.mock.tryConsume(42n))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_RefillingBucket_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);
        });

        it('tryConsume one key does not affect another key', async function () {
          const key1 = ethers.id('key1');
          const key2 = ethers.id('key2');

          await expect(this.mock.state(key1)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key1)).to.eventually.equal(0n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await expect(this.mock.tryConsume(17n, key1))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_RefillingBucket_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await expect(this.mock.tryConsume(42n, key2))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_RefillingBucket_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([
            17n - refillPerSecond,
            CAPACITY - 17n + refillPerSecond,
          ]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n - refillPerSecond);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n + refillPerSecond);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used(key2)).to.eventually.equal(42n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY - 42n);
        });

        it('tryConsume returns false and does not update state when over capacity', async function () {
          // Static
          await expect(this.mock.tryConsumeStatic(CAPACITY + 1n)).to.eventually.be.false;

          // execute (and get event)
          await expect(this.mock.tryConsume(CAPACITY + 1n))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_RefillingBucket_bytes32_uint256')
            .withArgs(false);

          await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used()).to.eventually.equal(0n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY);
        });

        it('consume(0) is a no-op that returns true', async function () {
          await this.mock.consume(42n);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);

          await expect(this.mock.tryConsume(0n))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_RefillingBucket_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state()).to.eventually.deep.equal([
            42n - refillPerSecond,
            CAPACITY - 42n + refillPerSecond,
          ]);
          await expect(this.mock.used()).to.eventually.equal(42n - refillPerSecond);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n + refillPerSecond);
        });
      });

      it('refills linearly over time', async function () {
        const wait = 17n;
        const refilled = (wait * CAPACITY) / WINDOW;

        await this.mock.consume(CAPACITY);

        // bucket is empty; advance time by half a window
        await time.increaseBy.timestamp(wait);

        await expect(this.mock.state()).to.eventually.deep.equal([CAPACITY - refilled, refilled]);
        await expect(this.mock.used()).to.eventually.equal(CAPACITY - refilled);
        await expect(this.mock.available()).to.eventually.equal(refilled);
      });

      it('fully refills after a window has elapsed', async function () {
        await this.mock.consume(CAPACITY);
        await time.increaseBy.timestamp(WINDOW);

        await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
        await expect(this.mock.used()).to.eventually.equal(0n);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY);
      });

      it('used does not go below zero', async function () {
        await this.mock.consume(10n);
        await time.increaseBy.timestamp(WINDOW + 1n);

        await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
        await expect(this.mock.used()).to.eventually.equal(0n);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY);
      });

      it('updateSettings freezes accrued usage', async function () {
        // consume the whole bucket
        await this.mock.consume(CAPACITY);

        // wait half a window so half should have refilled
        await time.increaseBy.timestamp(10n);

        await expect(this.mock.state()).to.eventually.deep.equal([
          CAPACITY - 10n * refillPerSecond,
          10n * refillPerSecond,
        ]);
        await expect(this.mock.used()).to.eventually.equal(CAPACITY - 10n * refillPerSecond);
        await expect(this.mock.available()).to.eventually.equal(10n * refillPerSecond);

        // update settings (changes capacity but should keep the current accrued used quantity)
        await this.mock.updateSettings(WINDOW * 2n, CAPACITY * 2n);

        // one more second passed (because of the updateSettings call)
        await expect(this.mock.state()).to.eventually.deep.equal([
          CAPACITY - 11n * refillPerSecond,
          CAPACITY + 11n * refillPerSecond,
        ]);
        await expect(this.mock.used()).to.eventually.equal(CAPACITY - 11n * refillPerSecond);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY + 11n * refillPerSecond);
      });

      it('reset clears used', async function () {
        await this.mock.consume(CAPACITY / 2n);

        await this.mock.reset();

        await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
        await expect(this.mock.used()).to.eventually.equal(0n);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY);
      });

      it('window saturation prevents underflow when block.timestamp < window', async function () {
        // computing state with a window larger than block.timestamp must not revert
        await this.mock.updateSettings(MAX_UINT48, CAPACITY);
        await expect(this.mock.state()).to.not.be.reverted;
      });
    });
  });

  describe('SlidingWindow', function () {
    beforeEach(async function () {
      Object.assign(this.mock, wrap(this.mock, 'SlidingWindow'));
    });

    it('starts empty', async function () {
      await expect(this.mock.state()).to.eventually.deep.equal([0n, 0n]);
      await expect(this.mock.used()).to.eventually.equal(0n);
      await expect(this.mock.available()).to.eventually.equal(0n);
    });

    describe('with some capacity', function () {
      beforeEach(async function () {
        await this.mock.updateSettings(WINDOW, CAPACITY);
      });

      it('reports full limit available', async function () {
        await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
        await expect(this.mock.used()).to.eventually.equal(0n);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY);
      });

      describe('consume', function () {
        it('consume reduces available and increases used', async function () {
          await this.mock.consume(17n);

          await expect(this.mock.state()).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used()).to.eventually.equal(17n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 17n);
        });

        it('consume one key does not affect another key', async function () {
          const key1 = ethers.id('key1');
          const key2 = ethers.id('key2');

          await expect(this.mock.state(key1)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key1)).to.eventually.equal(0n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await this.mock.consume(17n, key1);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await this.mock.consume(42n, key2);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used(key2)).to.eventually.equal(42n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY - 42n);
        });

        it('multiple consume accumulate within the window', async function () {
          await this.mock.consume(100n);
          await this.mock.consume(200n);
          await this.mock.consume(50n);

          await expect(this.mock.state()).to.eventually.deep.equal([350n, CAPACITY - 350n]);
          await expect(this.mock.used()).to.eventually.equal(350n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 350n);
        });

        it('consume reverts when over limit', async function () {
          await expect(this.mock.consume(CAPACITY + 1n)).to.be.revertedWithCustomError(this.mock, 'RateLimitExceeded');
        });

        it('consume(0) is a no-op that returns true', async function () {
          await this.mock.consume(42n);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);

          await this.mock.consume(0n);

          // one second passed so we have to account for the auto refill
          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);
        });
      });

      describe('tryConsume', function () {
        it('tryConsume reduces available and increases used', async function () {
          // Static
          await expect(this.mock.tryConsumeStatic(42n)).to.eventually.be.true;

          // execute (and get event)
          await expect(this.mock.tryConsume(42n))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_SlidingWindow_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);
        });

        it('tryConsume one key does not affect another key', async function () {
          const key1 = ethers.id('key1');
          const key2 = ethers.id('key2');

          await expect(this.mock.state(key1)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key1)).to.eventually.equal(0n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await expect(this.mock.tryConsume(17n, key1))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_SlidingWindow_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used(key2)).to.eventually.equal(0n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY);

          await expect(this.mock.tryConsume(42n, key2))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_SlidingWindow_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state(key1)).to.eventually.deep.equal([17n, CAPACITY - 17n]);
          await expect(this.mock.used(key1)).to.eventually.equal(17n);
          await expect(this.mock.available(key1)).to.eventually.equal(CAPACITY - 17n);
          await expect(this.mock.state(key2)).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used(key2)).to.eventually.equal(42n);
          await expect(this.mock.available(key2)).to.eventually.equal(CAPACITY - 42n);
        });

        it('multiple tryConsume accumulate within the window', async function () {
          await this.mock.tryConsume(100n);
          await this.mock.tryConsume(200n);
          await this.mock.tryConsume(50n);

          await expect(this.mock.state()).to.eventually.deep.equal([350n, CAPACITY - 350n]);
          await expect(this.mock.used()).to.eventually.equal(350n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 350n);
        });

        it('tryConsume returns false and does not update state when over capacity', async function () {
          // Static
          await expect(this.mock.tryConsumeStatic(CAPACITY + 1n)).to.eventually.be.false;

          // execute (and get event)
          await expect(this.mock.tryConsume(CAPACITY + 1n))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_SlidingWindow_bytes32_uint256')
            .withArgs(false);

          await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
          await expect(this.mock.used()).to.eventually.equal(0n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY);
        });

        it('consume(0) is a no-op that returns true', async function () {
          await this.mock.consume(42n);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);

          await expect(this.mock.tryConsume(0n))
            .to.emit(this.mock, 'return$tryConsume_RateLimiter_SlidingWindow_bytes32_uint256')
            .withArgs(true);

          await expect(this.mock.state()).to.eventually.deep.equal([42n, CAPACITY - 42n]);
          await expect(this.mock.used()).to.eventually.equal(42n);
          await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);
        });
      });

      it('past consumptions drop out after the window elapses', async function () {
        await this.mock.consume(CAPACITY / 2n);

        // step past the window
        await time.increaseBy.timestamp(WINDOW + 1n);

        await expect(this.mock.state()).to.eventually.deep.equal([0n, CAPACITY]);
        await expect(this.mock.used()).to.eventually.equal(0n);
        await expect(this.mock.available()).to.eventually.equal(CAPACITY);
      });

      it('only consumptions outside the window drop out', async function () {
        // first batch
        await this.mock.consume(17n);

        // second batch, half-a-window later
        await time.increaseBy.timestamp(WINDOW / 2n);
        await this.mock.consume(42n);

        // both still within the window
        await expect(this.mock.available()).to.eventually.equal(CAPACITY - 59n);
        await expect(this.mock.used()).to.eventually.equal(59n); // 17n + 42n

        // step forward so the first consume falls out but the second is still in-window
        await time.increaseBy.timestamp(WINDOW / 2n + 5n);

        await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);
        await expect(this.mock.used()).to.eventually.equal(42n);
      });

      it('updateSettings does not modify recorded history', async function () {
        await this.mock.consume(42n);

        await expect(this.mock.available()).to.eventually.equal(CAPACITY - 42n);
        await expect(this.mock.used()).to.eventually.equal(42n);

        await this.mock.updateSettings(WINDOW * 2n, CAPACITY * 2n);

        // used reflects existing checkpoints, only the new limit/window applies going forward
        await expect(this.mock.available()).to.eventually.equal(2n * CAPACITY - 42n);
        await expect(this.mock.used()).to.eventually.equal(42n);
      });

      it('reset clears the history', async function () {
        await this.mock.consume(CAPACITY / 2n);
        await this.mock.reset();

        expect(await this.mock.used()).to.equal(0n);
        expect(await this.mock.available()).to.equal(CAPACITY);
      });

      it('window saturation prevents underflow when block.timestamp < window', async function () {
        // computing state with a window larger than block.timestamp must not revert
        await this.mock.updateSettings(MAX_UINT48, CAPACITY);
        await expect(this.mock.state()).to.not.be.reverted;
      });
    });
  });
});
