const { ethGetBalance, ethSendTransaction } = require('./helpers/web3');
const { ether } = require('./helpers/ether');
const { sendEther } = require('./helpers/sendTransaction');
const { balanceDifference } = require('./helpers/balanceDiff');
const expectEvent = require('./helpers/expectEvent');
const { assertRevert } = require('./helpers/assertRevert');

const BreakInvariantBountyMock = artifacts.require('BreakInvariantBountyMock');
const TargetMock = artifacts.require('TargetMock');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const reward = ether(1);

contract('BreakInvariantBounty', function ([_, owner, researcher, anyone, nonTarget]) {
  beforeEach(async function () {
    this.bounty = await BreakInvariantBountyMock.new({ from: owner });
  });

  it('can set reward', async function () {
    await sendEther(owner, this.bounty.address, reward);
    (await ethGetBalance(this.bounty.address)).should.be.bignumber.equal(reward);
  });

  context('with reward', function () {
    beforeEach(async function () {
      await sendEther(owner, this.bounty.address, reward);
    });

    describe('claim', function () {
      it('is initially claimable', async function () {
        (await this.bounty.claimable()).should.equal(true);
      });

      it('can create claimable target', async function () {
        const { logs } = await this.bounty.createTarget({ from: researcher });
        expectEvent.inLogs(logs, 'TargetCreated');
      });

      context('with target', async function () {
        beforeEach(async function () {
          const { logs } = await this.bounty.createTarget({ from: researcher });
          const event = expectEvent.inLogs(logs, 'TargetCreated');
          this.target = TargetMock.at(event.args.createdAddress);
        });

        context('before exploiting vulnerability', async function () {
          it('reverts when claiming reward', async function () {
            await assertRevert(this.bounty.claim(this.target.address, { from: researcher }));
          });
        });

        context('after exploiting vulnerability', async function () {
          beforeEach(async function () {
            await this.target.exploitVulnerability({ from: researcher });
          });

          it('sends the reward to the researcher', async function () {
            await this.bounty.claim(this.target.address, { from: anyone });
            (await balanceDifference(researcher, () => this.bounty.withdrawPayments(researcher)))
              .should.be.bignumber.equal(reward);
            (await ethGetBalance(this.bounty.address)).should.be.bignumber.equal(0);
          });

          context('after claiming', async function () {
            beforeEach(async function () {
              await this.bounty.claim(this.target.address, { from: researcher });
            });

            it('is not claimable', async function () {
              (await this.bounty.claimable()).should.equal(false);
            });

            it('no longer accepts rewards', async function () {
              await assertRevert(ethSendTransaction({ from: owner, to: this.bounty.address, value: reward }));
            });

            it('reverts when reclaimed', async function () {
              await assertRevert(this.bounty.claim(this.target.address, { from: researcher }));
            });
          });
        });
      });

      context('with non-target', function () {
        it('reverts when claiming reward', async function () {
          await assertRevert(this.bounty.claim(nonTarget, { from: researcher }));
        });
      });
    });

    describe('cancelBounty', function () {
      context('before canceling', function () {
        it('is claimable', async function () {
          (await this.bounty.claimable()).should.equal(true);
        });

        it('can be canceled by the owner', async function () {
          const { logs } = await this.bounty.cancelBounty({ from: owner });
          expectEvent.inLogs(logs, 'BountyCanceled');
          (await balanceDifference(owner, () => this.bounty.withdrawPayments(owner)))
            .should.be.bignumber.equal(reward);
        });

        it('reverts when canceled by anyone', async function () {
          await assertRevert(this.bounty.cancelBounty({ from: anyone }));
        });
      });

      context('after canceling', async function () {
        beforeEach(async function () {
          await this.bounty.cancelBounty({ from: owner });
        });

        it('is not claimable', async function () {
          (await this.bounty.claimable()).should.equal(false);
        });

        it('no longer accepts rewards', async function () {
          await assertRevert(ethSendTransaction({ from: owner, to: this.bounty.address, value: reward }));
        });

        it('reverts when recanceled', async function () {
          await assertRevert(this.bounty.cancelBounty({ from: owner }));
        });
      });
    });
  });
});
