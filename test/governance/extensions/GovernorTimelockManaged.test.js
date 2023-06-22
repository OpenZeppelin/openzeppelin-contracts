const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const Enums = require('../../helpers/enums');
const { selector } = require('../../helpers/methods');
const { GovernorHelper } = require('../../helpers/governance');
const { clockFromReceipt } = require('../../helpers/time');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

const AccessManager = artifacts.require('$AccessManager');
const Timelock = artifacts.require('TimelockConditionManaged');
const Governor = artifacts.require('$GovernorTimelockManagedMock');
const CallReceiver = artifacts.require('CallReceiverMock');

const TOKENS = [
  { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
];

// ACCESSCONTROL
const mask = (...groups) =>
  '0x' +
  groups
    .map(g => 1n << BigInt(g))
    .reduce((acc, mask) => acc | mask, 0n)
    .toString(16)
    .padStart(64, 0);

const ADMIN_GROUP = 0;
const TIMELOCK_GROUP = 1;
const PUBLIC_GROUP = 255;

contract('GovernorTimelockManaged', function (accounts) {
  const [owner, voter1, voter2, voter3, voter4, other] = accounts;

  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = web3.utils.toBN(4);
  const votingPeriod = web3.utils.toBN(16);
  const value = web3.utils.toWei('1');

  for (const { mode, Token } of TOKENS) {
    describe(`using ${Token._json.contractName}`, function () {
      beforeEach(async function () {
        this.token = await Token.new(tokenName, tokenSymbol, tokenName, version);
        this.manager = await AccessManager.new(owner);
        this.timelock = await Timelock.new(this.manager.address, 60); // 1 minute default delay
        this.mock = await Governor.new(
          name,
          votingDelay,
          votingPeriod,
          0,
          this.timelock.address,
          this.token.address,
          0,
        );
        this.receiver = await CallReceiver.new();

        this.helper = new GovernorHelper(this.mock, mode);

        // Configure timelock permission in the AccessManager
        await this.manager.setFunctionAllowedGroup(
          this.timelock.address,
          [
            'schedule(address[],uint256[],bytes[],bytes32)',
            'execute(address[],uint256[],bytes[],bytes32)',
            'cancel(bytes32)',
          ].map(selector),
          TIMELOCK_GROUP,
          true,
          { from: owner },
        );

        // Configure groups in the AccessManager
        await this.manager.grantGroup(TIMELOCK_GROUP, this.mock.address, [], { from: owner });
        await this.manager.grantGroup(TIMELOCK_GROUP, owner, [], { from: owner });
        await this.manager.grantGroup(ADMIN_GROUP, this.mock.address, [this.timelock.address], { from: owner });
        await this.manager.renounceGroup(ADMIN_GROUP, [], { from: owner });

        // Prepare env
        await web3.eth.sendTransaction({ from: owner, to: this.timelock.address, value });

        await this.token.$_mint(owner, tokenSupply);
        await this.helper.delegate({ token: this.token, to: voter1, value: web3.utils.toWei('10') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter2, value: web3.utils.toWei('7') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter3, value: web3.utils.toWei('5') }, { from: owner });
        await this.helper.delegate({ token: this.token, to: voter4, value: web3.utils.toWei('2') }, { from: owner });

        // default proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.address,
              value,
              data: this.receiver.contract.methods.mockFunction().encodeABI(),
            },
          ],
          '<proposal description>',
        );
      });

      shouldSupportInterfaces(['ERC165', 'Governor', 'GovernorWithParams', 'GovernorTimelock']);

      it("doesn't accept ether transfers", async function () {
        await expectRevert.unspecified(web3.eth.sendTransaction({ from: owner, to: this.mock.address, value: 1 }));
      });

      it('post deployment check', async function () {
        expect(await this.mock.name()).to.be.equal(name);
        expect(await this.mock.token()).to.be.equal(this.token.address);
        expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');

        expect(await this.mock.timelock()).to.be.equal(this.timelock.address);
      });

      it('nominal', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 });
        await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 });
        await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();
        await this.helper.waitForEta();
        const txExecute = await this.helper.execute();

        expectEvent(txQueue, 'ProposalQueued', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txQueue.tx, this.timelock, 'Scheduled', {
          id: this.proposal.id,
          proposer: this.mock.address,
          targets: this.proposal.targets,
          values: this.proposal.values,
          payloads: this.proposal.fulldata,
          salt: this.proposal.descriptionHash,
          timepoint: await clockFromReceipt.timestamp(txQueue.receipt).then(now => (now + 60).toString()), // TODO: DELAY
        });

        expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txExecute.tx, this.timelock, 'Executed', { id: this.proposal.id });
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'MockFunctionCalled');
      });

      describe('should revert', function () {
        describe('on queue', function () {
          it('if already queued', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await expectRevert(this.helper.queue(), 'Governor: proposal not successful');
          });
        });

        describe('on execute', function () {
          it('if not queued', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline(+1);

            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);

            await expectRevert(
              this.helper.execute(),
              `ProposalNotReady("${web3.utils.numberToHex(this.proposal.id)}")`,
            );
          });

          it('if too early', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();

            expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Queued);

            await expectRevert(
              this.helper.execute(),
              `ProposalNotReady("${web3.utils.numberToHex(this.proposal.id)}")`,
            );
          });

          it('if already executed', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            await this.helper.execute();
            await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
          });

          it('if already executed by another proposer', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();

            await this.timelock.execute(...this.proposal.shortProposal.slice(0, 3), this.proposal.shortProposal[3], {
              from: owner,
            });

            await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
          });
        });
      });

      describe('cancel', function () {
        it('cancel before queue prevents scheduling', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();

          expectEvent(await this.helper.cancel('internal'), 'ProposalCanceled', { proposalId: this.proposal.id });

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);
          await expectRevert(this.helper.queue(), 'Governor: proposal not successful');
        });

        it('cancel after queue prevents executing', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          expectEvent(await this.helper.cancel('internal'), 'ProposalCanceled', { proposalId: this.proposal.id });

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);
          await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
        });

        it('cancel on timelock is reflected on governor', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Queued);

          expectEvent(await this.timelock.cancel('0x' + this.proposal.id.toString(16), { from: owner }), 'Cancelled', {
            // TODO: tohex
            id: this.proposal.id,
          });

          expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);
        });
      });

      describe('onlyGovernance', function () {
        describe('relay', function () {
          beforeEach(async function () {
            await this.token.$_mint(this.mock.address, 1);
          });

          it('is protected', async function () {
            await expectRevert(
              this.mock.relay(this.token.address, 0, this.token.contract.methods.transfer(other, 1).encodeABI()),
              'Governor: onlyGovernance',
            );
          });

          it('can be executed through governance', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.mock.address,
                  data: this.mock.contract.methods
                    .relay(this.token.address, 0, this.token.contract.methods.transfer(other, 1).encodeABI())
                    .encodeABI(),
                },
              ],
              '<proposal description>',
            );

            expect(await this.token.balanceOf(this.mock.address), 1);
            expect(await this.token.balanceOf(other), 0);

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            const txExecute = await this.helper.execute();

            expect(await this.token.balanceOf(this.mock.address), 0);
            expect(await this.token.balanceOf(other), 1);

            await expectEvent.inTransaction(txExecute.tx, this.token, 'Transfer', {
              from: this.mock.address,
              to: other,
              value: '1',
            });
          });

          it('is payable and can transfer eth to EOA', async function () {
            const t2g = web3.utils.toBN(128); // timelock to governor
            const g2o = web3.utils.toBN(100); // governor to eoa (other)

            this.helper.setProposal(
              [
                {
                  target: this.mock.address,
                  value: t2g,
                  data: this.mock.contract.methods.relay(other, g2o, '0x').encodeABI(),
                },
              ],
              '<proposal description>',
            );

            expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(web3.utils.toBN(0));
            const timelockBalance = await web3.eth.getBalance(this.timelock.address).then(web3.utils.toBN);
            const otherBalance = await web3.eth.getBalance(other).then(web3.utils.toBN);

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            await this.helper.execute();

            expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(timelockBalance.sub(t2g));
            expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(t2g.sub(g2o));
            expect(await web3.eth.getBalance(other)).to.be.bignumber.equal(otherBalance.add(g2o));
          });

          it('protected against other proposers', async function () {
            await this.timelock.schedule(
              [this.mock.address],
              [web3.utils.toWei('0')],
              [this.mock.contract.methods.relay(constants.ZERO_ADDRESS, 0, '0x').encodeABI()],
              constants.ZERO_BYTES32,
              { from: owner },
            );

            await time.increase(3600);

            await expectRevert(
              this.timelock.execute(
                [this.mock.address],
                [web3.utils.toWei('0')],
                [this.mock.contract.methods.relay(constants.ZERO_ADDRESS, 0, '0x').encodeABI()],
                constants.ZERO_BYTES32,
                { from: owner },
              ),
              'TimelockCondition: underlying transaction reverted',
            );
          });
        });

        describe('updateTimelock', function () {
          beforeEach(async function () {
            this.newTimelock = await Timelock.new(this.manager.address, 3600);
          });

          it('is protected', async function () {
            await expectRevert(this.mock.updateTimelock(this.newTimelock.address), 'Governor: onlyGovernance');
          });

          it('can be executed through governance to', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.mock.address,
                  data: this.mock.contract.methods.updateTimelock(this.newTimelock.address).encodeABI(),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            const txExecute = await this.helper.execute();

            expectEvent(txExecute, 'TimelockChange', {
              oldTimelock: this.timelock.address,
              newTimelock: this.newTimelock.address,
            });

            expect(await this.mock.timelock()).to.be.bignumber.equal(this.newTimelock.address);
          });
        });
      });

      it('clear queue of pending governor calls', async function () {
        this.helper.setProposal(
          [
            {
              target: this.mock.address,
              data: this.mock.contract.methods.nonGovernanceFunction().encodeABI(),
            },
          ],
          '<proposal description>',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();
        await this.helper.execute();

        // This path clears _governanceCall as part of the afterExecute call,
        // but we have not way to check that the cleanup actually happened other
        // then coverage reports.
      });

      it('perform restricted action through the timelock condition', async function () {
        // build proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.manager.address,
              value: 0,
              data: this.manager.contract.methods.revokeGroup(TIMELOCK_GROUP, owner, []).encodeABI(),
            },
          ],
          `revoke ${owner}'s timelock access`,
        );

        // execute
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();

        expect(await this.manager.methods['getUserGroups(address)'](owner)).to.be.equal(
          mask(TIMELOCK_GROUP, PUBLIC_GROUP),
        );
        await this.helper.execute();
        expect(await this.manager.methods['getUserGroups(address)'](owner)).to.be.equal(mask(PUBLIC_GROUP));
      });
    });
  }
});
