const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { EIP712Domain } = require('../../helpers/eip712');
const { fromRpcSig } = require('ethereumjs-util');

const {
  runGovernorWorkflow,
} = require('../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Governance = artifacts.require('GovernanceScoreMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('Governance', function (accounts) {
  const [ owner, voter1, voter2 ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol);
    this.governor = await Governance.new(name, version, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
  });

  it('deployment check', async () => {
    expect(await this.governor.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governor.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');
    expect(await this.governor.maxScore()).to.be.bignumber.equal('100');
    expect(await this.governor.requiredScore()).to.be.bignumber.equal('50');
  });

  describe('scenario', () => {
    describe('nominal', () => {
      beforeEach(async () => {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          tokenHolder: owner,
          voters: [
            { address: voter1, weight: web3.utils.toWei('1'), support: new BN('100') },
            { address: voter2, weight: web3.utils.toWei('1'), support: new BN('40') },
          ],
        };
      });
      afterEach(async () => {
        expect(await this.governor.hasVoted(this.id, owner)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, voter1)).to.be.equal(true);
        expect(await this.governor.hasVoted(this.id, voter2)).to.be.equal(true);

        expect(await this.governor.proposalWeight(this.id))
          .to.be.bignumber.equal(Object.values(this.settings.voters).reduce(
            (acc, { weight }) => acc.add(new BN(weight)),
            new BN('0'),
          ));
        expect(await this.governor.proposalScore(this.id))
          .to.be.bignumber.equal(Object.values(this.settings.voters).reduce(
            (acc, { weight, support }) => acc.add(new BN(weight).mul(support)),
            new BN('0'),
          ));

        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          { proposalId: this.id, votingDeadline: this.deadline },
        );
        expectEvent(
          this.receipts.execute,
          'ProposalExecuted',
          { proposalId: this.id },
        );
        expectEvent.inTransaction(
          this.receipts.execute.transactionHash,
          this.receiver,
          'MockFunctionCalled',
        );
      });
      runGovernorWorkflow();
    });

    describe('vote with signature', () => {
      beforeEach(async () => {
        const chainId = await web3.eth.getChainId();
        // generate voter by signature wallet
        const voterBySig = Wallet.generate();
        this.voter = web3.utils.toChecksumAddress(voterBySig.getAddressString());
        // use delegateBySig to enable vote delegation for this wallet
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          voterBySig.getPrivateKey(),
          {
            data: {
              types: {
                EIP712Domain,
                Delegation: [
                  { name: 'delegatee', type: 'address' },
                  { name: 'nonce', type: 'uint256' },
                  { name: 'expiry', type: 'uint256' },
                ],
              },
              domain: { name: tokenName, version: '1', chainId, verifyingContract: this.token.address },
              primaryType: 'Delegation',
              message: { delegatee: this.voter, nonce: 0, expiry: constants.MAX_UINT256 },
            },
          },
        ));
        await this.token.delegateBySig(this.voter, 0, constants.MAX_UINT256, v, r, s);
        // prepare signature for vote by signature
        const signature = async (message) => {
          return fromRpcSig(ethSigUtil.signTypedMessage(
            voterBySig.getPrivateKey(),
            {
              data: {
                types: {
                  EIP712Domain,
                  Ballot: [
                    { name: 'proposalId', type: 'uint256' },
                    { name: 'support', type: 'uint8' },
                  ],
                },
                domain: { name, version, chainId, verifyingContract: this.governor.address },
                primaryType: 'Ballot',
                message,
              },
            },
          ));
        };

        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          tokenHolder: owner,
          voters: [
            { address: this.voter, signature, weight: web3.utils.toWei('1'), support: new BN('100') },
          ],
        };
      });
      afterEach(async () => {
        expect(await this.governor.hasVoted(this.id, owner)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, voter1)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, voter2)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, this.voter)).to.be.equal(true);

        expect(await this.governor.proposalWeight(this.id))
          .to.be.bignumber.equal(Object.values(this.settings.voters).reduce(
            (acc, { weight }) => acc.add(new BN(weight)),
            new BN('0'),
          ));
        expect(await this.governor.proposalScore(this.id))
          .to.be.bignumber.equal(Object.values(this.settings.voters).reduce(
            (acc, { weight, support }) => acc.add(new BN(weight).mul(support)),
            new BN('0'),
          ));

        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          { proposalId: this.id, votingDeadline: this.deadline },
        );
        expectEvent(
          this.receipts.execute,
          'ProposalExecuted',
          { proposalId: this.id },
        );
        expectEvent.inTransaction(
          this.receipts.execute.transactionHash,
          this.receiver,
          'MockFunctionCalled',
        );
      });
      runGovernorWorkflow();
    });

    describe('over max score', () => {
      beforeEach(async () => {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          tokenHolder: owner,
          voters: [
            {
              address: voter1,
              weight: web3.utils.toWei('1'),
              support: new BN('255'),
              reason: 'ScoreVoting: voting over the maximum score',
            },
          ],
          steps: {
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('quorum not reached', () => {
      beforeEach(async () => {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          tokenHolder: owner,
          voters: [
            { address: voter1, weight: web3.utils.toWei('0'), support: new BN('100') },
          ],
          steps: {
            execute: { reason: 'Governance: quorum not reached' },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('score not reached', () => {
      beforeEach(async () => {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          tokenHolder: owner,
          voters: [
            { address: voter1, weight: web3.utils.toWei('1'), support: new BN('10') },
          ],
          steps: {
            execute: { reason: 'Governance: required score not reached' },
          },
        };
      });
      runGovernorWorkflow();
    });
  });
});
