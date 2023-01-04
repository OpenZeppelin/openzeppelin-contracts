const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { fromRpcSig } = require('ethereumjs-util');
const Enums = require('../helpers/enums');
const { EIP712Domain } = require('../helpers/eip712');
const { GovernorHelper } = require('../helpers/governance');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');

const Token = artifacts.require('$ERC20Votes');
const Governor = artifacts.require('$GovernorMock');
const CallReceiver = artifacts.require('CallReceiverMock');
const ERC721 = artifacts.require('$ERC721');
const ERC1155 = artifacts.require('$ERC1155');

contract('Governor', function (accounts) {
  const [owner, proposer, voter1, voter2, voter3, voter4] = accounts;
  const empty = web3.utils.toChecksumAddress(web3.utils.randomHex(20));

  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = new BN(4);
  const votingPeriod = new BN(16);
  const value = web3.utils.toWei('1');

  beforeEach(async function () {
    this.chainId = await web3.eth.getChainId();
    this.token = await Token.new(tokenName, tokenSymbol, tokenName);
    this.mock = await Governor.new(
      name, // name
      votingDelay, // initialVotingDelay
      votingPeriod, // initialVotingPeriod
      0, // initialProposalThreshold
      this.token.address, // tokenAddress
      10, // quorumNumeratorValue
    );
    this.receiver = await CallReceiver.new();

    this.helper = new GovernorHelper(this.mock);

    await web3.eth.sendTransaction({ from: owner, to: this.mock.address, value });

    await this.token.$_mint(owner, tokenSupply);
    await this.helper.delegate({ token: this.token, to: voter1, value: web3.utils.toWei('10') }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter2, value: web3.utils.toWei('7') }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter3, value: web3.utils.toWei('5') }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter4, value: web3.utils.toWei('2') }, { from: owner });

    this.proposal = this.helper.setProposal(
      [
        {
          target: this.receiver.address,
          data: this.receiver.contract.methods.mockFunction().encodeABI(),
          value,
        },
      ],
      '<proposal description>',
    );
  });

  shouldSupportInterfaces(['ERC165', 'ERC1155Receiver', 'Governor', 'GovernorWithParams']);

  it('deployment check', async function () {
    expect(await this.mock.name()).to.be.equal(name);
    expect(await this.mock.token()).to.be.equal(this.token.address);
    expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
    expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');
    expect(await this.mock.COUNTING_MODE()).to.be.equal('support=bravo&quorum=for,abstain');
  });

  it('nominal workflow', async function () {
    // Before
    expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(value);
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');

    // Run proposal
    const txPropose = await this.helper.propose({ from: proposer });

    expectEvent(txPropose, 'ProposalCreated', {
      proposalId: this.proposal.id,
      proposer,
      targets: this.proposal.targets,
      // values: this.proposal.values,
      signatures: this.proposal.signatures,
      calldatas: this.proposal.data,
      startBlock: new BN(txPropose.receipt.blockNumber).add(votingDelay),
      endBlock: new BN(txPropose.receipt.blockNumber).add(votingDelay).add(votingPeriod),
      description: this.proposal.description,
    });

    await this.helper.waitForSnapshot();

    expectEvent(
      await this.helper.vote({ support: Enums.VoteType.For, reason: 'This is nice' }, { from: voter1 }),
      'VoteCast',
      {
        voter: voter1,
        support: Enums.VoteType.For,
        reason: 'This is nice',
        weight: web3.utils.toWei('10'),
      },
    );

    expectEvent(await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 }), 'VoteCast', {
      voter: voter2,
      support: Enums.VoteType.For,
      weight: web3.utils.toWei('7'),
    });

    expectEvent(await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 }), 'VoteCast', {
      voter: voter3,
      support: Enums.VoteType.Against,
      weight: web3.utils.toWei('5'),
    });

    expectEvent(await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 }), 'VoteCast', {
      voter: voter4,
      support: Enums.VoteType.Abstain,
      weight: web3.utils.toWei('2'),
    });

    await this.helper.waitForDeadline();

    const txExecute = await this.helper.execute();

    expectEvent(txExecute, 'ProposalExecuted', { proposalId: this.proposal.id });

    await expectEvent.inTransaction(txExecute.tx, this.receiver, 'MockFunctionCalled');

    // After
    expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(true);
    expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(true);
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);
  });

  it('vote with signature', async function () {
    const voterBySig = Wallet.generate();
    const voterBySigAddress = web3.utils.toChecksumAddress(voterBySig.getAddressString());

    const signature = async message => {
      return fromRpcSig(
        ethSigUtil.signTypedMessage(voterBySig.getPrivateKey(), {
          data: {
            types: {
              EIP712Domain,
              Ballot: [
                { name: 'proposalId', type: 'uint256' },
                { name: 'support', type: 'uint8' },
              ],
            },
            domain: { name, version, chainId: this.chainId, verifyingContract: this.mock.address },
            primaryType: 'Ballot',
            message,
          },
        }),
      );
    };

    await this.token.delegate(voterBySigAddress, { from: voter1 });

    // Run proposal
    await this.helper.propose();
    await this.helper.waitForSnapshot();
    expectEvent(await this.helper.vote({ support: Enums.VoteType.For, signature }), 'VoteCast', {
      voter: voterBySigAddress,
      support: Enums.VoteType.For,
    });
    await this.helper.waitForDeadline();
    await this.helper.execute();

    // After
    expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voterBySigAddress)).to.be.equal(true);
  });

  it('send ethers', async function () {
    this.proposal = this.helper.setProposal(
      [
        {
          target: empty,
          value,
        },
      ],
      '<proposal description>',
    );

    // Before
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(value);
    expect(await web3.eth.getBalance(empty)).to.be.bignumber.equal('0');

    // Run proposal
    await this.helper.propose();
    await this.helper.waitForSnapshot();
    await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await this.helper.waitForDeadline();
    await this.helper.execute();

    // After
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(empty)).to.be.bignumber.equal(value);
  });

  describe('should revert', function () {
    describe('on propose', function () {
      it('if proposal already exists', async function () {
        await this.helper.propose();
        await expectRevert(this.helper.propose(), 'Governor: proposal already exists');
      });
    });

    describe('on vote', function () {
      it('if proposal does not exist', async function () {
        await expectRevert(
          this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
          'Governor: unknown proposal id',
        );
      });

      it('if voting has not started', async function () {
        await this.helper.propose();
        await expectRevert(
          this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
          'Governor: vote not currently active',
        );
      });

      it('if support value is invalid', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await expectRevert(
          this.helper.vote({ support: new BN('255') }),
          'GovernorVotingSimple: invalid value for enum VoteType',
        );
      });

      it('if vote was already casted', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await expectRevert(
          this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
          'GovernorVotingSimple: vote already cast',
        );
      });

      it('if voting is over', async function () {
        await this.helper.propose();
        await this.helper.waitForDeadline();
        await expectRevert(
          this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
          'Governor: vote not currently active',
        );
      });
    });

    describe('on execute', function () {
      it('if proposal does not exist', async function () {
        await expectRevert(this.helper.execute(), 'Governor: unknown proposal id');
      });

      it('if quorum is not reached', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter3 });
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
      });

      it('if score not reached', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter1 });
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
      });

      it('if voting is not over', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
      });

      it('if receiver revert without reason', async function () {
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.address,
              data: this.receiver.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
            },
          ],
          '<proposal description>',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await expectRevert(this.helper.execute(), 'Governor: call reverted without message');
      });

      it('if receiver revert with reason', async function () {
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.address,
              data: this.receiver.contract.methods.mockFunctionRevertsReason().encodeABI(),
            },
          ],
          '<proposal description>',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await expectRevert(this.helper.execute(), 'CallReceiverMock: reverting');
      });

      it('if proposal was already executed', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await this.helper.waitForDeadline();
        await this.helper.execute();
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
      });
    });
  });

  describe('state', function () {
    it('Unset', async function () {
      await expectRevert(this.mock.state(this.proposal.id), 'Governor: unknown proposal id');
    });

    it('Pending & Active', async function () {
      await this.helper.propose();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
      await this.helper.waitForSnapshot();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
      await this.helper.waitForSnapshot(+1);
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
    });

    it('Defeated', async function () {
      await this.helper.propose();
      await this.helper.waitForDeadline();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
      await this.helper.waitForDeadline(+1);
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Defeated);
    });

    it('Succeeded', async function () {
      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
      await this.helper.waitForDeadline(+1);
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
    });

    it('Executed', async function () {
      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();
      await this.helper.execute();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
    });
  });

  describe('cancel', function () {
    it('before proposal', async function () {
      await expectRevert(this.helper.cancel(), 'Governor: unknown proposal id');
    });

    it('after proposal', async function () {
      await this.helper.propose();

      await this.helper.cancel();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

      await this.helper.waitForSnapshot();
      await expectRevert(
        this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
        'Governor: vote not currently active',
      );
    });

    it('after vote', async function () {
      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });

      await this.helper.cancel();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

      await this.helper.waitForDeadline();
      await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
    });

    it('after deadline', async function () {
      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();

      await this.helper.cancel();
      expect(await this.mock.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

      await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
    });

    it('after execution', async function () {
      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();
      await this.helper.execute();

      await expectRevert(this.helper.cancel(), 'Governor: proposal not active');
    });
  });

  describe('proposal length', function () {
    it('empty', async function () {
      this.helper.setProposal([], '<proposal description>');
      await expectRevert(this.helper.propose(), 'Governor: empty proposal');
    });

    it('mismatch #1', async function () {
      this.helper.setProposal(
        {
          targets: [],
          values: [web3.utils.toWei('0')],
          data: [this.receiver.contract.methods.mockFunction().encodeABI()],
        },
        '<proposal description>',
      );
      await expectRevert(this.helper.propose(), 'Governor: invalid proposal length');
    });

    it('mismatch #2', async function () {
      this.helper.setProposal(
        {
          targets: [this.receiver.address],
          values: [],
          data: [this.receiver.contract.methods.mockFunction().encodeABI()],
        },
        '<proposal description>',
      );
      await expectRevert(this.helper.propose(), 'Governor: invalid proposal length');
    });

    it('mismatch #3', async function () {
      this.helper.setProposal(
        {
          targets: [this.receiver.address],
          values: [web3.utils.toWei('0')],
          data: [],
        },
        '<proposal description>',
      );
      await expectRevert(this.helper.propose(), 'Governor: invalid proposal length');
    });
  });

  describe('onlyGovernance updates', function () {
    it('setVotingDelay is protected', async function () {
      await expectRevert(this.mock.setVotingDelay('0'), 'Governor: onlyGovernance');
    });

    it('setVotingPeriod is protected', async function () {
      await expectRevert(this.mock.setVotingPeriod('32'), 'Governor: onlyGovernance');
    });

    it('setProposalThreshold is protected', async function () {
      await expectRevert(this.mock.setProposalThreshold('1000000000000000000'), 'Governor: onlyGovernance');
    });

    it('can setVotingDelay through governance', async function () {
      this.helper.setProposal(
        [
          {
            target: this.mock.address,
            data: this.mock.contract.methods.setVotingDelay('0').encodeABI(),
          },
        ],
        '<proposal description>',
      );

      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();

      expectEvent(await this.helper.execute(), 'VotingDelaySet', { oldVotingDelay: '4', newVotingDelay: '0' });

      expect(await this.mock.votingDelay()).to.be.bignumber.equal('0');
    });

    it('can setVotingPeriod through governance', async function () {
      this.helper.setProposal(
        [
          {
            target: this.mock.address,
            data: this.mock.contract.methods.setVotingPeriod('32').encodeABI(),
          },
        ],
        '<proposal description>',
      );

      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();

      expectEvent(await this.helper.execute(), 'VotingPeriodSet', { oldVotingPeriod: '16', newVotingPeriod: '32' });

      expect(await this.mock.votingPeriod()).to.be.bignumber.equal('32');
    });

    it('cannot setVotingPeriod to 0 through governance', async function () {
      this.helper.setProposal(
        [
          {
            target: this.mock.address,
            data: this.mock.contract.methods.setVotingPeriod('0').encodeABI(),
          },
        ],
        '<proposal description>',
      );

      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();

      await expectRevert(this.helper.execute(), 'GovernorSettings: voting period too low');
    });

    it('can setProposalThreshold to 0 through governance', async function () {
      this.helper.setProposal(
        [
          {
            target: this.mock.address,
            data: this.mock.contract.methods.setProposalThreshold('1000000000000000000').encodeABI(),
          },
        ],
        '<proposal description>',
      );

      await this.helper.propose();
      await this.helper.waitForSnapshot();
      await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await this.helper.waitForDeadline();

      expectEvent(await this.helper.execute(), 'ProposalThresholdSet', {
        oldProposalThreshold: '0',
        newProposalThreshold: '1000000000000000000',
      });

      expect(await this.mock.proposalThreshold()).to.be.bignumber.equal('1000000000000000000');
    });
  });

  describe('safe receive', function () {
    describe('ERC721', function () {
      const name = 'Non Fungible Token';
      const symbol = 'NFT';
      const tokenId = new BN(1);

      beforeEach(async function () {
        this.token = await ERC721.new(name, symbol);
        await this.token.$_mint(owner, tokenId);
      });

      it('can receive an ERC721 safeTransfer', async function () {
        await this.token.safeTransferFrom(owner, this.mock.address, tokenId, { from: owner });
      });
    });

    describe('ERC1155', function () {
      const uri = 'https://token-cdn-domain/{id}.json';
      const tokenIds = {
        1: new BN(1000),
        2: new BN(2000),
        3: new BN(3000),
      };

      beforeEach(async function () {
        this.token = await ERC1155.new(uri);
        await this.token.$_mintBatch(owner, Object.keys(tokenIds), Object.values(tokenIds), '0x');
      });

      it('can receive ERC1155 safeTransfer', async function () {
        await this.token.safeTransferFrom(
          owner,
          this.mock.address,
          ...Object.entries(tokenIds)[0], // id + amount
          '0x',
          { from: owner },
        );
      });

      it('can receive ERC1155 safeBatchTransfer', async function () {
        await this.token.safeBatchTransferFrom(
          owner,
          this.mock.address,
          Object.keys(tokenIds),
          Object.values(tokenIds),
          '0x',
          { from: owner },
        );
      });
    });
  });
});
