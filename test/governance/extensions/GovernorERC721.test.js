const { expectEvent } = require('@openzeppelin/test-helpers');
const { BN } = require('bn.js');
const Enums = require('../../helpers/enums');

const {
  runGovernorWorkflow,
} = require('./../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC721VotesMock');
const Governor = artifacts.require('GovernorVoteMocks');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('GovernorERC721Mock', function (accounts) {
  const [ owner, voter1, voter2, voter3, voter4 ] = accounts;

  const name = 'OZ-Governor';
  const tokenName = 'MockNFToken';
  const tokenSymbol = 'MTKN';
  const NFT0 = web3.utils.toWei('100');
  const NFT1 = web3.utils.toWei('10');
  const NFT2 = web3.utils.toWei('20');
  const NFT3 = web3.utils.toWei('30');
  const NFT4 = web3.utils.toWei('40');

  // Must be the same as in contract
  const ProposalState = {
    Pending: new BN('0'),
    Active: new BN('1'),
    Canceled: new BN('2'),
    Defeated: new BN('3'),
    Succeeded: new BN('4'),
    Queued: new BN('5'),
    Expired: new BN('6'),
    Executed: new BN('7'),
  };

  beforeEach(async function () {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol);
    this.mock = await Governor.new(name, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, NFT0);
    await this.token.mint(owner, NFT1);
    await this.token.mint(owner, NFT2);
    await this.token.mint(owner, NFT3);
    await this.token.mint(owner, NFT4);

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
          { voter: voter1, nfts: [NFT0], support: Enums.VoteType.For },
          { voter: voter2, nfts: [NFT1, NFT2], support: Enums.VoteType.For },
          { voter: voter3, nfts: [NFT3], support: Enums.VoteType.Against },
          { voter: voter4, nfts: [NFT4], support: Enums.VoteType.Abstain },
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

        if (voter === voter2) {
          expect(await this.token.getVotes(voter, vote.blockNumber)).to.be.bignumber.equal('2');
        } else {
          expect(await this.token.getVotes(voter, vote.blockNumber)).to.be.bignumber.equal('1');
        }
      }

      await this.mock.proposalVotes(this.id).then(result => {
        for (const [key, value] of Object.entries(Enums.VoteType)) {
          expect(result[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
            Object.values(this.settings.voters).filter(({ support }) => support === value).reduce(
              (acc, { nfts }) => acc.add(new BN(nfts.length)),
              new BN('0'),
            ),
          );
        }
      });

      expect(await this.mock.state(this.id)).to.be.bignumber.equal(ProposalState.Executed);
    });

    runGovernorWorkflow();
  });
});
