const { ether } = require('../helpers/ether');
const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { assertRevert } = require('../helpers/assertRevert');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const SampleCrowdsale = artifacts.require('SampleCrowdsale');
const SampleCrowdsaleToken = artifacts.require('SampleCrowdsaleToken');

contract('SampleCrowdsale', function ([_, deployer, owner, wallet, investor]) {
  const RATE = new BigNumber(10);
  const GOAL = ether(10);
  const CAP = ether(20);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

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
    await expectThrow(
      this.crowdsale.send(ether(1)),
      EVMRevert,
    );
    await expectThrow(
      this.crowdsale.buyTokens(investor, { from: investor, value: ether(1) }),
      EVMRevert,
    );
  });

  it('should accept payments during the sale', async function () {
    const investmentAmount = ether(1);
    const expectedTokenAmount = RATE.mul(investmentAmount);

    await increaseTimeTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: investmentAmount, from: investor });

    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await expectThrow(this.crowdsale.send(ether(1)), EVMRevert);
    await expectThrow(this.crowdsale.buyTokens(investor, { value: ether(1), from: investor }), EVMRevert);
  });

  it('should reject payments over cap', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.send(CAP);
    await expectThrow(this.crowdsale.send(1), EVMRevert);
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.send(GOAL);

    const beforeFinalization = await ethGetBalance(wallet);
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    const afterFinalization = await ethGetBalance(wallet);

    afterFinalization.minus(beforeFinalization).should.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function () {
    const balanceBeforeInvestment = await ethGetBalance(investor);

    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: ether(1), from: investor, gasPrice: 0 });
    await increaseTimeTo(this.afterClosingTime);

    await this.crowdsale.finalize({ from: owner });
    await this.crowdsale.claimRefund(investor, { gasPrice: 0 });

    const balanceAfterRefund = await ethGetBalance(investor);
    balanceBeforeInvestment.should.be.bignumber.equal(balanceAfterRefund);
  });

  describe('when goal > cap', function () {
    // goal > cap
    const HIGH_GOAL = ether(30);

    it('creation reverts', async function () {
      await assertRevert(SampleCrowdsale.new(
        this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, HIGH_GOAL
      ));
    });
  });
});
