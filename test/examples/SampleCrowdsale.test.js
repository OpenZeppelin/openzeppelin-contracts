const { ether } = require('../helpers/ether');
const shouldFail = require('../helpers/shouldFail');
const time = require('../helpers/time');
const { balanceDifference } = require('../helpers/balanceDifference');

const { should, BigNumber } = require('../helpers/setup');

const SampleCrowdsale = artifacts.require('SampleCrowdsale');
const SampleCrowdsaleToken = artifacts.require('SampleCrowdsaleToken');

contract('SampleCrowdsale', function ([_, deployer, owner, wallet, investor]) {
  const RATE = new BigNumber(10);
  const GOAL = ether(10);
  const CAP = ether(20);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()) + time.duration.weeks(1);
    this.closingTime = this.openingTime + time.duration.weeks(1);
    this.afterClosingTime = this.closingTime + time.duration.seconds(1);

    this.token = await SampleCrowdsaleToken.new({ from: deployer });
    this.crowdsale = await SampleCrowdsale.new(
      this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, GOAL,
      { from: owner }
    );

    await this.token.addMinter(this.crowdsale.address, { from: deployer });
    await this.token.renounceMinter({ from: deployer });
  });

  it('should create crowdsale with correct parameters', async function () {
    should.exist(this.crowdsale);
    should.exist(this.token);

    (await this.crowdsale.openingTime()).should.be.bignumber.equal(this.openingTime);
    (await this.crowdsale.closingTime()).should.be.bignumber.equal(this.closingTime);
    (await this.crowdsale.rate()).should.be.bignumber.equal(RATE);
    (await this.crowdsale.wallet()).should.be.equal(wallet);
    (await this.crowdsale.goal()).should.be.bignumber.equal(GOAL);
    (await this.crowdsale.cap()).should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await shouldFail.reverting(this.crowdsale.send(ether(1)));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor, { from: investor, value: ether(1) }));
  });

  it('should accept payments during the sale', async function () {
    const investmentAmount = ether(1);
    const expectedTokenAmount = RATE.mul(investmentAmount);

    await time.increaseTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: investmentAmount, from: investor });

    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await time.increaseTo(this.afterClosingTime);
    await shouldFail.reverting(this.crowdsale.send(ether(1)));
    await shouldFail.reverting(this.crowdsale.buyTokens(investor, { value: ether(1), from: investor }));
  });

  it('should reject payments over cap', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(CAP);
    await shouldFail.reverting(this.crowdsale.send(1));
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(GOAL);

    (await balanceDifference(wallet, async () => {
      await time.increaseTo(this.afterClosingTime);
      await this.crowdsale.finalize({ from: owner });
    })).should.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function () {
    (await balanceDifference(investor, async () => {
      await time.increaseTo(this.openingTime);
      await this.crowdsale.sendTransaction({ value: ether(1), from: investor, gasPrice: 0 });
      await time.increaseTo(this.afterClosingTime);

      await this.crowdsale.finalize({ from: owner });
      await this.crowdsale.claimRefund(investor, { gasPrice: 0 });
    })).should.be.bignumber.equal(0);
  });

  describe('when goal > cap', function () {
    // goal > cap
    const HIGH_GOAL = ether(30);

    it('creation reverts', async function () {
      await shouldFail.reverting(SampleCrowdsale.new(
        this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, HIGH_GOAL
      ));
    });
  });
});
