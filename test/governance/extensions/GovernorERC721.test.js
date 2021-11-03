const { expectEvent } = require('@openzeppelin/test-helpers');
const Enums = require('../../helpers/enums');

const {
  runGovernorWorkflow,
} = require('./../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC721VotesMock');
const Governor = artifacts.require('GovernorERC721Mock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('GovernorERC721Mock', function (accounts) {
  const [ owner, voter1, voter2, voter3, voter4 ] = accounts;

  const name = 'OZ-Governor';
  const tokenName = 'MockNFToken';
  const tokenSymbol = 'MTKN';
  const initalTokenId = web3.utils.toWei('100');
  const NFT1 = web3.utils.toWei('10');
  const NFT2 = web3.utils.toWei('20');
  const NFT3 = web3.utils.toWei('30');

  beforeEach(async function () {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol);
    this.mock = await Governor.new(name, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, initalTokenId);
    await this.token.mint(owner, NFT1);
    await this.token.mint(owner, NFT2);
    await this.token.mint(owner, NFT3);

    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
    await this.token.delegate(voter3, { from: voter3 });
    await this.token.delegate(voter4, { from: voter4 });
  });

  it('deployment check', async function () {
    expect(await this.mock.name()).to.be.equal(name);
    expect(await this.mock.token()).to.be.equal(this.token.address);
    expect(await this.mock.votingDelay()).to.be.bignumber.equal('4');
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal('16');
    expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');
  });

  describe('voting with ERC721 token', function () {
    beforeEach(async function () {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          '<proposal description>',
        ],
        tokenHolder: owner,
        voters: [
          { voter: voter1, nftWeight: initalTokenId, support: Enums.VoteType.For },
          { voter: voter2, nftWeight: NFT1, support: Enums.VoteType.For },
          { voter: voter3, nftWeight: NFT2, support: Enums.VoteType.Against },
          { voter: voter4, nftWeight: NFT3, support: Enums.VoteType.Abstain },
        ],
      };
    });

    afterEach(async function () {
      expect(await this.mock.hasVoted(this.id, owner)).to.be.equal(false);

      for (const vote of this.receipts.castVote.filter(Boolean)) {
        const { voter } = vote.logs.find(Boolean).args;

        expect(await this.mock.hasVoted(this.id, voter)).to.be.equal(true);

        expectEvent(
          vote,
          'VoteCast',
          this.settings.voters.find(({ address }) => address === voter),
        );

        expect(await this.token.getVotes(voter, vote.blockNumber)).to.be.bignumber.equal('1');
      }

      await this.mock.proposalVotes(this.id).then(result => {
        for (const [key, value] of Object.entries(Enums.VoteType)) {
          expect(result[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
            Object.values(this.settings.voters).filter(({ support }) => support === value).length.toString(),
          );
        }
      });
    });

    runGovernorWorkflow();
  });
});
