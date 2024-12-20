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
      const [owner, proposer, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
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

      return { owner, proposer, voter1, voter2, voter3, voter4, other, receiver, token, mock, helper };
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
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
      });

      describe('set proposal guardian', function () {
        it('from governance', async function () {
          const governorSigner = await ethers.getSigner(this.mock.target);
          await expect(this.mock.connect(governorSigner).setProposalGuardian(this.voter1.address))
            .to.emit(this.mock, 'ProposalGuardianSet')
            .withArgs(ethers.ZeroAddress, this.voter1.address);
          expect(this.mock.proposalGuardian()).to.eventually.equal(this.voter1.address);
        });

        it('from non-governance', async function () {
          await expect(this.mock.setProposalGuardian(this.voter1.address))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner.address);
        });
      });

      describe('cancel proposal during active state', function () {
        beforeEach(async function () {
          await this.mock.$_setProposalGuardian(this.voter1.address);
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot(1n);
          expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);
        });

        it('from proposal guardian', async function () {
          await expect(this.helper.connect(this.voter1).cancel())
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);
        });

        it('from proposer when proposal guardian is non-zero', async function () {
          await expect(this.helper.connect(this.proposer).cancel())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              this.proposal.id,
              ProposalState.Active,
              GovernorHelper.proposalStatesToBitMap([ProposalState.Pending]),
            );
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
