import { getBalance } from './helpers/balance';
import expectEvent from './helpers/expectEvent';

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const SecureTargetBounty = artifacts.require('SecureTargetBounty');
const InsecureTargetBounty = artifacts.require('InsecureTargetBounty');

const reward = new web3.BigNumber(web3.toWei(1, 'ether'));

contract('Bounty', function ([_, owner, researcher]) {
  it('sets reward', async function () {
    const bounty = await SecureTargetBounty.new();
    await bounty.sendTransaction({ from: owner, value: reward });

    const balance = await getBalance(bounty.address);
    balance.should.be.bignumber.eq(reward);
  });

  it('empties itself when destroyed', async function () {
    const bounty = await SecureTargetBounty.new();
    await bounty.sendTransaction({ from: owner, value: reward });

    const balance = await getBalance(bounty.address);
    balance.should.be.bignumber.eq(reward);

    await bounty.destroy();
    const newBalance = await getBalance(bounty.address);
    newBalance.should.be.bignumber.eq(0);
  });

  describe('Against secure contract', function () {
    it('cannot claim reward', async function () {
      const bounty = await SecureTargetBounty.new();

      const { logs } = await bounty.createTarget({ from: researcher });
      await expectEvent.inLogs(logs, 'TargetCreated');

      const targetAddress = logs[0].args.createdAddress;
      await bounty.sendTransaction({ from: owner, value: reward });

      let balance = await getBalance(bounty.address);
      balance.should.be.bignumber.eq(reward);

      try {
        await bounty.claim(targetAddress, { from: researcher });

        assert.isTrue(false); // should never reach here
      } catch (error) {
        const reClaimedBounty = await bounty.claimed.call();
        reClaimedBounty.should.eq(false);
      }
      try {
        await bounty.withdrawPayments({ from: researcher });
        assert.isTrue(false); // should never reach here
      } catch (err) {
        balance = await getBalance(bounty.address);
        balance.should.be.bignumber.eq(reward);
      }
    });
  });

  describe('Against broken contract', function () {
    it('claims reward', async function () {
      const bounty = await InsecureTargetBounty.new();
      const { logs } = await bounty.createTarget({ from: researcher });
      await expectEvent.inLogs(logs, 'TargetCreated');
      let targetAddress = logs[0].args.createdAddress;
      await bounty.sendTransaction({ from: owner, value: reward });

      let balance = await getBalance(bounty.address);
      balance.should.be.bignumber.eq(reward);

      await bounty.claim(targetAddress, { from: researcher });
      const claim = await bounty.claimed.call();

      claim.should.eq(true);

      await bounty.withdrawPayments({ from: researcher });

      balance = await getBalance(bounty.address);
      balance.should.be.bignumber.eq(0);
    });
  });
});
