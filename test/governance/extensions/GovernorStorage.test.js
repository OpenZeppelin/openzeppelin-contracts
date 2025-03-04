const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { GovernorHelper, timelockSalt } = require('../../helpers/governance');
const { VoteType } = require('../../helpers/enums');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];

const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const PROPOSER_ROLE = ethers.id('PROPOSER_ROLE');
const EXECUTOR_ROLE = ethers.id('EXECUTOR_ROLE');
const CANCELLER_ROLE = ethers.id('CANCELLER_ROLE');

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');
const delay = 3600n;

// Helper function to cast votes from multiple voters
async function castVotes(helper, voter1, voter2, voter3, voter4) {
  await helper.connect(voter1).vote({ support: VoteType.For });
  await helper.connect(voter2).vote({ support: VoteType.For });
  await helper.connect(voter3).vote({ support: VoteType.Against });
  await helper.connect(voter4).vote({ support: VoteType.Abstain });
}

describe('GovernorStorage', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [deployer, owner, proposer, voter1, voter2, voter3, voter4] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');
      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, version]);
      const timelock = await ethers.deployContract('TimelockController', [delay, [], [], deployer]);
      const mock = await ethers.deployContract('$GovernorStorageMock', [
        name,
        votingDelay,
        votingPeriod,
        0n,
        timelock,
        token,
        0n,
      ]);
      // Fund the timelock and mint tokens for voting
      await owner.sendTransaction({ to: timelock, value });
      await token.$_mint(owner, tokenSupply);
      
      // Set roles for governance operations
      await timelock.grantRole(PROPOSER_ROLE, mock);
      await timelock.grantRole(PROPOSER_ROLE, owner);
      await timelock.grantRole(CANCELLER_ROLE, mock);
      await timelock.grantRole(CANCELLER_ROLE, owner);
      await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
      await timelock.revokeRole(DEFAULT_ADMIN_ROLE, deployer);
      
      const helper = new GovernorHelper(mock, mode);
      // Delegate tokens to voters to give them voting power
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });
      
      return { deployer, owner, proposer, voter1, voter2, voter3, voter4, receiver, token, timelock, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        // Initialize a fresh proposal with valid data
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
              value,
            },
          ],
          '<proposal description>',
        );
        this.proposal.timelockid = await this.timelock.hashOperationBatch(
          ...this.proposal.shortProposal.slice(0, 3),
          ethers.ZeroHash,
          timelockSalt(this.mock.target, this.proposal.shortProposal[3])
        );
      });

      describe('proposal indexing', function () {
        it('before propose, accessing proposal details should revert', async function () {
          expect(await this.mock.proposalCount()).to.equal(0n);
          await expect(this.mock.proposalDetailsAt(0n))
            .to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
          await expect(this.mock.proposalDetails(this.proposal.id))
            .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
            .withArgs(this.proposal.id);
        });

        it('after propose, proposal details should be retrievable', async function () {
          await this.helper.propose();
          expect(await this.mock.proposalCount()).to.equal(1n);
          expect(await this.mock.proposalDetailsAt(0n)).to.deep.equal([
            this.proposal.id,
            this.proposal.targets,
            this.proposal.values,
            this.proposal.data,
            this.proposal.descriptionHash,
          ]);
          expect(await this.mock.proposalDetails(this.proposal.id)).to.deep.equal([
            this.proposal.targets,
            this.proposal.values,
            this.proposal.data,
            this.proposal.descriptionHash,
          ]);
        });
      });

      it('queue and execute by id', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        // Cast votes using the helper function
        await castVotes(this.helper, this.voter1, this.voter2, this.voter3, this.voter4);
        await this.helper.waitForDeadline();

        // Queue proposal and assert emitted events with descriptive messages
        await expect(this.mock.queue(this.proposal.id))
          .to.emit(this.mock, 'ProposalQueued')
          .withArgs(this.proposal.id, anyValue, "Expected ProposalQueued event with proposal id and eta")
          .to.emit(this.timelock, 'CallScheduled')
          .withArgs(this.proposal.timelockid, ...Array(6).fill(anyValue), "Expected CallScheduled event with correct parameters")
          .to.emit(this.timelock, 'CallSalt')
          .withArgs(this.proposal.timelockid, anyValue, "Expected CallSalt event with correct salt");

        await this.helper.waitForEta();

        // Execute proposal and verify that all events are emitted correctly
        await expect(this.mock.execute(this.proposal.id))
          .to.emit(this.mock, 'ProposalExecuted')
          .withArgs(this.proposal.id, "Expected ProposalExecuted event with proposal id")
          .to.emit(this.timelock, 'CallExecuted')
          .withArgs(this.proposal.timelockid, ...Array(4).fill(anyValue), "Expected CallExecuted event with correct parameters")
          .to.emit(this.receiver, 'MockFunctionCalled');
      });

      it('cancel by id', async function () {
        await this.helper.connect(this.proposer).propose();
        await expect(this.mock.connect(this.proposer).cancel(this.proposal.id))
          .to.emit(this.mock, 'ProposalCanceled')
          .withArgs(this.proposal.id, "Expected ProposalCanceled event with proposal id");
      });

      describe('Edge Case Tests', function () {
        it('should allow creation of multiple proposals with distinct ids', async function () {
          // Propose the first proposal
          await this.helper.propose();
          const firstProposalId = this.proposal.id;

          // Create a second proposal with a different description
          const secondProposal = this.helper.setProposal(
            [
              {
                target: this.receiver.target,
                data: this.receiver.interface.encodeFunctionData('mockFunction'),
                value,
              },
            ],
            '<second proposal description>'
          );
          secondProposal.timelockid = await this.timelock.hashOperationBatch(
            ...secondProposal.shortProposal.slice(0, 3),
            ethers.ZeroHash,
            timelockSalt(this.mock.target, secondProposal.shortProposal[3])
          );
          // Propose the second proposal
          await this.helper.propose(secondProposal);
          expect(await this.mock.proposalCount()).to.equal(2n, "Proposal count should be 2 after two proposals");
          expect(firstProposalId).to.not.equal(secondProposal.id, "Each proposal should have a distinct id");
        });

        it('should revert when accessing details of a non-existent proposal', async function () {
          const invalidProposalId = ethers.id('non-existent');
          await expect(this.mock.proposalDetails(invalidProposalId))
            .to.be.revertedWithCustomError(this.mock, 'GovernorNonexistentProposal')
            .withArgs(invalidProposalId);
        });
      });
    });
  }
});
