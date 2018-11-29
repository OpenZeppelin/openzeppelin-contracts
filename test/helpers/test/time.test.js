const time = require('../time');
const shouldFail = require('../shouldFail');

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

describe('time', function () {
  const TOLERANCE_SECONDS = 1;

  describe('duration', function () {
    it('converts seconds to seconds', function () {
      time.duration.seconds(1).should.equal(1);
    });

    it('converts minutes to seconds', function () {
      time.duration.minutes(1).should.equal(60);
    });

    it('converts hours to seconds', function () {
      time.duration.hours(1).should.equal(60 * 60);
    });

    it('converts days to seconds', function () {
      time.duration.days(1).should.equal(60 * 60 * 24);
    });

    it('converts weeks to seconds', function () {
      time.duration.weeks(1).should.equal(60 * 60 * 24 * 7);
    });

    it('converts years to seconds', function () {
      time.duration.years(1).should.equal(60 * 60 * 24 * 365);
    });
  });

  describe('advanceBlock', function () {
    it('increases the block number by one', async function () {
      const startingBlock = web3.eth.blockNumber;
      await time.advanceBlock();
      web3.eth.blockNumber.should.be.bignumber.equal(startingBlock + 1);
    });
  });

  context('with starting time', function () {
    beforeEach(async function () {
      await time.advanceBlock();
      this.start = await time.latest();
    });

    describe('increase', function () {
      it('increases time by a duration', async function () {
        await time.increase(time.duration.hours(1));

        const end = this.start + time.duration.hours(1);
        (await time.latest()).should.be.closeTo(end, TOLERANCE_SECONDS);
      });

      it('throws with negative durations', async function () {
        await shouldFail(time.increase(-1));
      });
    });

    describe('increaseTo', function () {
      it('increases time to a time in the future', async function () {
        const end = this.start + time.duration.hours(1);
        await time.increaseTo(end);
        (await time.latest()).should.be.closeTo(end, TOLERANCE_SECONDS);
      });

      it('throws with a time in the past', async function () {
        await shouldFail(time.increaseTo(this.start - 30));
      });
    });
  });
});
