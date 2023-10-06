const { expectEvent, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Enums = require('../../helpers/enums');
const { GovernorHelper, proposalStatesToBitMap } = require('../../helpers/governance');
const { expectRevertCustomError } = require('../../helpers/customError');
const { clockFromReceipt } = require('../../helpers/time');
const { selector } = require('../../helpers/methods');

const AccessManager = artifacts.require('$AccessManager');
const Governor = artifacts.require('$GovernorTimelockAccessMock');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');

const TOKENS = [
  { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
];

const hashOperation = (caller, target, data) =>
  web3.utils.keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [caller, target, data]));

contract('GovernorTimelockAccess', function (accounts) {
  const [admin, voter1, voter2, voter3, voter4, other] = accounts;

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
        this.manager = await AccessManager.new(admin);
        this.mock = await Governor.new(
          name,
          votingDelay,
          votingPeriod,
          0, // proposal threshold
          this.manager.address,
          0, // base delay
          this.token.address,
          0, // quorum
        );
        this.receiver = await AccessManagedTarget.new(this.manager.address);

        this.helper = new GovernorHelper(this.mock, mode);

        await web3.eth.sendTransaction({ from: admin, to: this.mock.address, value });

        await this.token.$_mint(admin, tokenSupply);
        await this.helper.delegate({ token: this.token, to: voter1, value: web3.utils.toWei('10') }, { from: admin });
        await this.helper.delegate({ token: this.token, to: voter2, value: web3.utils.toWei('7') }, { from: admin });
        await this.helper.delegate({ token: this.token, to: voter3, value: web3.utils.toWei('5') }, { from: admin });
        await this.helper.delegate({ token: this.token, to: voter4, value: web3.utils.toWei('2') }, { from: admin });

        // default proposals
        this.restricted = {};
        this.restricted.selector = this.receiver.contract.methods.fnRestricted().encodeABI();
        this.restricted.operation = {
          target: this.receiver.address,
          value: '0',
          data: this.restricted.selector,
        };
        this.restricted.operationId = hashOperation(
          this.mock.address,
          this.restricted.operation.target,
          this.restricted.operation.data,
        );

        this.unrestricted = {};
        this.unrestricted.selector = this.receiver.contract.methods.fnUnrestricted().encodeABI();
        this.unrestricted.operation = {
          target: this.receiver.address,
          value: '0',
          data: this.unrestricted.selector,
        };
        this.unrestricted.operationId = hashOperation(
          this.mock.address,
          this.unrestricted.operation.target,
          this.unrestricted.operation.data,
        );

        this.fallback = {};
        this.fallback.operation = {
          target: this.receiver.address,
          value: '0',
          data: '0x1234',
        };
        this.fallback.operationId = hashOperation(
          this.mock.address,
          this.fallback.operation.target,
          this.fallback.operation.data,
        );
      });

      it('accepts ether transfers', async function () {
        await web3.eth.sendTransaction({ from: admin, to: this.mock.address, value: 1 });
      });

      it('post deployment check', async function () {
        expect(await this.mock.name()).to.be.equal(name);
        expect(await this.mock.token()).to.be.equal(this.token.address);
        expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');

        expect(await this.mock.accessManager()).to.be.equal(this.manager.address);
      });

      it('sets base delay (seconds)', async function () {
        const baseDelay = time.duration.hours(10);

        // Only through governance
        await expectRevertCustomError(
          this.mock.setBaseDelaySeconds(baseDelay, { from: voter1 }),
          'GovernorOnlyExecutor',
          [voter1],
        );

        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.mock.address,
              value: '0',
              data: this.mock.contract.methods.setBaseDelaySeconds(baseDelay).encodeABI(),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        const receipt = await this.helper.execute();

        expectEvent(receipt, 'BaseDelaySet', {
          oldBaseDelaySeconds: '0',
          newBaseDelaySeconds: baseDelay,
        });

        expect(await this.mock.baseDelaySeconds()).to.be.bignumber.eq(baseDelay);
      });

      it('sets access manager ignored', async function () {
        const selectors = ['0x12345678', '0x87654321', '0xabcdef01'];

        // Only through governance
        await expectRevertCustomError(
          this.mock.setAccessManagerIgnored(other, selectors, true, { from: voter1 }),
          'GovernorOnlyExecutor',
          [voter1],
        );

        // Ignore
        const helperIgnore = new GovernorHelper(this.mock, mode);
        await helperIgnore.setProposal(
          [
            {
              target: this.mock.address,
              value: '0',
              data: this.mock.contract.methods.setAccessManagerIgnored(other, selectors, true).encodeABI(),
            },
          ],
          'descr',
        );

        await helperIgnore.propose();
        await helperIgnore.waitForSnapshot();
        await helperIgnore.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await helperIgnore.waitForDeadline();
        const ignoreReceipt = await helperIgnore.execute();

        for (const selector of selectors) {
          expectEvent(ignoreReceipt, 'AccessManagerIgnoredSet', {
            target: other,
            selector,
            ignored: true,
          });
          expect(await this.mock.isAccessManagerIgnored(other, selector)).to.be.true;
        }

        // Unignore
        const helperUnignore = new GovernorHelper(this.mock, mode);
        await helperUnignore.setProposal(
          [
            {
              target: this.mock.address,
              value: '0',
              data: this.mock.contract.methods.setAccessManagerIgnored(other, selectors, false).encodeABI(),
            },
          ],
          'descr',
        );

        await helperUnignore.propose();
        await helperUnignore.waitForSnapshot();
        await helperUnignore.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await helperUnignore.waitForDeadline();
        const unignoreReceipt = await helperUnignore.execute();

        for (const selector of selectors) {
          expectEvent(unignoreReceipt, 'AccessManagerIgnoredSet', {
            target: other,
            selector,
            ignored: false,
          });
          expect(await this.mock.isAccessManagerIgnored(other, selector)).to.be.false;
        }
      });

      it('sets access manager ignored when target is the governor', async function () {
        const other = this.mock.address;
        const selectors = ['0x12345678', '0x87654321', '0xabcdef01'];

        await this.helper.setProposal(
          [
            {
              target: this.mock.address,
              value: '0',
              data: this.mock.contract.methods.setAccessManagerIgnored(other, selectors, true).encodeABI(),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        const receipt = await this.helper.execute();

        for (const selector of selectors) {
          expectEvent(receipt, 'AccessManagerIgnoredSet', {
            target: other,
            selector,
            ignored: true,
          });
          expect(await this.mock.isAccessManagerIgnored(other, selector)).to.be.true;
        }
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
            const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
            expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(delay));
            expect(indirect).to.deep.eq([false]);
            expect(withDelay).to.deep.eq([false]);

            await this.helper.waitForSnapshot();
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            if (await this.mock.proposalNeedsQueuing(this.proposal.id)) {
              const txQueue = await this.helper.queue();
              expectEvent(txQueue, 'ProposalQueued', { proposalId: this.proposal.id });
            }
            if (delay > 0) {
              await this.helper.waitForEta();
            }
            const txExecute = await this.helper.execute();
            expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });
            expectEvent.inTransaction(txExecute, this.receiver, 'CalledUnrestricted');
          });
        }
      });

      it('reverts when an operation is executed before eta', async function () {
        const delay = time.duration.hours(2);
        await this.mock.$_setBaseDelaySeconds(delay);

        this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

        await this.helper.propose();
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(true);
        const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
        expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(delay));
        expect(indirect).to.deep.eq([false]);
        expect(withDelay).to.deep.eq([false]);

        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await expectRevertCustomError(this.helper.execute(), 'GovernorUnmetDelay', [
          this.proposal.id,
          await this.mock.proposalEta(this.proposal.id),
        ]);
      });

      it('reverts with a proposal including multiple operations but one of those was cancelled in the manager', async function () {
        const delay = time.duration.hours(2);
        const roleId = '1';

        await this.manager.setTargetFunctionRole(this.receiver.address, [this.restricted.selector], roleId, {
          from: admin,
        });
        await this.manager.grantRole(roleId, this.mock.address, delay, { from: admin });

        // Set proposals
        const original = new GovernorHelper(this.mock, mode);
        await original.setProposal([this.restricted.operation, this.unrestricted.operation], 'descr');

        // Go through all the governance process
        await original.propose();
        expect(await this.mock.proposalNeedsQueuing(original.currentProposal.id)).to.be.eq(true);
        const {
          delay: planDelay,
          indirect,
          withDelay,
        } = await this.mock.proposalExecutionPlan(original.currentProposal.id);
        expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(delay));
        expect(indirect).to.deep.eq([true, false]);
        expect(withDelay).to.deep.eq([true, false]);
        await original.waitForSnapshot();
        await original.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await original.waitForDeadline();
        await original.queue();
        await original.waitForEta();

        // Suddenly cancel one of the proposed operations in the manager
        await this.manager.cancel(this.mock.address, this.restricted.operation.target, this.restricted.operation.data, {
          from: admin,
        });

        // Reschedule the same operation in a different proposal to avoid "AccessManagerNotScheduled" error
        const rescheduled = new GovernorHelper(this.mock, mode);
        await rescheduled.setProposal([this.restricted.operation], 'descr');
        await rescheduled.propose();
        await rescheduled.waitForSnapshot();
        await rescheduled.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await rescheduled.waitForDeadline();
        await rescheduled.queue(); // This will schedule it again in the manager
        await rescheduled.waitForEta();

        // Attempt to execute
        await expectRevertCustomError(original.execute(), 'GovernorMismatchedNonce', [
          original.currentProposal.id,
          1,
          2,
        ]);
      });

      it('single operation with access manager delay', async function () {
        const delay = 1000;
        const roleId = '1';

        await this.manager.setTargetFunctionRole(this.receiver.address, [this.restricted.selector], roleId, {
          from: admin,
        });
        await this.manager.grantRole(roleId, this.mock.address, delay, { from: admin });

        this.proposal = await this.helper.setProposal([this.restricted.operation], 'descr');

        await this.helper.propose();
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(true);
        const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
        expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(delay));
        expect(indirect).to.deep.eq([true]);
        expect(withDelay).to.deep.eq([true]);

        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();
        await this.helper.waitForEta();
        const txExecute = await this.helper.execute();

        expectEvent(txQueue, 'ProposalQueued', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txQueue.tx, this.manager, 'OperationScheduled', {
          operationId: this.restricted.operationId,
          nonce: '1',
          schedule: web3.utils.toBN(await clockFromReceipt.timestamp(txQueue.receipt)).addn(delay),
          caller: this.mock.address,
          target: this.restricted.operation.target,
          data: this.restricted.operation.data,
        });

        expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txExecute.tx, this.manager, 'OperationExecuted', {
          operationId: this.restricted.operationId,
          nonce: '1',
        });
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'CalledRestricted');
      });

      it('bundle of varied operations', async function () {
        const managerDelay = 1000;
        const roleId = '1';

        const baseDelay = managerDelay * 2;

        await this.mock.$_setBaseDelaySeconds(baseDelay);

        await this.manager.setTargetFunctionRole(this.receiver.address, [this.restricted.selector], roleId, {
          from: admin,
        });
        await this.manager.grantRole(roleId, this.mock.address, managerDelay, { from: admin });

        this.proposal = await this.helper.setProposal(
          [this.restricted.operation, this.unrestricted.operation, this.fallback.operation],
          'descr',
        );

        await this.helper.propose();
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(true);
        const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
        expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(baseDelay));
        expect(indirect).to.deep.eq([true, false, false]);
        expect(withDelay).to.deep.eq([true, false, false]);

        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();
        await this.helper.waitForEta();
        const txExecute = await this.helper.execute();

        expectEvent(txQueue, 'ProposalQueued', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txQueue.tx, this.manager, 'OperationScheduled', {
          operationId: this.restricted.operationId,
          nonce: '1',
          schedule: web3.utils.toBN(await clockFromReceipt.timestamp(txQueue.receipt)).addn(baseDelay),
          caller: this.mock.address,
          target: this.restricted.operation.target,
          data: this.restricted.operation.data,
        });

        expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txExecute.tx, this.manager, 'OperationExecuted', {
          operationId: this.restricted.operationId,
          nonce: '1',
        });
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'CalledRestricted');
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'CalledUnrestricted');
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'CalledFallback');
      });

      describe('cancel', function () {
        const delay = 1000;
        const roleId = '1';

        beforeEach(async function () {
          await this.manager.setTargetFunctionRole(this.receiver.address, [this.restricted.selector], roleId, {
            from: admin,
          });
          await this.manager.grantRole(roleId, this.mock.address, delay, { from: admin });
        });

        it('cancels restricted with delay after queue (internal)', async function () {
          this.proposal = await this.helper.setProposal([this.restricted.operation], 'descr');

          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(true);
          const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
          expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(delay));
          expect(indirect).to.deep.eq([true]);
          expect(withDelay).to.deep.eq([true]);

          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          const txCancel = await this.helper.cancel('internal');
          expectEvent(txCancel, 'ProposalCanceled', { proposalId: this.proposal.id });
          await expectEvent.inTransaction(txCancel.tx, this.manager, 'OperationCanceled', {
            operationId: this.restricted.operationId,
            nonce: '1',
          });

          await this.helper.waitForEta();
          await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
            this.proposal.id,
            Enums.ProposalState.Canceled,
            proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
          ]);
        });

        it('cancels restricted with queueing if the same operation is part of a more recent proposal (internal)', async function () {
          // Set proposals
          const original = new GovernorHelper(this.mock, mode);
          await original.setProposal([this.restricted.operation], 'descr');

          // Go through all the governance process
          await original.propose();
          expect(await this.mock.proposalNeedsQueuing(original.currentProposal.id)).to.be.eq(true);
          const {
            delay: planDelay,
            indirect,
            withDelay,
          } = await this.mock.proposalExecutionPlan(original.currentProposal.id);
          expect(planDelay).to.be.bignumber.eq(web3.utils.toBN(delay));
          expect(indirect).to.deep.eq([true]);
          expect(withDelay).to.deep.eq([true]);
          await original.waitForSnapshot();
          await original.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await original.waitForDeadline();
          await original.queue();

          // Cancel the operation in the manager
          await this.manager.cancel(
            this.mock.address,
            this.restricted.operation.target,
            this.restricted.operation.data,
            { from: admin },
          );

          // Another proposal is added with the same operation
          const rescheduled = new GovernorHelper(this.mock, mode);
          await rescheduled.setProposal([this.restricted.operation], 'another descr');

          // Queue the new proposal
          await rescheduled.propose();
          await rescheduled.waitForSnapshot();
          await rescheduled.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await rescheduled.waitForDeadline();
          await rescheduled.queue(); // This will schedule it again in the manager

          // Cancel
          const eta = await this.mock.proposalEta(rescheduled.currentProposal.id);
          const txCancel = await original.cancel('internal');
          expectEvent(txCancel, 'ProposalCanceled', { proposalId: original.currentProposal.id });

          await time.increase(eta); // waitForEta()
          await expectRevertCustomError(original.execute(), 'GovernorUnexpectedProposalState', [
            original.currentProposal.id,
            Enums.ProposalState.Canceled,
            proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
          ]);
        });

        it('cancels unrestricted with queueing (internal)', async function () {
          this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(false);
          const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
          expect(planDelay).to.be.bignumber.eq(web3.utils.toBN('0'));
          expect(indirect).to.deep.eq([false]);
          expect(withDelay).to.deep.eq([false]);

          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          const eta = await this.mock.proposalEta(this.proposal.id);
          const txCancel = await this.helper.cancel('internal');
          expectEvent(txCancel, 'ProposalCanceled', { proposalId: this.proposal.id });

          await time.increase(eta); // waitForEta()
          await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
            this.proposal.id,
            Enums.ProposalState.Canceled,
            proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
          ]);
        });

        it('cancels unrestricted without queueing (internal)', async function () {
          this.proposal = await this.helper.setProposal([this.unrestricted.operation], 'descr');

          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(false);
          const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
          expect(planDelay).to.be.bignumber.eq(web3.utils.toBN('0'));
          expect(indirect).to.deep.eq([false]);
          expect(withDelay).to.deep.eq([false]);

          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          // await this.helper.queue();

          // const eta = await this.mock.proposalEta(this.proposal.id);
          const txCancel = await this.helper.cancel('internal');
          expectEvent(txCancel, 'ProposalCanceled', { proposalId: this.proposal.id });

          // await time.increase(eta); // waitForEta()
          await expectRevertCustomError(this.helper.execute(), 'GovernorUnexpectedProposalState', [
            this.proposal.id,
            Enums.ProposalState.Canceled,
            proposalStatesToBitMap([Enums.ProposalState.Succeeded, Enums.ProposalState.Queued]),
          ]);
        });

        it('cancels calls already canceled by guardian', async function () {
          const operationA = { target: this.receiver.address, data: this.restricted.selector + '00' };
          const operationB = { target: this.receiver.address, data: this.restricted.selector + '01' };
          const operationC = { target: this.receiver.address, data: this.restricted.selector + '02' };
          const operationAId = hashOperation(this.mock.address, operationA.target, operationA.data);
          const operationBId = hashOperation(this.mock.address, operationB.target, operationB.data);

          const proposal1 = new GovernorHelper(this.mock, mode);
          const proposal2 = new GovernorHelper(this.mock, mode);
          proposal1.setProposal([operationA, operationB], 'proposal A+B');
          proposal2.setProposal([operationA, operationC], 'proposal A+C');

          for (const p of [proposal1, proposal2]) {
            await p.propose();
            await p.waitForSnapshot();
            await p.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await p.waitForDeadline();
          }

          // Can queue the first proposal
          await proposal1.queue();

          // Cannot queue the second proposal: operation A already scheduled with delay
          await expectRevertCustomError(proposal2.queue(), 'AccessManagerAlreadyScheduled', [operationAId]);

          // Admin cancels operation B on the manager
          await this.manager.cancel(this.mock.address, operationB.target, operationB.data, { from: admin });

          // Still cannot queue the second proposal: operation A already scheduled with delay
          await expectRevertCustomError(proposal2.queue(), 'AccessManagerAlreadyScheduled', [operationAId]);

          await proposal1.waitForEta();

          // Cannot execute first proposal: operation B has been canceled
          await expectRevertCustomError(proposal1.execute(), 'AccessManagerNotScheduled', [operationBId]);

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
          expect(await this.mock.isAccessManagerIgnored(this.receiver.address, this.restricted.selector)).to.equal(
            false,
          );
          expect(await this.mock.isAccessManagerIgnored(this.mock.address, '0x12341234')).to.equal(true);
        });

        it('internal setter', async function () {
          const p1 = { target: this.receiver.address, selector: this.restricted.selector, ignored: true };
          const tx1 = await this.mock.$_setAccessManagerIgnored(p1.target, p1.selector, p1.ignored);
          expect(await this.mock.isAccessManagerIgnored(p1.target, p1.selector)).to.equal(p1.ignored);
          expectEvent(tx1, 'AccessManagerIgnoredSet', p1);

          const p2 = { target: this.mock.address, selector: '0x12341234', ignored: false };
          const tx2 = await this.mock.$_setAccessManagerIgnored(p2.target, p2.selector, p2.ignored);
          expect(await this.mock.isAccessManagerIgnored(p2.target, p2.selector)).to.equal(p2.ignored);
          expectEvent(tx2, 'AccessManagerIgnoredSet', p2);
        });

        it('external setter', async function () {
          const setAccessManagerIgnored = (...args) =>
            this.mock.contract.methods.setAccessManagerIgnored(...args).encodeABI();

          await this.helper.setProposal(
            [
              {
                target: this.mock.address,
                data: setAccessManagerIgnored(
                  this.receiver.address,
                  [this.restricted.selector, this.unrestricted.selector],
                  true,
                ),
                value: '0',
              },
              {
                target: this.mock.address,
                data: setAccessManagerIgnored(this.mock.address, ['0x12341234', '0x67896789'], false),
                value: '0',
              },
            ],
            'descr',
          );

          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(false);
          const { delay: planDelay, indirect, withDelay } = await this.mock.proposalExecutionPlan(this.proposal.id);
          expect(planDelay).to.be.bignumber.eq(web3.utils.toBN('0'));
          expect(indirect).to.deep.eq([]); // Governor operations ignore access manager
          expect(withDelay).to.deep.eq([]); // Governor operations ignore access manager

          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          const tx = await this.helper.execute();

          expectEvent(tx, 'AccessManagerIgnoredSet');

          expect(await this.mock.isAccessManagerIgnored(this.receiver.address, this.restricted.selector)).to.equal(
            true,
          );
          expect(await this.mock.isAccessManagerIgnored(this.receiver.address, this.unrestricted.selector)).to.equal(
            true,
          );

          expect(await this.mock.isAccessManagerIgnored(this.mock.address, '0x12341234')).to.equal(false);
          expect(await this.mock.isAccessManagerIgnored(this.mock.address, '0x67896789')).to.equal(false);
        });

        it('locked function', async function () {
          const setAccessManagerIgnored = selector('setAccessManagerIgnored(address,bytes4[],bool)');
          await expectRevertCustomError(
            this.mock.$_setAccessManagerIgnored(this.mock.address, setAccessManagerIgnored, true),
            'GovernorLockedIgnore',
            [],
          );
          await this.mock.$_setAccessManagerIgnored(this.receiver.address, setAccessManagerIgnored, true);
        });

        it('ignores access manager', async function () {
          const amount = 100;

          const target = this.token.address;
          const data = this.token.contract.methods.transfer(voter4, amount).encodeABI();
          const selector = data.slice(0, 10);
          await this.token.$_mint(this.mock.address, amount);

          const roleId = '1';
          await this.manager.setTargetFunctionRole(target, [selector], roleId, { from: admin });
          await this.manager.grantRole(roleId, this.mock.address, 0, { from: admin });

          const proposal = await this.helper.setProposal([{ target, data, value: '0' }], '1');
          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(false);
          const plan = await this.mock.proposalExecutionPlan(proposal.id);
          expect(plan.delay).to.be.bignumber.eq(web3.utils.toBN('0'));
          expect(plan.indirect).to.deep.eq([true]);
          expect(plan.withDelay).to.deep.eq([false]);

          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          await expectRevertCustomError(this.helper.execute(), 'ERC20InsufficientBalance', [
            this.manager.address,
            0,
            amount,
          ]);

          await this.mock.$_setAccessManagerIgnored(target, selector, true);

          const proposalIgnored = await this.helper.setProposal([{ target, data, value: '0' }], '2');
          await this.helper.propose();
          expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.eq(false);
          const planIgnored = await this.mock.proposalExecutionPlan(proposalIgnored.id);
          expect(planIgnored.delay).to.be.bignumber.eq(web3.utils.toBN('0'));
          expect(planIgnored.indirect).to.deep.eq([false]);
          expect(planIgnored.withDelay).to.deep.eq([false]);

          await this.helper.waitForSnapshot();
          await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
          await this.helper.waitForDeadline();
          const tx = await this.helper.execute();
          expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.mock.address });
        });
      });
    });
  }
});
