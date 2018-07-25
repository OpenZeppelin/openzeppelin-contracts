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

const reward = web3.toWei(1, 'ether');

contract('Bounty', function ([_, owner, researcher]) {
  describe('Against secure contract', function () {
    beforeEach(async function () {
      this.bounty = await SecureTargetBounty.new({ from: owner });
    });

    it('sets reward', async function () {
      await sendReward(owner, this.bounty.address, reward);

      const balance = await ethGetBalance(this.bounty.address);
      balance.should.be.bignumber.eq(reward);
    });

    it('empties itself when destroyed', async function () {
      await sendReward(owner, this.bounty.address, reward);

      const balance = await ethGetBalance(this.bounty.address);
      balance.should.be.bignumber.eq(reward);

      await this.bounty.destroy({ from: owner });

      const updatedBalance = await ethGetBalance(this.bounty.address);
      updatedBalance.should.be.bignumber.eq(0);
    });

    it('cannot claim reward', async function () {
      const result = await this.bounty.createTarget({ from: researcher });
      const event = await expectEvent.inLogs(
        result.logs,
        'TargetCreated'
      );

      const targetAddress = event.args.createdAddress;
      await sendReward(owner, this.bounty.address, reward);

      const balance = await ethGetBalance(this.bounty.address);
      balance.should.be.bignumber.eq(reward);

      await assertRevert(
        this.bounty.claim(targetAddress, { from: researcher }),
      );
    });
  });

  describe('Against broken contract', function () {
    beforeEach(async function () {
      this.bounty = await InsecureTargetBounty.new();
    });

    it('claims reward', async function () {
      const result = await this.bounty.createTarget({ from: researcher });
      const event = await expectEvent.inLogs(result.logs, 'TargetCreated');

      const targetAddress = event.args.createdAddress;
      await sendReward(owner, this.bounty.address, reward);

      const balance = await ethGetBalance(this.bounty.address);
      balance.should.be.bignumber.eq(reward);

      await this.bounty.claim(targetAddress, { from: researcher });
      const claim = await this.bounty.claimed.call();

      claim.should.eq(true);

      await this.bounty.withdrawPayments({ from: researcher });
      const updatedBalance = await ethGetBalance(this.bounty.address);
      updatedBalance.should.be.bignumber.eq(0);
    });
  });
});
