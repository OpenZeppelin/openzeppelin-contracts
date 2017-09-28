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

contract('TokenVesting', function ([_, owner, beneficiary]) {

  const amount = new BigNumber(1000);

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });

    this.cliff = latestTime() + duration.years(1);
    this.end = latestTime() + duration.years(2);

    this.vesting = await TokenVesting.new(beneficiary, this.cliff, this.end, true, { from: owner });

    this.start = latestTime(); // gets the timestamp at construction

    await this.token.mint(this.vesting.address, amount, { from: owner });
  });

  it('cannot be released before cliff', async function () {
    await this.vesting.release(this.token.address).should.be.rejectedWith(EVMThrow);
  });

  it('can be released after cliff', async function () {
    await increaseTimeTo(this.cliff + duration.weeks(1));
    await this.vesting.release(this.token.address).should.be.fulfilled;
  });

  it('should release proper amount after cliff', async function () {
    await increaseTimeTo(this.cliff);

    const { receipt } = await this.vesting.release(this.token.address);
    const releaseTime = web3.eth.getBlock(receipt.blockNumber).timestamp;

    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount.mul(releaseTime - this.start).div(this.end - this.start).floor());
  });

  it('should linearly release tokens during vesting period', async function () {
    const duration = this.end - this.cliff;
    const checkpoints = 4;

    for (let i = 1; i <= checkpoints; i++) {
      const now = this.cliff + i * (duration / checkpoints);
      await increaseTimeTo(now);

      const vested = await this.vesting.vestedAmount(this.token.address);
      const expectedVesting = amount.mul(now - this.start).div(this.end - this.start).floor();

      vested.should.bignumber.equal(expectedVesting);
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.end);
    await this.vesting.release(this.token.address);
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount);
  });

  it('should be revoked by owner if revocable is set', async function () {
    const vesting = await TokenVesting.new(beneficiary, this.cliff, this.end, true, { from: owner } );
    await vesting.revoke(this.token.address, { from: owner }).should.be.fulfilled;
  });

  it('should fail to be revoked by owner if revocable not set', async function () {
    const vesting = await TokenVesting.new(beneficiary, this.cliff, this.end, false, { from: owner } );
    await vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMThrow);
  });

  it('should return the non-vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.cliff + duration.weeks(1));
    await this.vesting.release(this.token.address);

    const vested = await this.vesting.vestedAmount(this.token.address);
    const balance = await this.token.balanceOf(this.vesting.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const ownerBalance = await this.token.balanceOf(owner);
    ownerBalance.should.bignumber.equal(balance.sub(vested));
  });

  it('should keep the vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.cliff + duration.weeks(1));
    await this.vesting.release(this.token.address);

    const vested = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const balance = await this.token.balanceOf(this.vesting.address);
    balance.should.bignumber.equal(vested);
  });

});
