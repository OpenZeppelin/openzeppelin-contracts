const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const { GovernorHelper } = require('../../helpers/governance');
const { ProposalState } = require('../../helpers/enums');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];
const name = 'Proposal Guardian Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

describe('GovernorProposalGuardian', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, guardian, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorProposalGuardianMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token, // tokenAddress
        10n, // quorumNumeratorValue
      ]);

      await impersonate(mock.target);
      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { owner, proposer, guardian, voter1, voter2, voter3, voter4, other, receiver, token, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        // default proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              value,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          '<proposal description>',
        );
      });

      it('deployment check', async function () {
        await expect(this.mock.name()).to.eventually.equal(name);
        await expect(this.mock.token()).to.eventually.equal(this.token);
        await expect(this.mock.votingDelay()).to.eventually.equal(votingDelay);
        await expect(this.mock.votingPeriod()).to.eventually.equal(votingPeriod);
      });

      describe('set proposal guardian', function () {
        it('from governance', async function () {
          const governorSigner = await ethers.getSigner(this.mock.target);
          await expect(this.mock.connect(governorSigner).setProposalGuardian(this.guardian))
            .to.emit(this.mock, 'ProposalGuardianSet')
            .withArgs(ethers.ZeroAddress, this.guardian);
          await expect(this.mock.proposalGuardian()).to.eventually.equal(this.guardian);
        });

        it('from non-governance', async function () {
          await expect(this.mock.connect(this.other).setProposalGuardian(this.guardian))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.other);
        });
      });

      it('cancel proposal during pending state from proposer when proposal guardian is non-zero', async function () {
        await this.mock.$_setProposalGuardian(this.guardian);
        await this.helper.connect(this.proposer).propose();
        await expect(this.helper.connect(this.proposer).cancel())
          .to.emit(this.mock, 'ProposalCanceled')
          .withArgs(this.proposal.id);
      });

      describe('cancel proposal during active state', function () {
        beforeEach(async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot(1n);
          await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);
        });

        it('from proposal guardian', async function () {
          await this.mock.$_setProposalGuardian(this.guardian);

          await expect(this.helper.connect(this.guardian).cancel())
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);
        });

        it('from proposer when proposal guardian is non-zero', async function () {
          await this.mock.$_setProposalGuardian(this.guardian);

          await expect(this.helper.connect(this.proposer).cancel())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnableToCancel')
            .withArgs(this.proposal.id, this.proposer);
        });

        it('from proposer when proposal guardian is zero', async function () {
          await this.mock.$_setProposalGuardian(ethers.ZeroAddress);

          await expect(this.helper.connect(this.proposer).cancel())
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);
        });
      });
    });
  }
});
