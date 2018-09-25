const { ethGetBalance, ethSendTransaction } = require('./helpers/web3');
const expectEvent = require('./helpers/expectEvent');
const { assertRevert } = require('./helpers/assertRevert');

const SecureInvariantTargetBounty = artifacts.require('SecureInvariantTargetBounty');
const InsecureInvariantTargetBounty = artifacts.require('InsecureInvariantTargetBounty');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const sendReward = async (from, to, value) => ethSendTransaction({
  from,
  to,
  value,
});

const reward = new web3.BigNumber(web3.toWei(1, 'ether'));

contract('BreakInvariantBounty', function ([_, owner, researcher, nonTarget]) {
  context('against secure contract', function () {
    beforeEach(async function () {
      this.bounty = await SecureInvariantTargetBounty.new({ from: owner });
    });

    it('can set reward', async function () {
      await sendReward(owner, this.bounty.address, reward);

      const balance = await ethGetBalance(this.bounty.address);
      balance.should.be.bignumber.equal(reward);
    });

    context('with reward', function () {
      beforeEach(async function () {
        const result = await this.bounty.createTarget({ from: researcher });
        const event = expectEvent.inLogs(result.logs, 'TargetCreated');

        this.targetAddress = event.args.createdAddress;

        await sendReward(owner, this.bounty.address, reward);

        const balance = await ethGetBalance(this.bounty.address);
        balance.should.be.bignumber.equal(reward);
      });

      it('cannot claim reward', async function () {
        await assertRevert(
          this.bounty.claim(this.targetAddress, { from: researcher }),
        );
      });
    });
  });

  context('against broken contract', function () {
    beforeEach(async function () {
      this.bounty = await InsecureInvariantTargetBounty.new();

      const result = await this.bounty.createTarget({ from: researcher });
      const event = expectEvent.inLogs(result.logs, 'TargetCreated');

      this.targetAddress = event.args.createdAddress;
      await sendReward(owner, this.bounty.address, reward);
    });

    it('can claim reward', async function () {
      await this.bounty.claim(this.targetAddress, { from: researcher });
      const claim = await this.bounty.claimed();

      claim.should.equal(true);

      const researcherPrevBalance = await ethGetBalance(researcher);

      await this.bounty.withdrawPayments(researcher, { gasPrice: 0 });
      const updatedBalance = await ethGetBalance(this.bounty.address);
      updatedBalance.should.be.bignumber.equal(0);

      const researcherCurrBalance = await ethGetBalance(researcher);
      researcherCurrBalance.sub(researcherPrevBalance).should.be.bignumber.equal(reward);
    });

    it('cannot claim reward from non-target', async function () {
      await assertRevert(
        this.bounty.claim(nonTarget, { from: researcher })
      );
    });

    context('reward claimed', function () {
      beforeEach(async function () {
        await this.bounty.claim(this.targetAddress, { from: researcher });
      });

      it('should no longer be payable', async function () {
        await assertRevert(
          sendReward(owner, this.bounty.address, reward)
        );
      });
    });
  });
});
