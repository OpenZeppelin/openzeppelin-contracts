const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const Enums = require('../../helpers/enums');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { EIP712Domain } = require('../../helpers/eip712');
const { fromRpcSig } = require('ethereumjs-util');

const { runGovernorWorkflow } = require('../GovernorWorkflow.behavior');
const { expect } = require('chai');

const Token = artifacts.require('ERC20VotesCompMock');
const Governor = artifacts.require('GovernorWithParamsMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('GovernorWithParams', function (accounts) {
  const [owner, proposer, voter1, voter2, voter3, voter4] = accounts;

  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = new BN(4);
  const votingPeriod = new BN(16);

  beforeEach(async function () {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol);
    this.mock = await Governor.new(name, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
    await this.token.delegate(voter3, { from: voter3 });
    await this.token.delegate(voter4, { from: voter4 });
  });

  it('deployment check', async function () {
    expect(await this.mock.name()).to.be.equal(name);
    expect(await this.mock.token()).to.be.equal(this.token.address);
    expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
  });

  describe('nominal is unaffected', function () {
    beforeEach(async function () {
      this.settings = {
        proposal: [
          [this.receiver.address],
          [0],
          [this.receiver.contract.methods.mockFunction().encodeABI()],
          '<proposal description>',
        ],
        proposer,
        tokenHolder: owner,
        voters: [
          { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For, reason: 'This is nice' },
          { voter: voter2, weight: web3.utils.toWei('7'), support: Enums.VoteType.For },
          { voter: voter3, weight: web3.utils.toWei('5'), support: Enums.VoteType.Against },
          { voter: voter4, weight: web3.utils.toWei('2'), support: Enums.VoteType.Abstain },
        ],
      };
    });

    afterEach(async function () {
      expect(await this.mock.hasVoted(this.id, owner)).to.be.equal(false);
      expect(await this.mock.hasVoted(this.id, voter1)).to.be.equal(true);
      expect(await this.mock.hasVoted(this.id, voter2)).to.be.equal(true);

      await this.mock.proposalVotes(this.id).then((result) => {
        for (const [key, value] of Object.entries(Enums.VoteType)) {
          expect(result[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
            Object.values(this.settings.voters)
              .filter(({ support }) => support === value)
              .reduce((acc, { weight }) => acc.add(new BN(weight)), new BN('0')),
          );
        }
      });

      const startBlock = new BN(this.receipts.propose.blockNumber).add(votingDelay);
      const endBlock = new BN(this.receipts.propose.blockNumber).add(votingDelay).add(votingPeriod);
      expect(await this.mock.proposalSnapshot(this.id)).to.be.bignumber.equal(startBlock);
      expect(await this.mock.proposalDeadline(this.id)).to.be.bignumber.equal(endBlock);

      expectEvent(this.receipts.propose, 'ProposalCreated', {
        proposalId: this.id,
        proposer,
        targets: this.settings.proposal[0],
        // values: this.settings.proposal[1].map(value => new BN(value)),
        signatures: this.settings.proposal[2].map(() => ''),
        calldatas: this.settings.proposal[2],
        startBlock,
        endBlock,
        description: this.settings.proposal[3],
      });

      this.receipts.castVote.filter(Boolean).forEach((vote) => {
        const { voter } = vote.logs.filter(({ event }) => event === 'VoteCast').find(Boolean).args;
        expectEvent(
          vote,
          'VoteCast',
          this.settings.voters.find(({ address }) => address === voter),
        );
      });
      expectEvent(this.receipts.execute, 'ProposalExecuted', { proposalId: this.id });
      await expectEvent.inTransaction(this.receipts.execute.transactionHash, this.receiver, 'MockFunctionCalled');
    });
    runGovernorWorkflow();
  });

  describe('Voting with params is properly supported', function () {
    const voter2Weight = web3.utils.toWei('1.0');
    beforeEach(async function () {
      this.settings = {
        proposal: [
          [this.receiver.address],
          [0],
          [this.receiver.contract.methods.mockFunction().encodeABI()],
          '<proposal description>',
        ],
        proposer,
        tokenHolder: owner,
        voters: [
          { voter: voter1, weight: web3.utils.toWei('0.2'), support: Enums.VoteType.Against },
          { voter: voter2, weight: voter2Weight }, // do not actually vote, only getting tokenss
        ],
        steps: {
          wait: { enable: false },
          execute: { enable: false },
        },
      };
    });

    afterEach(async function () {
      expect(await this.mock.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Active);

      const uintParam = new BN(1);
      const strParam = 'These are my params';
      const reducedWeight = new BN(voter2Weight).sub(uintParam);
      const params = web3.eth.abi.encodeParameters(['uint256', 'string'], [uintParam, strParam]);
      const tx = await this.mock.castVoteWithReasonAndParams(this.id, Enums.VoteType.For, '', params, { from: voter2 });

      expectEvent(tx, 'CountParams', { uintParam, strParam });
      expectEvent(tx, 'VoteCastWithParams', { voter: voter2, weight: reducedWeight, params });
      const votes = await this.mock.proposalVotes(this.id);
      expect(votes.forVotes).to.be.bignumber.equal(reducedWeight);
    });
    runGovernorWorkflow();
  });

  describe('Voting with params by signature is properly supported', function () {
    const voterBySig = Wallet.generate(); // generate voter by signature wallet
    const sigVoterWeight = web3.utils.toWei('1.0');

    beforeEach(async function () {
      this.chainId = await web3.eth.getChainId();
      this.voter = web3.utils.toChecksumAddress(voterBySig.getAddressString());

      // use delegateBySig to enable vote delegation sig voting wallet
      const { v, r, s } = fromRpcSig(
        ethSigUtil.signTypedMessage(voterBySig.getPrivateKey(), {
          data: {
            types: {
              EIP712Domain,
              Delegation: [
                { name: 'delegatee', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'expiry', type: 'uint256' },
              ],
            },
            domain: { name: tokenName, version: '1', chainId: this.chainId, verifyingContract: this.token.address },
            primaryType: 'Delegation',
            message: { delegatee: this.voter, nonce: 0, expiry: constants.MAX_UINT256 },
          },
        }),
      );
      await this.token.delegateBySig(this.voter, 0, constants.MAX_UINT256, v, r, s);

      this.settings = {
        proposal: [
          [this.receiver.address],
          [0],
          [this.receiver.contract.methods.mockFunction().encodeABI()],
          '<proposal description>',
        ],
        proposer,
        tokenHolder: owner,
        voters: [
          { voter: voter1, weight: web3.utils.toWei('0.2'), support: Enums.VoteType.Against },
          { voter: this.voter, weight: sigVoterWeight }, // do not actually vote, only getting tokens
        ],
        steps: {
          wait: { enable: false },
          execute: { enable: false },
        },
      };
    });

    afterEach(async function () {
      expect(await this.mock.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Active);

      const reason = 'This is my reason';
      const uintParam = new BN(1);
      const strParam = 'These are my params';
      const reducedWeight = new BN(sigVoterWeight).sub(uintParam);
      const params = web3.eth.abi.encodeParameters(['uint256', 'string'], [uintParam, strParam]);

      // prepare signature for vote by signature
      const { v, r, s } = fromRpcSig(
        ethSigUtil.signTypedMessage(voterBySig.getPrivateKey(), {
          data: {
            types: {
              EIP712Domain,
              ExtendedBallot: [
                { name: 'proposalId', type: 'uint256' },
                { name: 'support', type: 'uint8' },
                { name: 'reason', type: 'string' },
                { name: 'params', type: 'bytes' },
              ],
            },
            domain: { name, version, chainId: this.chainId, verifyingContract: this.mock.address },
            primaryType: 'ExtendedBallot',
            message: { proposalId: this.id, support: Enums.VoteType.For, reason, params },
          },
        }),
      );

      const tx = await this.mock.castVoteWithReasonAndParamsBySig(this.id, Enums.VoteType.For, reason, params, v, r, s);

      expectEvent(tx, 'CountParams', { uintParam, strParam });
      expectEvent(tx, 'VoteCastWithParams', { voter: this.voter, weight: reducedWeight, params });
      const votes = await this.mock.proposalVotes(this.id);
      expect(votes.forVotes).to.be.bignumber.equal(reducedWeight);
    });
    runGovernorWorkflow();
  });
});
