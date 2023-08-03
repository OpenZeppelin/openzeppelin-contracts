const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { expectRevertCustomError } = require('../../helpers/customError');
const Enums = require('../../helpers/enums');
const { GovernorHelper, timelockSalt } = require('../../helpers/governance');

const Timelock = artifacts.require('TimelockController');
const Governor = artifacts.require('$GovernorStorageMock');
const CallReceiver = artifacts.require('CallReceiverMock');

const TOKENS = [
  { Token: artifacts.require('$ERC20Votes'), mode: 'blocknumber' },
  { Token: artifacts.require('$ERC20VotesTimestampMock'), mode: 'timestamp' },
];

contract('GovernorStorage', function (accounts) {
  const [owner, voter1, voter2, voter3, voter4] = accounts;

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const PROPOSER_ROLE = web3.utils.soliditySha3('PROPOSER_ROLE');
  const EXECUTOR_ROLE = web3.utils.soliditySha3('EXECUTOR_ROLE');
  const CANCELLER_ROLE = web3.utils.soliditySha3('CANCELLER_ROLE');

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
        const [deployer] = await web3.eth.getAccounts();

        this.token = await Token.new(tokenName, tokenSymbol, tokenName, version);
        this.timelock = await Timelock.new(3600, [], [], deployer);
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

        await web3.eth.sendTransaction({ from: owner, to: this.timelock.address, value });

        // normal setup: governor is proposer, everyone is executor, timelock is its own admin
        await this.timelock.grantRole(PROPOSER_ROLE, this.mock.address);
        await this.timelock.grantRole(PROPOSER_ROLE, owner);
        await this.timelock.grantRole(CANCELLER_ROLE, this.mock.address);
        await this.timelock.grantRole(CANCELLER_ROLE, owner);
        await this.timelock.grantRole(EXECUTOR_ROLE, constants.ZERO_ADDRESS);
        await this.timelock.revokeRole(DEFAULT_ADMIN_ROLE, deployer);

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
        this.proposal.timelockid = await this.timelock.hashOperationBatch(
          ...this.proposal.shortProposal.slice(0, 3),
          '0x0',
          timelockSalt(this.mock.address, this.proposal.shortProposal[3]),
        );
      });

      describe('proposal indexing', function () {
        it('before propose', async function () {
          expect(await this.mock.proposalCount()).to.be.bignumber.equal('0');

          // panic code 0x32 (out-of-bound)
          await expectRevert.unspecified(this.mock.proposalDetailsAt(0));

          await expectRevertCustomError(this.mock.proposalDetails(this.proposal.id), 'GovernorNonexistentProposal', [
            this.proposal.id,
          ]);
        });

        it('after propose', async function () {
          await this.helper.propose();

          expect(await this.mock.proposalCount()).to.be.bignumber.equal('1');

          const proposalDetailsAt0 = await this.mock.proposalDetailsAt(0);
          expect(proposalDetailsAt0[0]).to.be.bignumber.equal(this.proposal.id);
          expect(proposalDetailsAt0[1]).to.be.deep.equal(this.proposal.targets);
          expect(proposalDetailsAt0[2].map(x => x.toString())).to.be.deep.equal(this.proposal.values);
          expect(proposalDetailsAt0[3]).to.be.deep.equal(this.proposal.fulldata);
          expect(proposalDetailsAt0[4]).to.be.equal(this.proposal.descriptionHash);

          const proposalDetailsForId = await this.mock.proposalDetails(this.proposal.id);
          expect(proposalDetailsForId[0]).to.be.deep.equal(this.proposal.targets);
          expect(proposalDetailsForId[1].map(x => x.toString())).to.be.deep.equal(this.proposal.values);
          expect(proposalDetailsForId[2]).to.be.deep.equal(this.proposal.fulldata);
          expect(proposalDetailsForId[3]).to.be.equal(this.proposal.descriptionHash);
        });
      });

      it('queue and execute by id', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 });
        await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 });
        await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 });
        await this.helper.waitForDeadline();
        const txQueue = await this.mock.queue(this.proposal.id);
        await this.helper.waitForEta();
        const txExecute = await this.mock.execute(this.proposal.id);

        expectEvent(txQueue, 'ProposalQueued', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txQueue.tx, this.timelock, 'CallScheduled', { id: this.proposal.timelockid });
        await expectEvent.inTransaction(txQueue.tx, this.timelock, 'CallSalt', {
          id: this.proposal.timelockid,
        });

        expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });
        await expectEvent.inTransaction(txExecute.tx, this.timelock, 'CallExecuted', { id: this.proposal.timelockid });
        await expectEvent.inTransaction(txExecute.tx, this.receiver, 'MockFunctionCalled');
      });

      it('cancel by id', async function () {
        await this.helper.propose();
        const txCancel = await this.mock.cancel(this.proposal.id);
        expectEvent(txCancel, 'ProposalCanceled', { proposalId: this.proposal.id });
      });
    });
  }
});
