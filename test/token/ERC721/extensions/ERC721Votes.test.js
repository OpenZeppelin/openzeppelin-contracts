/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { promisify } = require('util');
const queue = promisify(setImmediate);

const ERC721VotesMock = artifacts.require('ERC721VotesMock');

const { EIP712Domain, domainSeparator } = require('../../../helpers/eip712');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

async function countPendingTransactions() {
  return parseInt(
    await network.provider.send('eth_getBlockTransactionCountByNumber', ['pending'])
  );
}

async function batchInBlock (txs) {
  try {
    // disable auto-mining
    await network.provider.send('evm_setAutomine', [false]);
    // send all transactions
    const promises = txs.map(fn => fn());
    // wait for node to have all pending transactions
    while (txs.length > await countPendingTransactions()) {
      await queue();
    }
    // mine one block
    await network.provider.send('evm_mine');
    // fetch receipts
    const receipts = await Promise.all(promises);
    // Sanity check, all tx should be in the same block
    const minedBlocks = new Set(receipts.map(({ receipt }) => receipt.blockNumber));
    expect(minedBlocks.size).to.equal(1);

    return receipts;
  } finally {
    // enable auto-mining
    await network.provider.send('evm_setAutomine', [true]);
  }
}

contract('ERC721Votes', function (accounts) {
  const [ holder, recipient, holderDelegatee, recipientDelegatee, other1, other2 ] = accounts;
  const NFT0 = new BN('10000000000000000000000000');
  const NFT1 = new BN('10');
  const NFT2 = new BN('20');
  const NFT3 = new BN('30');
  const NFT4 = new BN('40');
  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';

  beforeEach(async function () {
    this.token = await ERC721VotesMock.new(name, symbol);

    // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
    // from within the EVM as from the JSON RPC interface.
    // See https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await this.token.getChainId();
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(holder)).to.be.bignumber.equal('0');
  });

  it('domain separator', async function () {
    expect(
      await this.token.DOMAIN_SEPARATOR(),
    ).to.equal(
      await domainSeparator(name, version, this.chainId, this.token.address),
    );
  });

  describe('set delegation', function () {
    describe('call', function () {
      it('delegation with tokens', async function () {
        await this.token.mint(holder, NFT0);
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
          newBalance: '1',
        });

        expect(await this.token.delegates(holder)).to.be.equal(holder);

        expect(await this.token.getVotes(holder)).to.be.bignumber.equal('1');
        expect(await this.token.getPastVotes(holder, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.getPastVotes(holder, receipt.blockNumber)).to.be.bignumber.equal('1');
      });

      it('delegation without tokens', async function () {
        expect(await this.token.delegates(holder)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(holder, { from: holder });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: holder,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: holder,
        });
        expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

        expect(await this.token.delegates(holder)).to.be.equal(holder);
      });
    });

    describe('with signature', function () {
      const delegator = Wallet.generate();
      const delegatorAddress = web3.utils.toChecksumAddress(delegator.getAddressString());
      const nonce = 0;

      const buildData = (chainId, verifyingContract, message) => ({ data: {
        primaryType: 'Delegation',
        types: { EIP712Domain, Delegation },
        domain: { name, version, chainId, verifyingContract },
        message,
      }});

      beforeEach(async function () {
        await this.token.mint(delegatorAddress, NFT0);
      });

      it('accept signed delegation', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        expect(await this.token.delegates(delegatorAddress)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);
        expectEvent(receipt, 'DelegateChanged', {
          delegator: delegatorAddress,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: delegatorAddress,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: delegatorAddress,
          previousBalance: '0',
          newBalance: '1',
        });

        expect(await this.token.delegates(delegatorAddress)).to.be.equal(delegatorAddress);

        expect(await this.token.getVotes(delegatorAddress)).to.be.bignumber.equal('1');
        expect(await this.token.getPastVotes(delegatorAddress, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.getPastVotes(delegatorAddress, receipt.blockNumber)).to.be.bignumber.equal('1');
      });

      it('rejects reused signature', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await this.token.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.token.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'ERC721Votes: invalid nonce',
        );
      });

      it('rejects bad delegatee', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        const { logs } = await this.token.delegateBySig(holderDelegatee, nonce, MAX_UINT256, v, r, s);
        const { args } = logs.find(({ event }) => event == 'DelegateChanged');
        expect(args.delegator).to.not.be.equal(delegatorAddress);
        expect(args.fromDelegate).to.be.equal(ZERO_ADDRESS);
        expect(args.toDelegate).to.be.equal(holderDelegatee);
      });

      it('rejects bad nonce', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));
        await expectRevert(
          this.token.delegateBySig(delegatorAddress, nonce + 1, MAX_UINT256, v, r, s),
          'ERC721Votes: invalid nonce',
        );
      });

      it('rejects expired permit', async function () {
        const expiry = (await time.latest()) - time.duration.weeks(1);
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegatee: delegatorAddress,
            nonce,
            expiry,
          }),
        ));

        await expectRevert(
          this.token.delegateBySig(delegatorAddress, nonce, expiry, v, r, s),
          'ERC721Votes: signature expired',
        );
      });
    });
  });

  describe('change delegation', function () {
    beforeEach(async function () {
      await this.token.mint(holder, NFT0);
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
        previousBalance: '1',
        newBalance: '0',
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: holderDelegatee,
        previousBalance: '0',
        newBalance: '1',
      });

      expect(await this.token.delegates(holder)).to.be.equal(holderDelegatee);

      expect(await this.token.getVotes(holder)).to.be.bignumber.equal('0');
      expect(await this.token.getVotes(holderDelegatee)).to.be.bignumber.equal('1');
      expect(await this.token.getPastVotes(holder, receipt.blockNumber - 1)).to.be.bignumber.equal('1');
      expect(await this.token.getPastVotes(holderDelegatee, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      await time.advanceBlock();
      expect(await this.token.getPastVotes(holder, receipt.blockNumber)).to.be.bignumber.equal('0');
      expect(await this.token.getPastVotes(holderDelegatee, receipt.blockNumber)).to.be.bignumber.equal('1');
    });
  });

  describe('transfers', function () {
    beforeEach(async function () {
      await this.token.mint(holder, NFT0);
    });

    it('no delegation', async function () {
      const { receipt } = await this.token.transferFrom(holder, recipient, NFT0, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, tokenId: NFT0 });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    it('sender delegation', async function () {
      await this.token.delegate(holder, { from: holder });

      const { receipt } = await this.token.transferFrom(holder, recipient, NFT0, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, tokenId: NFT0 });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: '1', newBalance: '0' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    it('receiver delegation', async function () {
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transferFrom(holder, recipient, NFT0, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, tokenId: NFT0 });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = '0';
      this.recipientVotes = '1';
    });

    it('full delegation', async function () {
      await this.token.delegate(holder, { from: holder });
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transferFrom(holder, recipient, NFT0, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, tokenId: NFT0 });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: '1', newBalance: '0'});
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = '0';
      this.recipientVotes = '1';
    });

    afterEach(async function () {
      expect(await this.token.getVotes(holder)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getVotes(recipient)).to.be.bignumber.equal(this.recipientVotes);

      // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
      const blockNumber = await time.latestBlock();
      await time.advanceBlock();
      expect(await this.token.getPastVotes(holder, blockNumber)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getPastVotes(recipient, blockNumber)).to.be.bignumber.equal(this.recipientVotes);
    });
  });

  // The following tests are a adaptation of https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
  describe('Compound test suite', function () {
    beforeEach(async function () {
      await this.token.mint(holder, NFT0);
      await this.token.mint(holder, NFT1);
      await this.token.mint(holder, NFT2);
      await this.token.mint(holder, NFT3);
    });

    describe('balanceOf', function () {
      it('grants to initial account', async function () {
        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('4');
      });
    });

    describe('getPastVotes', function () {
      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.token.getPastVotes(other1, 5e10),
          'block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.token.getPastVotes(other1, 0)).to.be.bignumber.equal('0');
      });

      it('returns the latest block if >= last checkpoint block', async function () {
        const t1 = await this.token.delegate(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber)).to.be.bignumber.equal('4');
        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal('4');
      });

      it('returns zero if < first checkpoint block', async function () {
        await time.advanceBlock();
        const t1 = await this.token.delegate(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal('4');
      });

      it('generally returns the voting balance at the appropriate checkpoint', async function () {
        const total = await this.token.balanceOf(holder);

        const t1 = await this.token.delegate(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t2 = await this.token.transferFrom(holder, other2, NFT1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t3 = await this.token.transferFrom(holder, other2, NFT2, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t4 = await this.token.transferFrom(other2, holder, NFT2, { from: other2 });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber)).to.be.bignumber.equal(total);
        expect(await this.token.getPastVotes(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(total);
        expect(await this.token.getPastVotes(other1, t2.receipt.blockNumber)).to.be.bignumber.equal('3');
        expect(await this.token.getPastVotes(other1, t2.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
        expect(await this.token.getPastVotes(other1, t3.receipt.blockNumber)).to.be.bignumber.equal('2');
        expect(await this.token.getPastVotes(other1, t3.receipt.blockNumber + 1)).to.be.bignumber.equal('2');
        expect(await this.token.getPastVotes(other1, t4.receipt.blockNumber)).to.be.bignumber.equal('3');
        expect(await this.token.getPastVotes(other1, t4.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
      });
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
      t1 = await this.token.mint(holder, NFT0);

      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber)).to.be.bignumber.equal('1');
      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
    });

    it('returns zero if < first checkpoint block', async function () {
      await time.advanceBlock();
      const t1 = await this.token.mint(holder, NFT0);
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
    });

    it('generally returns the voting balance at the appropriate checkpoint', async function () {
      const t1 = await this.token.mint(holder, NFT1);
      await time.advanceBlock();
      await time.advanceBlock();
      const t2 = await this.token.burn(NFT1);
      await time.advanceBlock();
      await time.advanceBlock();
      const t3 = await this.token.mint(holder, NFT2);
      await time.advanceBlock();
      await time.advanceBlock();
      const t4 = await this.token.burn(NFT2);
      await time.advanceBlock();
      await time.advanceBlock();
      const t5 = await this.token.mint(holder, NFT3);
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber)).to.be.bignumber.equal('1');
      expect(await this.token.getPastTotalSupply(t1.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
      expect(await this.token.getPastTotalSupply(t2.receipt.blockNumber)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(t2.receipt.blockNumber + 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(t3.receipt.blockNumber)).to.be.bignumber.equal('1');
      expect(await this.token.getPastTotalSupply(t3.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
      expect(await this.token.getPastTotalSupply(t4.receipt.blockNumber)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(t4.receipt.blockNumber + 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(t5.receipt.blockNumber)).to.be.bignumber.equal('1');
      expect(await this.token.getPastTotalSupply(t5.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
    });
  });
});
