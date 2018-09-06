const { latestTime } = require('../../helpers/latestTime');
const { increaseTimeTo, duration } = require('../../helpers/increaseTime');
const { expectThrow } = require('../../helpers/expectThrow');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC20Mintable = artifacts.require('ERC20Mintable');
const TokenTimelock = artifacts.require('TokenTimelock');

contract('TokenTimelock', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(100);

  context('with token', function () {
    beforeEach(async function () {
      this.token = await ERC20Mintable.new({ from: owner });
    });

    it('rejects a release time in the past', async function () {
      const pastReleaseTime = (await latestTime()) - duration.years(1);
      await expectThrow(
        TokenTimelock.new(this.token.address, beneficiary, pastReleaseTime)
      );
    });

    context('once deployed', function () {
      beforeEach(async function () {
        this.releaseTime = (await latestTime()) + duration.years(1);
        this.timelock = await TokenTimelock.new(this.token.address, beneficiary, this.releaseTime);
        await this.token.mint(this.timelock.address, amount, { from: owner });
      });

      it('can get state', async function () {
        (await this.timelock.token()).should.be.equal(this.token.address);
        (await this.timelock.beneficiary()).should.be.equal(beneficiary);
        (await this.timelock.releaseTime()).should.be.bignumber.equal(this.releaseTime);
      });

      it('cannot be released before time limit', async function () {
        await expectThrow(this.timelock.release());
      });

      it('cannot be released just before time limit', async function () {
        await increaseTimeTo(this.releaseTime - duration.seconds(3));
        await expectThrow(this.timelock.release());
      });

      it('can be released just after limit', async function () {
        await increaseTimeTo(this.releaseTime + duration.seconds(1));
        await this.timelock.release();
        (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(amount);
      });

      it('can be released after time limit', async function () {
        await increaseTimeTo(this.releaseTime + duration.years(1));
        await this.timelock.release();
        (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(amount);
      });

      it('cannot be released twice', async function () {
        await increaseTimeTo(this.releaseTime + duration.years(1));
        await this.timelock.release();
        await expectThrow(this.timelock.release());
        (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(amount);
      });
    });
  });
});
