import expectEvent from '../../helpers/expectEvent';
import latestTime from '../../helpers/latestTime';
import { increaseTimeTo, duration } from '../../helpers/increaseTime';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const TokenTimelock = artifacts.require('TokenTimelock');

contract('TokenTimelock', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(100);

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });
    this.releaseTime = latestTime() + duration.years(1);
    this.timelock = await TokenTimelock.new(
      this.token.address,
      beneficiary,
      this.releaseTime
    );
    await this.token.mint(this.timelock.address, amount, { from: owner });
  });

  it('cannot be released before release time', async function () {
    await this.timelock.release().should.be.rejected;
  });

  it('cannot be released just before release time', async function () {
    await increaseTimeTo(this.releaseTime - duration.seconds(3));
    await this.timelock.release().should.be.rejected;
  });

  it('can be released at release limit', async function () {
    // increaseTimeTo doesn't allow for high precision, must target 1 second after release time
    await increaseTimeTo(this.releaseTime + duration.seconds(1));
    expectEvent.inTransaction(
      this.timelock.release().should.be.fulfilled,
      'Released'
    );
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });

  it('can be released after release time', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    expectEvent.inTransaction(
      await this.timelock.release().should.be.fulfilled,
      'Released'
    );
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });

  it('cannot be released twice', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.release().should.be.rejected;
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });
});
