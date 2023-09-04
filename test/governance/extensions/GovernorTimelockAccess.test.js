const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Enums = require('../../helpers/enums');
const { GovernorHelper, proposalStatesToBitMap } = require('../../helpers/governance');
const { expectRevertCustomError } = require('../../helpers/customError');
const { clockFromReceipt } = require('../../helpers/time');

const AccessManager = artifacts.require('$AccessManager');
const Governor = artifacts.require('$GovernorTimelockAccessMock');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');

const TOKENS = [
  // { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
];

const hashOperation = (caller, target, data) =>
  web3.utils.keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [caller, target, data]));

contract('GovernorTimelockAccess', function (accounts) {
  const [admin, voter1, voter2, voter3, voter4] = accounts;

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
            await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
            await this.helper.waitForDeadline();
            if (queue) {
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

      it('single operation with access manager delay', async function () {
        const delay = 1000;
        const roleId = '1';

        await this.manager.setTargetFunctionRole(this.receiver.address, [this.restricted.selector], roleId, {
          from: admin,
        });
        await this.manager.grantRole(roleId, this.mock.address, delay, { from: admin });

        this.proposal = await this.helper.setProposal([this.restricted.operation], 'descr');

        await this.helper.propose();
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
          [this.restricted.operation, this.unrestricted.operation],
          'descr',
        );

        await this.helper.propose();
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
      });

      it('cancellation after queue (internal)', async function () {
        const delay = 1000;
        const roleId = '1';

        await this.manager.setTargetFunctionRole(this.receiver.address, [this.restricted.selector], roleId, {
          from: admin,
        });
        await this.manager.grantRole(roleId, this.mock.address, delay, { from: admin });

        this.proposal = await this.helper.setProposal([this.restricted.operation], 'descr');

        await this.helper.propose();
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
    });
  }
});
