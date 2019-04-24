const { BN, balance, ether, shouldFail, time } = require('openzeppelin-test-helpers');

const SampleCrowdsale = artifacts.require('SampleCrowdsale');
const SampleCrowdsaleToken = artifacts.require('SampleCrowdsaleToken');

contract('SampleCrowdsale', function ([_, deployer, owner, wallet, investor]) {
  const RATE = new BN(10);
  const GOAL = ether('10');
  const CAP = ether('20');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.weeks(1));
    this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));

    this.token = await SampleCrowdsaleToken.new({ from: deployer });
    this.crowdsale = await SampleCrowdsale.new(
      this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, GOAL,
      { from: owner }
    );

    await this.token.addMinter(this.crowdsale.address, { from: deployer });
    await this.token.renounceMinter({ from: deployer });
  });

  it('should create crowdsale with correct parameters', async function () {
    (await this.crowdsale.openingTime()).should.be.bignumber.equal(this.openingTime);
    (await this.crowdsale.closingTime()).should.be.bignumber.equal(this.closingTime);
    (await this.crowdsale.rate()).should.be.bignumber.equal(RATE);
    (await this.crowdsale.wallet()).should.be.equal(wallet);
    (await this.crowdsale.goal()).should.be.bignumber.equal(GOAL);
    (await this.crowdsale.cap()).should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await shouldFail.reverting.withMessage(this.crowdsale.send(ether('1')), 'TimedCrowdsale: not open');
    await shouldFail.reverting.withMessage(this.crowdsale.buyTokens(investor, { from: investor, value: ether('1') }),
      'TimedCrowdsale: not open'
    );
  });

  it('should accept payments during the sale', async function () {
    const investmentAmount = ether('1');
    const expectedTokenAmount = RATE.mul(investmentAmount);

    await time.increaseTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: investmentAmount, from: investor });

    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await time.increaseTo(this.afterClosingTime);
    await shouldFail.reverting.withMessage(this.crowdsale.send(ether('1')), 'TimedCrowdsale: not open');
    await shouldFail.reverting.withMessage(this.crowdsale.buyTokens(investor, { value: ether('1'), from: investor }),
      'TimedCrowdsale: not open'
    );
  });

  it('should reject payments over cap', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(CAP);
    await shouldFail.reverting.withMessage(this.crowdsale.send(1), 'CappedCrowdsale: cap exceeded');
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(GOAL);

    const balanceTracker = await balance.tracker(wallet);
    await time.increaseTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    (await balanceTracker.delta()).should.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function () {
    const balanceTracker = await balance.tracker(investor);

    await time.increaseTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: ether('1'), from: investor, gasPrice: 0 });
    await time.increaseTo(this.afterClosingTime);

    await this.crowdsale.finalize({ from: owner });
    await this.crowdsale.claimRefund(investor, { gasPrice: 0 });

    (await balanceTracker.delta()).should.be.bignumber.equal('0');
  });

  describe('when goal > cap', function () {
    // goal > cap
    const HIGH_GOAL = ether('30');

    it('creation reverts', async function () {
      await shouldFail.reverting.withMessage(SampleCrowdsale.new(
        this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, HIGH_GOAL
      ), 'SampleCrowdSale: goal is greater than cap');
    });
  });
});
