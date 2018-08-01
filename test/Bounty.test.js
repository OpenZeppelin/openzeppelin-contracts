const { ethGetBalance, ethSendTransaction } = require('./helpers/web3');
const expectEvent = require('./helpers/expectEvent');
const { assertRevert } = require('./helpers/assertRevert');

const SecureTargetBounty = artifacts.require('SecureTargetBounty');
const InsecureTargetBounty = artifacts.require('InsecureTargetBounty');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const sendReward = async (from, to, value) => ethSendTransaction({
  from,
  to,
  value,
});

const reward = new web3.BigNumber(web3.toWei(1, 'ether'));

contract('Bounty', function ([_, owner, researcher]) {
  context('against secure contract', function () {
    beforeEach(async function () {
      this.bounty = await SecureTargetBounty.new({ from: owner });
    });

    it('can set reward', async function () {
      await sendReward(owner, this.bounty.address, reward);

      const balance = await ethGetBalance(this.bounty.address);
      balance.should.be.bignumber.eq(reward);
    });

    context('with reward', function () {
      beforeEach(async function () {
        const result = await this.bounty.createTarget({ from: researcher });
        const event = await expectEvent.inLogs(result.logs, 'TargetCreated');

        this.targetAddress = event.args.createdAddress;

        await sendReward(owner, this.bounty.address, reward);

        const balance = await ethGetBalance(this.bounty.address);
        balance.should.be.bignumber.eq(reward);
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
      this.bounty = await InsecureTargetBounty.new();

      const result = await this.bounty.createTarget({ from: researcher });
      const event = await expectEvent.inLogs(result.logs, 'TargetCreated');

      this.targetAddress = event.args.createdAddress;
      await sendReward(owner, this.bounty.address, reward);
    });

    it('can claim reward', async function () {
      await this.bounty.claim(this.targetAddress, { from: researcher });
      const claim = await this.bounty.claimed();

      claim.should.eq(true);

      const researcherPrevBalance = await ethGetBalance(researcher);

      const gas = await this.bounty.withdrawPayments.estimateGas({ from: researcher });
      const gasPrice = web3.toWei(1, 'gwei');
      const gasCost = (new web3.BigNumber(gas)).times(gasPrice);

      await this.bounty.withdrawPayments({ from: researcher, gasPrice: gasPrice });
      const updatedBalance = await ethGetBalance(this.bounty.address);
      updatedBalance.should.be.bignumber.eq(0);

      const researcherCurrBalance = await ethGetBalance(researcher);
      researcherCurrBalance.sub(researcherPrevBalance).should.be.bignumber.eq(reward.sub(gasCost));
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
