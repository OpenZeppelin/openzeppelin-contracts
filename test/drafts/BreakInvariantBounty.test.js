const { ethGetBalance, ethSendTransaction } = require('../helpers/web3');
const expectEvent = require('../helpers/expectEvent');
const { assertRevert } = require('../helpers/assertRevert');

const BreakInvariantBountyMock = artifacts.require('BreakInvariantBountyMock');
const TargetMock = artifacts.require('TargetMock');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const reward = new web3.BigNumber(web3.toWei(1, 'ether'));

contract('BreakInvariantBounty', function ([_, owner, researcher, anyone, nonTarget]) {
  beforeEach(async function () {
    this.bounty = await BreakInvariantBountyMock.new({ from: owner });
  });

  it('can set reward', async function () {
    await ethSendTransaction({ from: owner, to: this.bounty.address, value: reward });
    (await ethGetBalance(this.bounty.address)).should.be.bignumber.equal(reward);
  });

  context('with reward', function () {
    beforeEach(async function () {
      await ethSendTransaction({ from: owner, to: this.bounty.address, value: reward });
    });

    describe('destroy', function () {
      it('returns all balance to the owner', async function () {
        const ownerPreBalance = await ethGetBalance(owner);
        await this.bounty.destroy({ from: owner, gasPrice: 0 });
        const ownerPostBalance = await ethGetBalance(owner);

        (await ethGetBalance(this.bounty.address)).should.be.bignumber.equal(0);
        ownerPostBalance.sub(ownerPreBalance).should.be.bignumber.equal(reward);
      });

      it('reverts when called by anyone', async function () {
        await assertRevert(this.bounty.destroy({ from: anyone }));
      });
    });

    describe('claim', function () {
      it('is initially unclaimed', async function () {
        (await this.bounty.claimed()).should.equal(false);
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

            const researcherPreBalance = await ethGetBalance(researcher);
            await this.bounty.withdrawPayments(researcher);
            const researcherPostBalance = await ethGetBalance(researcher);

            researcherPostBalance.sub(researcherPreBalance).should.be.bignumber.equal(reward);
            (await ethGetBalance(this.bounty.address)).should.be.bignumber.equal(0);
          });

          context('after claiming', async function () {
            beforeEach(async function () {
              await this.bounty.claim(this.target.address, { from: researcher });
            });

            it('is claimed', async function () {
              (await this.bounty.claimed()).should.equal(true);
            });

            it('no longer accepts rewards', async function () {
              await assertRevert(ethSendTransaction({ from: owner, to: this.bounty.address, value: reward }));
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
  });
});
