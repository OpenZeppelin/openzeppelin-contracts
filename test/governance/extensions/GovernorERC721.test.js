const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../../helpers/governance');
const { VoteType } = require('../../helpers/enums');

const TOKENS = [
  { Token: '$ERC721Votes', mode: 'blocknumber' },
  { Token: '$ERC721VotesTimestampMock', mode: 'timestamp' },
];

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockNFToken';
const tokenSymbol = 'MTKN';
const NFT0 = 0n;
const NFT1 = 1n;
const NFT2 = 2n;
const NFT3 = 3n;
const NFT4 = 4n;
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

describe('GovernorERC721', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token, // tokenAddress
        10n, // quorumNumeratorValue
      ]);

      await owner.sendTransaction({ to: mock, value });
      await Promise.all([NFT0, NFT1, NFT2, NFT3, NFT4].map(tokenId => token.$_mint(owner, tokenId)));

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, tokenId: NFT0 });
      await helper.connect(owner).delegate({ token, to: voter2, tokenId: NFT1 });
      await helper.connect(owner).delegate({ token, to: voter2, tokenId: NFT2 });
      await helper.connect(owner).delegate({ token, to: voter3, tokenId: NFT3 });
      await helper.connect(owner).delegate({ token, to: voter4, tokenId: NFT4 });

      return {
        owner,
        voter1,
        voter2,
        voter3,
        voter4,
        receiver,
        token,
        mock,
        helper,
      };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        // initiate fresh proposal
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

      it('deployment check', async function () {
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0n)).to.equal(0n);

        expect(await this.token.getVotes(this.voter1)).to.equal(1n); // NFT0
        expect(await this.token.getVotes(this.voter2)).to.equal(2n); // NFT1 & NFT2
        expect(await this.token.getVotes(this.voter3)).to.equal(1n); // NFT3
        expect(await this.token.getVotes(this.voter4)).to.equal(1n); // NFT4
      });

      it('voting with ERC721 token', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();

        await expect(this.helper.connect(this.voter1).vote({ support: VoteType.For }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter1, this.proposal.id, VoteType.For, 1n, '');

        await expect(this.helper.connect(this.voter2).vote({ support: VoteType.For }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter2, this.proposal.id, VoteType.For, 2n, '');

        await expect(this.helper.connect(this.voter3).vote({ support: VoteType.Against }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter3, this.proposal.id, VoteType.Against, 1n, '');

        await expect(this.helper.connect(this.voter4).vote({ support: VoteType.Abstain }))
          .to.emit(this.mock, 'VoteCast')
          .withArgs(this.voter4, this.proposal.id, VoteType.Abstain, 1n, '');

        await this.helper.waitForDeadline();
        await this.helper.execute();

        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter3)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter4)).to.be.true;

        expect(await this.mock.proposalVotes(this.proposal.id)).to.deep.equal([
          1n, // againstVotes
          3n, // forVotes
          1n, // abstainVotes
        ]);
      });
    });
  }
});
