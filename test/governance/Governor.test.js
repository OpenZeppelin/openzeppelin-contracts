const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const Enums = require('../helpers/enums');
const { EIP712Domain } = require('../helpers/eip712');
const { fromRpcSig } = require('ethereumjs-util');

const {
  runGovernorWorkflow,
} = require('./GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Governance = artifacts.require('GovernanceMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('Governance', function (accounts) {
  const [ owner, proposer, voter1, voter2, voter3, voter4 ] = accounts;

  const name = 'OZ-Governance';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async function () {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol);
    this.governor = await Governance.new(name, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
    await this.token.delegate(voter3, { from: voter3 });
    await this.token.delegate(voter4, { from: voter4 });
  });

  it('deployment check', async function () {
    expect(await this.governor.name()).to.be.equal(name);
    expect(await this.governor.token()).to.be.equal(this.token.address);
    expect(await this.governor.votingDelay()).to.be.bignumber.equal('0');
    expect(await this.governor.votingPeriod()).to.be.bignumber.equal('16');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');
  });

  describe('scenario', function () {
    describe('nominal', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          proposer,
          tokenHolder: owner,
          voters: [
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For, reason: 'This is nice' },
            { voter: voter2, weight: web3.utils.toWei('10'), support: Enums.VoteType.For },
            { voter: voter3, weight: web3.utils.toWei('5'), support: Enums.VoteType.Against },
            { voter: voter4, weight: web3.utils.toWei('2'), support: Enums.VoteType.Abstain },
          ],
        };
        this.votingDelay = await this.governor.votingDelay();
        this.votingPeriod = await this.governor.votingPeriod();
      });
      afterEach(async function () {
        expect(await this.governor.hasVoted(this.id, owner)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, voter1)).to.be.equal(true);
        expect(await this.governor.hasVoted(this.id, voter2)).to.be.equal(true);

        await this.governor.proposalVotes(this.id).then(result => {
          for (const [key, value] of Object.entries(Enums.VoteType)) {
            expect(result[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
              Object.values(this.settings.voters).filter(({ support }) => support === value).reduce(
                (acc, { weight }) => acc.add(new BN(weight)),
                new BN('0'),
              ),
            );
          }
        });

        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          {
            proposalId: this.id,
            proposer,
            targets: this.settings.proposal[0],
            // values: this.settings.proposal[1].map(value => new BN(value)),
            signatures: this.settings.proposal[2].map(() => ''),
            calldatas: this.settings.proposal[2],
            startBlock: new BN(this.receipts.propose.blockNumber).add(this.votingDelay),
            endBlock: new BN(this.receipts.propose.blockNumber).add(this.votingDelay).add(this.votingPeriod),
            description: this.settings.proposal[4],
          },
        );

        expectEvent(
          this.receipts.propose,
          'ProposalSalt',
          {
            proposalId: this.id,
            salt: this.settings.proposal[3],
          },
        );

        this.receipts.castVote.forEach(vote => {
          const { voter } = vote.logs.find(Boolean).args;
          expectEvent(
            vote,
            'VoteCast',
            this.settings.voters.find(({ address }) => address === voter),
          );
        });
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

    describe('vote with signature', function () {
      beforeEach(async function () {
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
            { voter: this.voter, signature, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
        };
      });
      afterEach(async function () {
        expect(await this.governor.hasVoted(this.id, owner)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, voter1)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, voter2)).to.be.equal(false);
        expect(await this.governor.hasVoted(this.id, this.voter)).to.be.equal(true);

        await this.governor.proposalVotes(this.id).then(result => {
          for (const [key, value] of Object.entries(Enums.VoteType)) {
            expect(result[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
              Object.values(this.settings.voters).filter(({ support }) => support === value).reduce(
                (acc, { weight }) => acc.add(new BN(weight)),
                new BN('0'),
              ),
            );
          }
        });

        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          { proposalId: this.id },
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

    describe('send ethers', function () {
      beforeEach(async function () {
        this.receiver = web3.utils.toChecksumAddress(web3.utils.randomHex(20));
        this.value = web3.utils.toWei('1');

        await web3.eth.sendTransaction({ from: owner, to: this.governor.address, value: this.value });
        expect(await web3.eth.getBalance(this.governor.address)).to.be.bignumber.equal(this.value);

        this.settings = {
          proposal: [
            [ this.receiver ],
            [ this.value ],
            [ '0x' ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          tokenHolder: owner,
          voters: [
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
            { voter: voter2, weight: web3.utils.toWei('1'), support: Enums.VoteType.Abstain },
          ],
        };
      });
      afterEach(async function () {
        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          { proposalId: this.id },
        );
        expectEvent(
          this.receipts.execute,
          'ProposalExecuted',
          { proposalId: this.id },
        );
        expect(await web3.eth.getBalance(this.governor.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(this.receiver)).to.be.bignumber.equal(this.value);
      });
      runGovernorWorkflow();
    });

    describe('missing proposal', function () {
      beforeEach(async function () {
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
              voter: voter1,
              weight: web3.utils.toWei('1'),
              support: Enums.VoteType.For,
              error: 'Governor::state: invalid proposal id',
            },
            {
              voter: voter2,
              weight: web3.utils.toWei('1'),
              support: Enums.VoteType.Abstain,
              error: 'Governor::state: invalid proposal id',
            },
          ],
          steps: {
            propose: { enable: false },
            wait: { enable: false },
            execute: { error: 'Governor::state: invalid proposal id' },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('duplicate pending proposal', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          steps: {
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        await expectRevert(this.governor.propose(...this.settings.proposal), 'Governance: proposal already exists');
      });
      runGovernorWorkflow();
    });

    describe('duplicate executed proposal', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
            { voter: voter2, weight: web3.utils.toWei('1'), support: Enums.VoteType.Abstain },
          ],
        };
      });
      afterEach(async function () {
        await expectRevert(this.governor.propose(...this.settings.proposal), 'Governance: proposal already exists');
      });
      runGovernorWorkflow();
    });

    describe('Invalid vote type', function () {
      beforeEach(async function () {
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
              voter: voter1,
              weight: web3.utils.toWei('1'),
              support: new BN('255'),
              error: 'SimpleVoting: invalid value for enum VoteType',
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

    describe('double cast', function () {
      beforeEach(async function () {
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
              voter: voter1,
              weight: web3.utils.toWei('1'),
              support: Enums.VoteType.For,
            },
            {
              voter: voter1,
              weight: web3.utils.toWei('1'),
              support: Enums.VoteType.For,
              error: 'SimpleVoting: vote already casted',
            },
          ],
        };
      });
      runGovernorWorkflow();
    });

    describe('quorum not reached', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('0'), support: Enums.VoteType.For },
          ],
          steps: {
            execute: { error: 'Governance: proposal not successfull' },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('score not reached', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.Against },
          ],
          steps: {
            execute: { error: 'Governance: proposal not successfull' },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('vote not over', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
          steps: {
            wait: { enable: false },
            execute: { error: 'Governance: proposal not successfull' },
          },
        };
      });
      runGovernorWorkflow();
    });
  });

  describe('state', function () {
    describe('Unset', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          steps: {
            propose: { enable: false },
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        await expectRevert(this.governor.state(this.id), 'Governor::state: invalid proposal id');
      });
      runGovernorWorkflow();
    });

    describe('Active', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          steps: {
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        // TODO: votingDelay > 0
        // expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
        // await time.advanceBlock();
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
      });
      runGovernorWorkflow();
    });

    describe('Defeated', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          steps: {
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Defeated);
      });
      runGovernorWorkflow();
    });

    describe('Succeeded', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
          steps: {
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
      });
      runGovernorWorkflow();
    });

    describe('Executed', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
        };
      });
      afterEach(async function () {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
      });
      runGovernorWorkflow();
    });
  });

  describe('Cancel', function () {
    describe('Before proposal', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          steps: {
            propose: { enable: false },
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        await expectRevert(
          this.governor.cancel(...this.settings.proposal.slice(0, -1)),
          'Governor::state: invalid proposal id',
        );
      });
      runGovernorWorkflow();
    });

    describe('After proposal', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.receiver.address ],
            [ web3.utils.toWei('0') ],
            [ this.receiver.contract.methods.mockFunction().encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          steps: {
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await expectRevert(
          this.governor.castVote(this.id, new BN('100'), { from: voter1 }),
          'Governance: vote not currently active',
        );
      });
      runGovernorWorkflow();
    });

    describe('After vote', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
          steps: {
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await expectRevert(
          this.governor.execute(...this.settings.proposal.slice(0, -1)),
          'Governance: proposal not successfull',
        );
      });
      runGovernorWorkflow();
    });

    describe('After deadline', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
          steps: {
            execute: { enable: false },
          },
        };
      });
      afterEach(async function () {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await expectRevert(
          this.governor.execute(...this.settings.proposal.slice(0, -1)),
          'Governance: proposal not successfull',
        );
      });
      runGovernorWorkflow();
    });

    describe('After execution', function () {
      beforeEach(async function () {
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
            { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          ],
        };
      });
      afterEach(async function () {
        await expectRevert(
          this.governor.cancel(...this.settings.proposal.slice(0, -1)),
          'Governance: proposal not active',
        );
      });
      runGovernorWorkflow();
    });
  });

  describe('Proposal length', function () {
    it('empty', async function () {
      await expectRevert(
        this.governor.propose(
          [],
          [],
          [],
          web3.utils.randomHex(32),
          '<proposal description>',
        ),
        'Governance: empty proposal',
      );
    });

    it('missmatch #1', async function () {
      await expectRevert(
        this.governor.propose(
          [ ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ),
        'Governance: invalid proposal length',
      );
    });

    it('missmatch #2', async function () {
      await expectRevert(
        this.governor.propose(
          [ this.receiver.address ],
          [ ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ),
        'Governance: invalid proposal length',
      );
    });

    it('missmatch #3', async function () {
      await expectRevert(
        this.governor.propose(
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ),
        'Governance: invalid proposal length',
      );
    });
  });
});
