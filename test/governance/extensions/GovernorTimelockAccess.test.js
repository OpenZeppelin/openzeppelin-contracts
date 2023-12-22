const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { GovernorHelper } = require('../../helpers/governance');
const { bigint: Enums } = require('../../helpers/enums');
const { bigint: time } = require('../../helpers/time');
const { max } = require('../../helpers/math');
const { selector } = require('../../helpers/methods');
const { hashOperation } = require('../../helpers/access-manager');

function prepareOperation({ sender, target, value = 0n, data = '0x' }) {
  return {
    id: hashOperation(sender, target, data),
    operation: { target, value, data },
    selector: data.slice(0, 10).padEnd(10, '0'),
  };
}

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

describe('GovernorTimelockAccess', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [admin, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();

      const manager = await ethers.deployContract('$AccessManager', [admin]);
      const receiver = await ethers.deployContract('$AccessManagedTarget', [manager]);

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, version]);
      const mock = await ethers.deployContract('$GovernorTimelockAccessMock', [
        name,
        votingDelay,
        votingPeriod,
        0n,
        manager,
        0n,
        token,
        0n,
      ]);

      await admin.sendTransaction({ to: mock, value });
      await token.$_mint(admin, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(admin).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(admin).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(admin).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(admin).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { admin, voter1, voter2, voter3, voter4, other, manager, receiver, token, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        // restricted proposal
        this.restricted = prepareOperation({
          sender: this.mock.target,
          target: this.receiver.target,
          data: this.receiver.interface.encodeFunctionData('fnRestricted'),
        });

        this.unrestricted = prepareOperation({
          sender: this.mock.target,
          target: this.receiver.target,
          data: this.receiver.interface.encodeFunctionData('fnUnrestricted'),
        });

        this.fallback = prepareOperation({
          sender: this.mock.target,
          target: this.receiver.target,
          data: '0x1234',
        });
      });

      it('accepts ether transfers', async function () {
        await this.admin.sendTransaction({ to: this.mock, value: 1n });
      });

      it('post deployment check', async function () {
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token.target);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0n)).to.equal(0n);

        expect(await this.mock.accessManager()).to.equal(this.manager.target);
      });

      it('sets base delay (seconds)', async function () {
        const baseDelay = time.duration.hours(10n);

        // Only through governance
        await expect(this.mock.connect(this.voter1).setBaseDelaySeconds(baseDelay))
          .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
          .withArgs(this.voter1.address);

        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setBaseDelaySeconds', [baseDelay]),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();

        await expect(this.helper.execute()).to.emit(this.mock, 'BaseDelaySet').withArgs(0n, baseDelay);

        expect(await this.mock.baseDelaySeconds()).to.equal(baseDelay);
      });

      it('sets access manager ignored', async function () {
        const selectors = ['0x12345678', '0x87654321', '0xabcdef01'];

        // Only through governance
        await expect(this.mock.connect(this.voter1).setAccessManagerIgnored(this.other, selectors, true))
          .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
          .withArgs(this.voter1.address);

        // Ignore
        await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setAccessManagerIgnored', [
                this.other.address,
                selectors,
                true,
              ]),
            },
          ],
          'descr',
        );
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();

        const ignoreReceipt = this.helper.execute();
        for (const selector of selectors) {
          await expect(ignoreReceipt)
            .to.emit(this.mock, 'AccessManagerIgnoredSet')
            .withArgs(this.other.address, selector, true);
          expect(await this.mock.isAccessManagerIgnored(this.other, selector)).to.be.true;
        }

        // Unignore
        await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setAccessManagerIgnored', [
                this.other.address,
                selectors,
                false,
              ]),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();

        const unignoreReceipt = this.helper.execute();
        for (const selector of selectors) {
          await expect(unignoreReceipt)
            .to.emit(this.mock, 'AccessManagerIgnoredSet')
            .withArgs(this.other.address, selector, false);
          expect(await this.mock.isAccessManagerIgnored(this.other, selector)).to.be.false;
        }
      });

      it('sets access manager ignored when target is the governor', async function () {
        const selectors = ['0x12345678', '0x87654321', '0xabcdef01'];

        await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setAccessManagerIgnored', [
                this.mock.target,
                selectors,
                true,
              ]),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();

        const tx = this.helper.execute();
        for (const selector of selectors) {
          await expect(tx).to.emit(this.mock, 'AccessManagerIgnoredSet').withArgs(this.mock.target, selector, true);
          expect(await this.mock.isAccessManagerIgnored(this.mock, selector)).to.be.true;
        }
      });

      it('does not need to queue proposals with no delay', async function () {
        const roleId = 1n;
        const executionDelay = 0n;
        const baseDelay = 0n;

        // Set execution delay
        await this.manager.connect(this.admin).setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
        await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

        // Set base delay
        await this.mock.$_setBaseDelaySeconds(baseDelay);

        await this.helper.setProposal([this.restricted.operation], 'descr');
        await this.helper.propose();
        expect(await this.mock.proposalNeedsQueuing(this.helper.currentProposal.id)).to.be.false;
      });

      it('needs to queue proposals with any delay', async function () {
        const roleId = 1n;
        const delays = [
          [time.duration.hours(1n), time.duration.hours(2n)],
          [time.duration.hours(2n), time.duration.hours(1n)],
        ];

        for (const [executionDelay, baseDelay] of delays) {
          // Set execution delay
          await this.manager
            .connect(this.admin)
            .setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
          await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

          // Set base delay
          await this.mock.$_setBaseDelaySeconds(baseDelay);

          await this.helper.setProposal(
            [this.restricted.operation],
            `executionDelay=${executionDelay.toString()}}baseDelay=${baseDelay.toString()}}`,
          );
          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.helper.currentProposal.id)).to.be.true;
        }
      });

      describe('execution plan', function () {
        it('returns plan for delayed operations', async function () {
          const roleId = 1n;
          const delays = [
            [time.duration.hours(1n), time.duration.hours(2n)],
            [time.duration.hours(2n), time.duration.hours(1n)],
          ];

          for (const [executionDelay, baseDelay] of delays) {
            // Set execution delay
            await this.manager
              .connect(this.admin)
              .setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
            await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

            // Set base delay
            await this.mock.$_setBaseDelaySeconds(baseDelay);

            this.proposal = await this.helper.setProposal(
              [this.restricted.operation],
              `executionDelay=${executionDelay.toString()}}baseDelay=${baseDelay.toString()}}`,
            );
            await this.helper.propose();

            expect(await this.mock.proposalExecutionPlan(this.proposal.id)).to.deep.equal([
              max(baseDelay, executionDelay),
              [true],
              [true],
            ]);
          }
        });

        it('returns plan for not delayed operations', async function () {
          const roleId = 1n;
          const executionDelay = 0n;
          const baseDelay = 0n;

          // Set execution delay
          await this.manager
            .connect(this.admin)
            .setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
          await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

          // Set base delay
          await this.mock.$_setBaseDelaySeconds(baseDelay);

          this.proposal = await this.helper.setProposal([this.restricted.operation], `descr`);
          await this.helper.propose();

          expect(await this.mock.proposalExecutionPlan(this.proposal.id)).to.deep.equal([0n, [true], [false]]);
        });

        it('returns plan for an operation ignoring the manager', async function () {
          await this.mock.$_setAccessManagerIgnored(this.receiver, this.restricted.selector, true);

          const roleId = 1n;
          const delays = [
            [time.duration.hours(1n), time.duration.hours(2n)],
            [time.duration.hours(2n), time.duration.hours(1n)],
          ];

          for (const [executionDelay, baseDelay] of delays) {
            // Set execution delay
            await this.manager
              .connect(this.admin)
              .setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
            await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

            // Set base delay
            await this.mock.$_setBaseDelaySeconds(baseDelay);

            this.proposal = await this.helper.setProposal(
              [this.restricted.operation],
              `executionDelay=${executionDelay.toString()}}baseDelay=${baseDelay.toString()}}`,
            );
            await this.helper.propose();

            expect(await this.mock.proposalExecutionPlan(this.proposal.id)).to.deep.equal([
              baseDelay,
              [false],
              [false],
            ]);
          }
        });
      });

      describe('base delay only', function () {
        for (const [delay, queue] of [
          [0, true],
          [0, false],
          [1000, true],
        ]) {
          it(`delay ${delay}, ${queue ? 'with' : 'without'} queuing`, async function () {
            await this.mock.$_setBaseDelaySeconds(delay);

            this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await this.helper.waitForDeadline();
            if (await this.mock.proposalNeedsQueuing(this.proposal.id)) {
              expect(await this.helper.queue())
                .to.emit(this.mock, 'ProposalQueued')
                .withArgs(this.proposal.id);
            }
            if (delay > 0) {
              await this.helper.waitForEta();
            }
            expect(await this.helper.execute())
              .to.emit(this.mock, 'ProposalExecuted')
              .withArgs(this.proposal.id)
              .to.not.emit(this.receiver, 'CalledUnrestricted');
          });
        }
      });

      it('reverts when an operation is executed before eta', async function () {
        const delay = time.duration.hours(2n);
        await this.mock.$_setBaseDelaySeconds(delay);

        this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await expect(this.helper.execute())
          .to.be.revertedWithCustomError(this.mock, 'GovernorUnmetDelay')
          .withArgs(this.proposal.id, await this.mock.proposalEta(this.proposal.id));
      });

      it('reverts with a proposal including multiple operations but one of those was cancelled in the manager', async function () {
        const delay = time.duration.hours(2n);
        const roleId = 1n;

        await this.manager.connect(this.admin).setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
        await this.manager.connect(this.admin).grantRole(roleId, this.mock, delay);

        // Set proposals
        const original = new GovernorHelper(this.mock, mode);
        await original.setProposal([this.restricted.operation, this.unrestricted.operation], 'descr');

        // Go through all the governance process
        await original.propose();
        await original.waitForSnapshot();
        await original.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await original.waitForDeadline();
        await original.queue();
        await original.waitForEta();

        // Suddenly cancel one of the proposed operations in the manager
        await this.manager
          .connect(this.admin)
          .cancel(this.mock, this.restricted.operation.target, this.restricted.operation.data);

        // Reschedule the same operation in a different proposal to avoid "AccessManagerNotScheduled" error
        const rescheduled = new GovernorHelper(this.mock, mode);
        await rescheduled.setProposal([this.restricted.operation], 'descr');
        await rescheduled.propose();
        await rescheduled.waitForSnapshot();
        await rescheduled.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await rescheduled.waitForDeadline();
        await rescheduled.queue(); // This will schedule it again in the manager
        await rescheduled.waitForEta();

        // Attempt to execute
        await expect(original.execute())
          .to.be.revertedWithCustomError(this.mock, 'GovernorMismatchedNonce')
          .withArgs(original.currentProposal.id, 1, 2);
      });

      it('single operation with access manager delay', async function () {
        const delay = 1000n;
        const roleId = 1n;

        await this.manager.connect(this.admin).setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
        await this.manager.connect(this.admin).grantRole(roleId, this.mock, delay);

        this.proposal = await this.helper.setProposal([this.restricted.operation], 'descr');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();
        await this.helper.waitForEta();
        const txExecute = await this.helper.execute();

        await expect(txQueue)
          .to.emit(this.mock, 'ProposalQueued')
          .withArgs(this.proposal.id, anyValue)
          .to.emit(this.manager, 'OperationScheduled')
          .withArgs(
            this.restricted.id,
            1n,
            (await time.clockFromReceipt.timestamp(txQueue)) + delay,
            this.mock.target,
            this.restricted.operation.target,
            this.restricted.operation.data,
          );

        await expect(txExecute)
          .to.emit(this.mock, 'ProposalExecuted')
          .withArgs(this.proposal.id)
          .to.emit(this.manager, 'OperationExecuted')
          .withArgs(this.restricted.id, 1n)
          .to.emit(this.receiver, 'CalledRestricted');
      });

      it('bundle of varied operations', async function () {
        const managerDelay = 1000n;
        const roleId = 1n;
        const baseDelay = managerDelay * 2n;

        await this.mock.$_setBaseDelaySeconds(baseDelay);

        await this.manager.connect(this.admin).setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
        await this.manager.connect(this.admin).grantRole(roleId, this.mock, managerDelay);

        this.proposal = await this.helper.setProposal(
          [this.restricted.operation, this.unrestricted.operation, this.fallback.operation],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();
        await this.helper.waitForEta();
        const txExecute = await this.helper.execute();

        await expect(txQueue)
          .to.emit(this.mock, 'ProposalQueued')
          .withArgs(this.proposal.id, anyValue)
          .to.emit(this.manager, 'OperationScheduled')
          .withArgs(
            this.restricted.id,
            1n,
            (await time.clockFromReceipt.timestamp(txQueue)) + baseDelay,
            this.mock.target,
            this.restricted.operation.target,
            this.restricted.operation.data,
          );

        await expect(txExecute)
          .to.emit(this.mock, 'ProposalExecuted')
          .withArgs(this.proposal.id)
          .to.emit(this.manager, 'OperationExecuted')
          .withArgs(this.restricted.id, 1n)
          .to.emit(this.receiver, 'CalledRestricted')
          .to.emit(this.receiver, 'CalledUnrestricted')
          .to.emit(this.receiver, 'CalledFallback');
      });

      describe('cancel', function () {
        const delay = 1000n;
        const roleId = 1n;

        beforeEach(async function () {
          await this.manager
            .connect(this.admin)
            .setTargetFunctionRole(this.receiver, [this.restricted.selector], roleId);
          await this.manager.connect(this.admin).grantRole(roleId, this.mock, delay);
        });

        it('cancels restricted with delay after queue (internal)', async function () {
          this.proposal = await this.helper.setProposal([this.restricted.operation], 'descr');

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          await expect(this.helper.cancel('internal'))
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id)
            .to.emit(this.manager, 'OperationCanceled')
            .withArgs(this.restricted.id, 1n);

          await this.helper.waitForEta();

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              this.proposal.id,
              Enums.ProposalState.Canceled,
              GovernorHelper.proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            );
        });

        it('cancels restricted with queueing if the same operation is part of a more recent proposal (internal)', async function () {
          // Set proposals
          const original = new GovernorHelper(this.mock, mode);
          await original.setProposal([this.restricted.operation], 'descr');

          // Go through all the governance process
          await original.propose();
          await original.waitForSnapshot();
          await original.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await original.waitForDeadline();
          await original.queue();

          // Cancel the operation in the manager
          await this.manager
            .connect(this.admin)
            .cancel(this.mock, this.restricted.operation.target, this.restricted.operation.data);

          // Another proposal is added with the same operation
          const rescheduled = new GovernorHelper(this.mock, mode);
          await rescheduled.setProposal([this.restricted.operation], 'another descr');

          // Queue the new proposal
          await rescheduled.propose();
          await rescheduled.waitForSnapshot();
          await rescheduled.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await rescheduled.waitForDeadline();
          await rescheduled.queue(); // This will schedule it again in the manager

          // Cancel
          const eta = await this.mock.proposalEta(rescheduled.currentProposal.id);

          await expect(original.cancel('internal'))
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(original.currentProposal.id);

          await time.clock.timestamp().then(clock => time.increaseTo.timestamp(max(clock + 1n, eta)));

          await expect(original.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              original.currentProposal.id,
              Enums.ProposalState.Canceled,
              GovernorHelper.proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            );
        });

        it('cancels unrestricted with queueing (internal)', async function () {
          this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          const eta = await this.mock.proposalEta(this.proposal.id);

          await expect(this.helper.cancel('internal'))
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);

          await time.clock.timestamp().then(clock => time.increaseTo.timestamp(max(clock + 1n, eta)));

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              this.proposal.id,
              Enums.ProposalState.Canceled,
              GovernorHelper.proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            );
        });

        it('cancels unrestricted without queueing (internal)', async function () {
          this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.cancel('internal'))
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              this.proposal.id,
              Enums.ProposalState.Canceled,
              GovernorHelper.proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
            );
        });

        it('cancels calls already canceled by guardian', async function () {
          const operationA = { target: this.receiver.target, data: this.restricted.selector + '00' };
          const operationB = { target: this.receiver.target, data: this.restricted.selector + '01' };
          const operationC = { target: this.receiver.target, data: this.restricted.selector + '02' };
          const operationAId = hashOperation(this.mock.target, operationA.target, operationA.data);
          const operationBId = hashOperation(this.mock.target, operationB.target, operationB.data);

          const proposal1 = new GovernorHelper(this.mock, mode);
          const proposal2 = new GovernorHelper(this.mock, mode);
          proposal1.setProposal([operationA, operationB], 'proposal A+B');
          proposal2.setProposal([operationA, operationC], 'proposal A+C');

          for (const p of [proposal1, proposal2]) {
            await p.propose();
            await p.waitForSnapshot();
            await p.connect(this.voter1).vote({ support: Enums.VoteType.For });
            await p.waitForDeadline();
          }

          // Can queue the first proposal
          await proposal1.queue();

          // Cannot queue the second proposal: operation A already scheduled with delay
          await expect(proposal2.queue())
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerAlreadyScheduled')
            .withArgs(operationAId);

          // Admin cancels operation B on the manager
          await this.manager.connect(this.admin).cancel(this.mock, operationB.target, operationB.data);

          // Still cannot queue the second proposal: operation A already scheduled with delay
          await expect(proposal2.queue())
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerAlreadyScheduled')
            .withArgs(operationAId);

          await proposal1.waitForEta();

          // Cannot execute first proposal: operation B has been canceled
          await expect(proposal1.execute())
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotScheduled')
            .withArgs(operationBId);

          // Cancel the first proposal to release operation A
          await proposal1.cancel('internal');

          // can finally queue the second proposal
          await proposal2.queue();

          await proposal2.waitForEta();

          // Can execute second proposal
          await proposal2.execute();
        });
      });

      describe('ignore AccessManager', function () {
        it('defaults', async function () {
          expect(await this.mock.isAccessManagerIgnored(this.receiver, this.restricted.selector)).to.be.false;
          expect(await this.mock.isAccessManagerIgnored(this.mock, '0x12341234')).to.be.true;
        });

        it('internal setter', async function () {
          await expect(this.mock.$_setAccessManagerIgnored(this.receiver, this.restricted.selector, true))
            .to.emit(this.mock, 'AccessManagerIgnoredSet')
            .withArgs(this.receiver.target, this.restricted.selector, true);

          expect(await this.mock.isAccessManagerIgnored(this.receiver, this.restricted.selector)).to.be.true;

          await expect(this.mock.$_setAccessManagerIgnored(this.mock, '0x12341234', false))
            .to.emit(this.mock, 'AccessManagerIgnoredSet')
            .withArgs(this.mock.target, '0x12341234', false);

          expect(await this.mock.isAccessManagerIgnored(this.mock, '0x12341234')).to.be.false;
        });

        it('external setter', async function () {
          const setAccessManagerIgnored = (...args) =>
            this.mock.interface.encodeFunctionData('setAccessManagerIgnored', args);

          await this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: setAccessManagerIgnored(
                  this.receiver.target,
                  [this.restricted.selector, this.unrestricted.selector],
                  true,
                ),
              },
              {
                target: this.mock.target,
                data: setAccessManagerIgnored(this.mock.target, ['0x12341234', '0x67896789'], false),
              },
            ],
            'descr',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute()).to.emit(this.mock, 'AccessManagerIgnoredSet');

          expect(await this.mock.isAccessManagerIgnored(this.receiver, this.restricted.selector)).to.be.true;
          expect(await this.mock.isAccessManagerIgnored(this.receiver, this.unrestricted.selector)).to.be.true;
          expect(await this.mock.isAccessManagerIgnored(this.mock, '0x12341234')).to.be.false;
          expect(await this.mock.isAccessManagerIgnored(this.mock, '0x67896789')).to.be.false;
        });

        it('locked function', async function () {
          const setAccessManagerIgnored = selector('setAccessManagerIgnored(address,bytes4[],bool)');

          await expect(
            this.mock.$_setAccessManagerIgnored(this.mock, setAccessManagerIgnored, true),
          ).to.be.revertedWithCustomError(this.mock, 'GovernorLockedIgnore');

          await this.mock.$_setAccessManagerIgnored(this.receiver, setAccessManagerIgnored, true);
        });

        it('ignores access manager', async function () {
          const amount = 100n;
          const target = this.token.target;
          const data = this.token.interface.encodeFunctionData('transfer', [this.voter4.address, amount]);
          const selector = data.slice(0, 10);
          await this.token.$_mint(this.mock, amount);

          const roleId = 1n;
          await this.manager.connect(this.admin).setTargetFunctionRole(target, [selector], roleId);
          await this.manager.connect(this.admin).grantRole(roleId, this.mock, 0);

          await this.helper.setProposal([{ target, data }], 'descr #1');
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
            .withArgs(this.manager.target, 0n, amount);

          await this.mock.$_setAccessManagerIgnored(target, selector, true);

          await this.helper.setProposal([{ target, data }], 'descr #2');
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute())
            .to.emit(this.token, 'Transfer')
            .withArgs(this.mock.target, this.voter4.address, amount);
        });
      });

      describe('operating on an Ownable contract', function () {
        const method = selector('$_checkOwner()');

        beforeEach(async function () {
          this.ownable = await ethers.deployContract('$Ownable', [this.manager]);
          this.operation = {
            target: this.ownable.target,
            data: this.ownable.interface.encodeFunctionData('$_checkOwner'),
          };
        });

        it('succeeds with delay', async function () {
          const roleId = 1n;
          const executionDelay = time.duration.hours(2n);
          const baseDelay = time.duration.hours(1n);

          // Set execution delay
          await this.manager.connect(this.admin).setTargetFunctionRole(this.ownable, [method], roleId);
          await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

          // Set base delay
          await this.mock.$_setBaseDelaySeconds(baseDelay);

          await this.helper.setProposal([this.operation], `descr`);
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.queue();
          await this.helper.waitForEta();
          await this.helper.execute(); // Don't revert
        });

        it('succeeds without delay', async function () {
          const roleId = 1n;
          const executionDelay = 0n;
          const baseDelay = 0n;

          // Set execution delay
          await this.manager.connect(this.admin).setTargetFunctionRole(this.ownable, [method], roleId);
          await this.manager.connect(this.admin).grantRole(roleId, this.mock, executionDelay);

          // Set base delay
          await this.mock.$_setBaseDelaySeconds(baseDelay);

          await this.helper.setProposal([this.operation], `descr`);
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: Enums.VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.execute(); // Don't revert
        });
      });
    });
  }
});
