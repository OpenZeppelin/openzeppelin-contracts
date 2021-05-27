const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { EIP712Domain } = require('../helpers/eip712');
const { fromRpcSig } = require('ethereumjs-util');

const {
  runGovernorWorkflow,
} = require('./GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Governance = artifacts.require('GovernanceMock');
const CallReceiver = artifacts.require('CallReceiverMock');

const PROPOSAL_STATE = [
  'Pending',
  'Active',
  'Canceled',
  'Defeated',
  'Succeeded',
  'Queued',
  'Expired',
  'Executed',
].reduce((acc, key, i) => ({ ...acc, [key]: new BN(i) }), {});

contract('Governance', function (accounts) {
  const [ owner, voter1, voter2 ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol, owner, tokenSupply);
    this.governor = await Governance.new(name, version, this.token.address);
    this.receiver = await CallReceiver.new();
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
  });

  it('deployment check', async () => {
    expect(await this.governor.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governor.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governor.maxScore()).to.be.bignumber.equal('100');
    expect(await this.governor.requiredScore()).to.be.bignumber.equal('50');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');
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

        expect(await this.governor.proposalSupply(this.id))
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

        expect(await this.governor.proposalSupply(this.id))
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

    describe('send ethers', () => {
      beforeEach(async () => {
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
            { address: voter1, weight: web3.utils.toWei('1'), support: new BN('100') },
            { address: voter2, weight: web3.utils.toWei('1'), support: new BN('40') },
          ],
        };
      });
      afterEach(async () => {
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
        expect(await web3.eth.getBalance(this.governor.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(this.receiver)).to.be.bignumber.equal(this.value);
      });
      runGovernorWorkflow();
    });

    describe('missing proposal', () => {
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
              support: new BN('100'),
              reason: 'Governance: vote not currently active',
            },
            {
              address: voter2,
              weight: web3.utils.toWei('1'),
              support: new BN('40'),
              reason: 'Governance: vote not currently active',
            },
          ],
          steps: {
            propose: { enable: false },
            wait: { enable: false },
            execute: { reason: 'Governance: proposal not ready' },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('duplicate pending proposal', () => {
      beforeEach(async () => {
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
      afterEach(async () => {
        await expectRevert(this.governor.propose(...this.settings.proposal), 'Governance: proposal already exists');
      });
      runGovernorWorkflow();
    });

    describe('duplicate executed proposal', () => {
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
        await expectRevert(this.governor.propose(...this.settings.proposal), 'Governance: proposal already exists');
      });
      runGovernorWorkflow();
    });

    describe('vote over max', () => {
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
              reason: 'Governance: invalid score',
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

    describe('double cast', () => {
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
              support: new BN('100'),
            },
            {
              address: voter1,
              weight: web3.utils.toWei('1'),
              support: new BN('100'),
              reason: 'Governance: vote already casted',
            },
          ],
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
            { address: voter1, weight: web3.utils.toWei('1'), support: new BN('0') },
          ],
          steps: {
            execute: { reason: 'Governance: required score not reached' },
          },
        };
      });
      runGovernorWorkflow();
    });

    describe('vote not over', () => {
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
          ],
          steps: {
            wait: { enable: false },
            execute: { reason: 'Governance: proposal not ready' },
          },
        };
      });
      runGovernorWorkflow();
    });
  });

  describe('state', () => {
    describe('Unset', () => {
      beforeEach(async () => {
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
      afterEach(async () => {
        await expectRevert(this.governor.state(this.id), 'Governor::state: invalid proposal id');
      });
      runGovernorWorkflow();
    });

    describe('Active', () => {
      beforeEach(async () => {
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
      afterEach(async () => {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Pending);
        await time.advanceBlock();
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Active);
      });
      runGovernorWorkflow();
    });

    describe('Defeated', () => {
      beforeEach(async () => {
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
      afterEach(async () => {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Defeated);
      });
      runGovernorWorkflow();
    });

    describe('Succeeded', () => {
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
          ],
          steps: {
            execute: { enable: false },
          },
        };
      });
      afterEach(async () => {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Succeeded);
      });
      runGovernorWorkflow();
    });

    describe('Executed', () => {
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
          ],
        };
      });
      afterEach(async () => {
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Executed);
      });
      runGovernorWorkflow();
    });
  });

  describe('Cancel', () => {
    describe('Before proposal', () => {
      beforeEach(async () => {
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
      afterEach(async () => {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

        await expectRevert(
          this.governor.propose(...this.settings.proposal),
          'Governance: proposal already exists',
        );
      });
      runGovernorWorkflow();
    });

    describe('After proposal', () => {
      beforeEach(async () => {
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
      afterEach(async () => {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

        await expectRevert(
          this.governor.castVote(this.id, new BN('100'), { from: voter1 }),
          'Governance: vote not currently active',
        );
      });
      runGovernorWorkflow();
    });

    describe('After vote', () => {
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
          ],
          steps: {
            wait: { enable: false },
            execute: { enable: false },
          },
        };
      });
      afterEach(async () => {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

        await expectRevert(
          this.governor.execute(...this.settings.proposal.slice(0, -1)),
          'Governance: proposal not ready',
        );
      });
      runGovernorWorkflow();
    });

    describe('After deadline', () => {
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
          ],
          steps: {
            execute: { enable: false },
          },
        };
      });
      afterEach(async () => {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

        await expectRevert(
          this.governor.execute(...this.settings.proposal.slice(0, -1)),
          'Governance: proposal not ready',
        );
      });
      runGovernorWorkflow();
    });

    describe('After execution', () => {
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
          ],
        };
      });
      afterEach(async () => {
        await this.governor.cancel(...this.settings.proposal.slice(0, -1));
        expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

        await expectRevert(
          this.governor.execute(...this.settings.proposal.slice(0, -1)),
          'Governance: proposal not ready',
        );
      });
      runGovernorWorkflow();
    });
  });

  describe('Proposal length', () => {
    it('empty', async () => {
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

    it('missmatch #1', async () => {
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

    it('missmatch #2', async () => {
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

    it('missmatch #3', async () => {
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
