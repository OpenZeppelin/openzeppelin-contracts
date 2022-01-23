const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const TimedCrowdsaleImpl = contract.fromArtifact('TimedCrowdsaleImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');

describe('TimedCrowdsale', function () {
  const [ investor, wallet, purchaser ] = accounts;

  const rate = new BN(1);
  const value = ether('42');
  const tokenSupply = new BN('10').pow(new BN('22'));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.weeks(1));
    this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));
    this.token = await SimpleToken.new();
  });

  it('reverts if the opening time is in the past', async function () {
    await expectRevert(TimedCrowdsaleImpl.new(
      (await time.latest()).sub(time.duration.days(1)), this.closingTime, rate, wallet, this.token.address
    ), 'TimedCrowdsale: opening time is before current time');
  });

  it('reverts if the closing time is before the opening time', async function () {
    await expectRevert(TimedCrowdsaleImpl.new(
      this.openingTime, this.openingTime.sub(time.duration.seconds(1)), rate, wallet, this.token.address
    ), 'TimedCrowdsale: opening time is not before closing time');
  });

  it('reverts if the closing time equals the opening time', async function () {
    await expectRevert(TimedCrowdsaleImpl.new(
      this.openingTime, this.openingTime, rate, wallet, this.token.address
    ), 'TimedCrowdsale: opening time is not before closing time');
  });

  context('with crowdsale', function () {
    beforeEach(async function () {
      this.crowdsale = await TimedCrowdsaleImpl.new(
        this.openingTime, this.closingTime, rate, wallet, this.token.address
      );
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    it('should be ended only after end', async function () {
      expect(await this.crowdsale.hasClosed()).to.equal(false);
      await time.increaseTo(this.afterClosingTime);
      expect(await this.crowdsale.isOpen()).to.equal(false);
      expect(await this.crowdsale.hasClosed()).to.equal(true);
    });

    describe('accepting payments', function () {
      it('should reject payments before start', async function () {
        expect(await this.crowdsale.isOpen()).to.equal(false);
        await expectRevert(this.crowdsale.send(value), 'TimedCrowdsale: not open');
        await expectRevert(this.crowdsale.buyTokens(investor, { from: purchaser, value: value }),
          'TimedCrowdsale: not open'
        );
      });

      it('should accept payments after start', async function () {
        await time.increaseTo(this.openingTime);
        expect(await this.crowdsale.isOpen()).to.equal(true);
        await this.crowdsale.send(value);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('should reject payments after end', async function () {
        await time.increaseTo(this.afterClosingTime);
        await expectRevert(this.crowdsale.send(value), 'TimedCrowdsale: not open');
        await expectRevert(this.crowdsale.buyTokens(investor, { value: value, from: purchaser }),
          'TimedCrowdsale: not open'
        );
      });
    });

    describe('extending closing time', function () {
      it('should not reduce duration', async function () {
        // Same date
        await expectRevert(this.crowdsale.extendTime(this.closingTime),
          'TimedCrowdsale: new closing time is before current closing time'
        );

        // Prescending date
        const newClosingTime = this.closingTime.sub(time.duration.seconds(1));
        await expectRevert(this.crowdsale.extendTime(newClosingTime),
          'TimedCrowdsale: new closing time is before current closing time'
        );
      });

      context('before crowdsale start', function () {
        beforeEach(async function () {
          expect(await this.crowdsale.isOpen()).to.equal(false);
          await expectRevert(this.crowdsale.send(value), 'TimedCrowdsale: not open');
        });

        it('it extends end time', async function () {
          const newClosingTime = this.closingTime.add(time.duration.days(1));
          const { logs } = await this.crowdsale.extendTime(newClosingTime);
          expectEvent.inLogs(logs, 'TimedCrowdsaleExtended', {
            prevClosingTime: this.closingTime,
            newClosingTime: newClosingTime,
          });
          expect(await this.crowdsale.closingTime()).to.be.bignumber.equal(newClosingTime);
        });
      });

      context('after crowdsale start', function () {
        beforeEach(async function () {
          await time.increaseTo(this.openingTime);
          expect(await this.crowdsale.isOpen()).to.equal(true);
          await this.crowdsale.send(value);
        });

        it('it extends end time', async function () {
          const newClosingTime = this.closingTime.add(time.duration.days(1));
          const { logs } = await this.crowdsale.extendTime(newClosingTime);
          expectEvent.inLogs(logs, 'TimedCrowdsaleExtended', {
            prevClosingTime: this.closingTime,
            newClosingTime: newClosingTime,
          });
          expect(await this.crowdsale.closingTime()).to.be.bignumber.equal(newClosingTime);
        });
      });

      context('after crowdsale end', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterClosingTime);
        });

        it('it reverts', async function () {
          const newClosingTime = await time.latest();
          await expectRevert(this.crowdsale.extendTime(newClosingTime),
            'TimedCrowdsale: already closed'
          );
        });
      });
    });
  });
});
