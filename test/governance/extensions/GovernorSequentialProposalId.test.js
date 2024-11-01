const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../../helpers/governance');
const { VoteType } = require('../../helpers/enums');
const time = require('../../helpers/time');

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

async function deployToken(contractName) {
  try {
    return await ethers.deployContract(contractName, [tokenName, tokenSymbol, tokenName, version]);
  } catch (error) {
    if (error.message == 'incorrect number of arguments to constructor') {
      // ERC20VotesLegacyMock has a different construction that uses version='1' by default.
      return ethers.deployContract(contractName, [tokenName, tokenSymbol, tokenName]);
    }
    throw error;
  }
}

describe('GovernorSequentialProposalId', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4, userEOA] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await deployToken(Token, [tokenName, tokenSymbol, version]);
      const mock = await ethers.deployContract('$GovernorSequentialProposalIdMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token, // tokenAddress
        10n, // quorumNumeratorValue
      ]);

      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token: token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token: token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token: token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token: token, to: voter4, value: ethers.parseEther('2') });

      return {
        owner,
        proposer,
        voter1,
        voter2,
        voter3,
        voter4,
        userEOA,
        receiver,
        token,
        mock,
        helper,
      };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

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
      });

      it('sequential proposal ids', async function () {
        const txPropose = await this.helper.connect(this.proposer).propose();
        const timepoint = await time.clockFromReceipt[mode](txPropose);

        await expect(txPropose)
          .to.emit(this.mock, 'ProposalCreated')
          .withArgs(
            1,
            this.proposer,
            this.proposal.targets,
            this.proposal.values,
            this.proposal.signatures,
            this.proposal.data,
            timepoint + votingDelay,
            timepoint + votingDelay + votingPeriod,
            this.proposal.description,
          );

        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
              value,
            },
          ],
          '<proposal description 2>',
        );
        const txPropose2 = await this.helper.connect(this.proposer).propose();
        const timepoint2 = await time.clockFromReceipt[mode](txPropose2);

        await expect(txPropose2)
          .to.emit(this.mock, 'ProposalCreated')
          .withArgs(
            2,
            this.proposer,
            this.proposal.targets,
            this.proposal.values,
            this.proposal.signatures,
            this.proposal.data,
            timepoint2 + votingDelay,
            timepoint2 + votingDelay + votingPeriod,
            this.proposal.description,
          );
      });

      it('nominal workflow', async function () {
        await this.helper.connect(this.proposer).propose();
        let timepoint = await this.mock.proposalSnapshot(1);
        await time.increaseTo[mode](timepoint);

        await expect(this.mock.connect(this.voter1).castVote(1, VoteType.For))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter1, 1, VoteType.For, ethers.parseEther('10'), '');

        await expect(this.mock.connect(this.voter2).castVote(1, VoteType.For))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter2, 1, VoteType.For, ethers.parseEther('7'), '');

        await expect(this.mock.connect(this.voter3).castVote(1, VoteType.For))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter3, 1, VoteType.For, ethers.parseEther('5'), '');

        await expect(this.mock.connect(this.voter4).castVote(1, VoteType.Abstain))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter4, 1, VoteType.Abstain, ethers.parseEther('2'), '');

        timepoint = await this.mock.proposalDeadline(1);
        await time.increaseTo[mode](timepoint);

        expect(this.helper.execute())
          .to.eventually.emit(this.mock, 'ProposalExecuted')
          .withArgs(1)
          .emit(this.receiver, 'MockFunctionCalled');
      });
    });
  }
});
