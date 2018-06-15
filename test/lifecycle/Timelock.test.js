import latestTime from '../helpers/latestTime';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import ether from '../helpers/ether';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const Timelock = artifacts.require('Timelock');

contract('Timelock', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(100);

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });
    this.releaseTime = latestTime() + duration.years(1);
    this.timelock = await Timelock.new(beneficiary, this.releaseTime);
    await this.token.mint(this.timelock.address, amount, { from: owner });
    await web3.eth.sendTransaction({ from: owner, to: this.timelock.address, value: ether(1) });
  });

  it('cannot be released before time limit', async function () {
    await this.timelock.release().should.be.rejected;
    await this.timelock.releaseToken(this.timelock.address).should.be.rejected;
  });

  it('cannot be released just before time limit', async function () {
    await increaseTimeTo(this.releaseTime - duration.seconds(3));
    await this.timelock.release().should.be.rejected;
    await this.timelock.releaseToken(this.token.address).should.be.rejected;
  });

  it('can be released just after limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.seconds(1));
    const etherBalance = web3.eth.getBalance(beneficiary);
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.releaseToken(this.token.address).should.be.fulfilled;

    web3.eth.getBalance(beneficiary).should.be.bignumber.equal(etherBalance.plus(ether(1)));
    const tokenBalance = await this.token.balanceOf(beneficiary);
    tokenBalance.should.be.bignumber.equal(amount);
  });

  it('can be released after time limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    const etherBalance = web3.eth.getBalance(beneficiary);
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.releaseToken(this.token.address).should.be.fulfilled;

    web3.eth.getBalance(beneficiary).should.be.bignumber.equal(etherBalance.plus(ether(1)));
    const tokenBalance = await this.token.balanceOf(beneficiary);
    tokenBalance.should.be.bignumber.equal(amount);
  });

  it('cannot be released with zero amount', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    const etherBalance = web3.eth.getBalance(beneficiary);
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.releaseToken(this.token.address).should.be.fulfilled;

    await this.timelock.release().should.be.rejected;
    await this.timelock.releaseToken(this.token.address).should.be.rejected;
    
    web3.eth.getBalance(beneficiary).should.be.bignumber.equal(etherBalance.plus(ether(1)));
    const tokenBalance = await this.token.balanceOf(beneficiary);
    tokenBalance.should.be.bignumber.equal(amount);
  });
});
