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

    this.vesting = await TokenVesting.new(beneficiary, this.cliff, this.end, { from: owner });

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

  it('should have released all after end', async function () {
    await increaseTimeTo(this.end);
    await this.vesting.release(this.token.address);
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount);
  });

});
