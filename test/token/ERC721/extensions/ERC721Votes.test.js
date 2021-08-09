/* eslint-disable */
const { expect } = require('chai');

const ERC721VotesMock = artifacts.require('ERC721VotesMock');

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;
const { promisify } = require('util');
const queue = promisify(setImmediate);


const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

contract('ERC721Votes', function (accounts) {
  const [ holder, recipient, holderDelegatee, recipientDelegatee, other1, other2 ] = accounts;

  const name = 'UNIQUE TOKEN';
  const symbol = 'UTKN';
  const version = '1';
  const supply = new BN('1');

  beforeEach(async function () {
    this.token = await ERC721VotesMock.new(name, symbol);
    this.chainId = await this.token.getChainId();
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(holder)).to.be.bignumber.equal('0');
  });
});

  describe('set delegation', function () {
    describe('call', function () {
      it('delegation with balance', async function () {
        await this.token.mint(holder, supply);
        expect(await this.token.delegates(holder)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(holder, { from: holder });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: holder,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: holder,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: holder,
          previousBalance: '0',
          newBalance: supply,
        });

        expect(await this.token.delegates(holder)).to.be.equal(holder);
        expect(await this.token.getUserVotes(holder)).to.be.equal(supply);
        expect(await this.token.getVotingWeight(holder, receipt.blockNumber - 1)).to.be.equal('0');
        await time.advanceBlock();
        expect(await this.token.getVotingWeight(holder, receipt.blockNumber)).to.be.equal(supply);
       });
     });
   });

  describe('change delegation', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
      await this.token.delegate(holder, { from: holder });
    });

    it('call', async function () {
      expect(await this.token.delegates(holder)).to.be.equal(holder);

      const { receipt } = await this.token.delegate(holderDelegatee, { from: holder });

      expectEvent(receipt, 'DelegateChanged', {
        delegator: holder,
        fromDelegate: holder,
        toDelegate: holderDelegatee,
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: holder,
        previousBalance: supply,
        newBalance: '0',
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: holderDelegatee,
        previousBalance: '0',
        newBalance: supply,
      });

      expect(await this.token.delegates(holder)).to.be.equal(holderDelegatee);
      expect(await this.token.getUserVotes(holder)).to.be.equal('0');
      expect(await this.token.getUserVotes(holderDelegatee)).to.be.equal(supply);
      expect(await this.token.getVotingWeight(holder, receipt.blockNumber - 1)).to.be.equal(supply);
      expect(await this.token.getVotingWeight(holderDelegatee, receipt.blockNumber - 1)).to.be.equal('0');
      await time.advanceBlock();
      expect(await this.token.getVotingWeight(holder, receipt.blockNumber)).to.be.equal('0');
      expect(await this.token.getVotingWeight(holderDelegatee, receipt.blockNumber)).to.be.equal(supply);
    });
  });

  describe('transfers tokens', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
    });

    it('no delegation', async function () {
      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    afterEach(async function () {
      expect(await this.token.getUserVotes(holder)).to.be.equal(this.holderVotes);
      expect(await this.token.getUserVotes(recipient)).to.be.equal(this.recipientVotes);

      const blockNumber = await time.latestBlock();
      await time.advanceBlock();
      expect(await this.token.getVotingWeight(holder, blockNumber)).to.be.equal(this.holderVotes);
      expect(await this.token.getVotingWeight(recipient, blockNumber)).to.be.equal(this.recipientVotes);
    });
  });

  // The following tests are a adaptation of https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
  describe('Compound test suite', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
    });

    describe('getPastVotes', function () {
      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.token.getVotingWeight(other1, 5e10),
          'ERC721Votes: block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.token.getVotingWeight(other1, 0)).to.be.equal('0');
      });

      it('returns the latest block if >= last checkpoint block', async function () {
        const t1 = await this.token.getVotingWeight(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getVotingWeight(other1, t1.receipt.blockNumber)).to.be.equal('1');
        expect(await this.token.getVotingWeight(other1, t1.receipt.blockNumber + 1)).to.be.equal('1');
      });
    });

  describe('getPastTotalSupply', function () {
    beforeEach(async function () {
      await this.token.delegate(holder, { from: holder });
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.token.getPastTotalSupply(5e10),
        'ERC721Votes: block not yet mined',
      );
    });

    it('returns 0 if there are no checkpoints', async function () {
      expect(await this.token.getPastTotalSupply(0)).to.be.bignumber.equal('0');
    });

    it('returns the latest block if >= last checkpoint block', async function () {
      t1 = await this.token.mint(holder, supply);

      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });
   });
  });
