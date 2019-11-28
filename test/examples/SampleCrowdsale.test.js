const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, balance, ether, expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const SampleCrowdsale = contract.fromArtifact('SampleCrowdsale');
const SampleCrowdsaleToken = contract.fromArtifact('SampleCrowdsaleToken');

describe('SampleCrowdsale', function () {
  const [ deployer, owner, wallet, investor ] = accounts;

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
    expect(await this.crowdsale.openingTime()).to.be.bignumber.equal(this.openingTime);
    expect(await this.crowdsale.closingTime()).to.be.bignumber.equal(this.closingTime);
    expect(await this.crowdsale.rate()).to.be.bignumber.equal(RATE);
    expect(await this.crowdsale.wallet()).to.equal(wallet);
    expect(await this.crowdsale.goal()).to.be.bignumber.equal(GOAL);
    expect(await this.crowdsale.cap()).to.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await expectRevert(this.crowdsale.send(ether('1')), 'TimedCrowdsale: not open');
    await expectRevert(this.crowdsale.buyTokens(investor, { from: investor, value: ether('1') }),
      'TimedCrowdsale: not open'
    );
  });

  it('should accept payments during the sale', async function () {
    const investmentAmount = ether('1');
    const expectedTokenAmount = RATE.mul(investmentAmount);

    await time.increaseTo(this.openingTime);
    await this.crowdsale.buyTokens(investor, { value: investmentAmount, from: investor });

    expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(expectedTokenAmount);
    expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await time.increaseTo(this.afterClosingTime);
    await expectRevert(this.crowdsale.send(ether('1')), 'TimedCrowdsale: not open');
    await expectRevert(this.crowdsale.buyTokens(investor, { value: ether('1'), from: investor }),
      'TimedCrowdsale: not open'
    );
  });

  it('should reject payments over cap', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(CAP);
    await expectRevert(this.crowdsale.send(1), 'CappedCrowdsale: cap exceeded');
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
    await time.increaseTo(this.openingTime);
    await this.crowdsale.send(GOAL);

    const balanceTracker = await balance.tracker(wallet);
    await time.increaseTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    expect(await balanceTracker.delta()).to.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function () {
    const balanceTracker = await balance.tracker(investor);

    await time.increaseTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: ether('1'), from: investor, gasPrice: 0 });
    await time.increaseTo(this.afterClosingTime);

    await this.crowdsale.finalize({ from: owner });
    await this.crowdsale.claimRefund(investor, { gasPrice: 0 });

    expect(await balanceTracker.delta()).to.be.bignumber.equal('0');
  });

  describe('when goal > cap', function () {
    // goal > cap
    const HIGH_GOAL = ether('30');

    it('creation reverts', async function () {
      await expectRevert(SampleCrowdsale.new(
        this.openingTime, this.closingTime, RATE, wallet, CAP, this.token.address, HIGH_GOAL
      ), 'SampleCrowdSale: goal is greater than cap');
    });
  });
});
