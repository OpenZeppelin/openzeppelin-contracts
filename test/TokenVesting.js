const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

import EVMThrow from './helpers/EVMThrow'
import latestTime from './helpers/latestTime';
import {increaseTimeTo, duration} from './helpers/increaseTime';

const MintableToken = artifacts.require('MintableToken');
const TokenVesting = artifacts.require('TokenVesting');

contract('TokenVesting', function ([_, owner, beneficiary, unknown, thirdParty]) {

  const amount = new BigNumber(1000);

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });

    this.start = latestTime() + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.cliff = duration.years(1);
    this.duration = duration.years(2);

    this.vesting = await TokenVesting.new(beneficiary, this.start, this.cliff, this.duration, true, this.token.address, { from: owner });

    await this.token.mint(this.vesting.address, amount, { from: owner });
  });

  it('cannot be released before cliff', async function () {
    await this.vesting.release({ from: beneficiary }).should.be.rejectedWith(EVMThrow);
  });

  it('can be released after cliff', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(1));
    await this.vesting.release({ from: beneficiary }).should.be.fulfilled;
  });

  it('release cannot be called by an unknown', async function() {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(1));
    await this.vesting.release({ from: unknown }).should.be.rejectedWith(EVMThrow);
  });

  it('should release proper amount after cliff', async function () {
    await increaseTimeTo(this.start + this.cliff);

    const { receipt } = await this.vesting.release({ from: beneficiary });
    const releaseTime = web3.eth.getBlock(receipt.blockNumber).timestamp;

    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount.mul(releaseTime - this.start).div(this.duration).floor());
  });

  it('should linearly release tokens during vesting period', async function () {
    const vestingPeriod = this.duration - this.cliff;
    const checkpoints = 4;

    for (let i = 1; i <= checkpoints; i++) {
      const now = this.start + this.cliff + i * (vestingPeriod / checkpoints);
      await increaseTimeTo(now);

      await this.vesting.release({ from: beneficiary });
      const balance = await this.token.balanceOf(beneficiary);
      const expectedVesting = amount.mul(now - this.start).div(this.duration).floor();

      balance.should.bignumber.equal(expectedVesting);
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.start + this.duration);
    await this.vesting.release({ from: beneficiary });
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount);
  });

  it('should be revocable by owner', async function () {
    await this.vesting.revoke({ from: owner }).should.be.fulfilled;
  });

  it('should fail to be revoked by owner if revocable not set', async function () {
    const vesting = await TokenVesting.new(
      beneficiary, this.start, this.cliff, this.duration, false, this.token.address, { from: owner }
    );
    await vesting.revoke({ from: owner }).should.be.rejectedWith(EVMThrow);
  });

  it('should return the non-vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(1));
    await this.vesting.release({ from: beneficiary });

    const vested = await this.vesting.vestedAmount();
    const balance = await this.token.balanceOf(this.vesting.address);

    await this.vesting.revoke({ from: owner });

    const ownerBalance = await this.token.balanceOf(owner);
    ownerBalance.should.bignumber.equal(balance.sub(vested));
  });

  it('should return the vested tokens to the beneficiary when revoked by owner', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(1));
    const claimed = await this.vesting.vestedAmount();

    await this.vesting.release({ from: beneficiary });

    await increaseTimeTo(this.start + this.cliff + duration.weeks(2));

    const vested = await this.vesting.vestedAmount();
    await this.vesting.revoke({ from: owner });

    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(vested.plus(claimed));
  });

  it('should allow the beneficiary to change the beneficiary\'s address', async function () {
    await this.vesting.changeBeneficiary(thirdParty, { from: beneficiary }).should.be.fulfilled;
    const newBeneficiary = await this.vesting.beneficiary()
    newBeneficiary.should.equal(thirdParty);
  });

  it('random user can\'t change the beneficiary', async function () {
    await this.vesting.changeBeneficiary(thirdParty, { from: unknown })
      .should.be.rejectedWith(EVMThrow);
  });

  it('should reject payments', async function () {
    await this.vesting.sendTransaction({ from: _, value: 1 }).should.be.rejectedWith(EVMThrow);
  });

  it('should prevent beneficiary change to the null address', async function () {
    await this.vesting.changeBeneficiary(0, { from: beneficiary }).should.be.rejectedWith(EVMThrow);
  });

  it('allows withdraws of tokens other than the one vested', async function () {
    const amount = 100
    const token2 = await MintableToken.new({ from: owner });
    await token2.mint(this.vesting.address, amount, { from: owner });
    await this.vesting.releaseToken(token2.address, amount, { from: owner });

    const balance = await token2.balanceOf(owner);
    balance.should.bignumber.equal(amount);
  });
});
