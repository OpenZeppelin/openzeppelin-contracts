/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC20CompMock = artifacts.require('ERC20CompMock');

const { EIP712Domain, domainSeparator } = require('../../../helpers/eip712');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

contract('ERC20Comp', function (accounts) {
  const [ holder, recipient, holderDelegatee, recipientDelegatee ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';

  const supply = new BN(100);

  beforeEach(async function () {
    this.token = await ERC20CompMock.new(name, symbol, holder, supply);

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

  describe('delegate', function () {
    it('check voting', async function () {
      const blockNumber = await web3.eth.getBlockNumber();

      expect(await this.token.getCurrentVotes(holder)).to.be.bignumber.equal(supply);
      expect(await this.token.getPriorVotes(holder, blockNumber - 1)).to.be.bignumber.equal('0');
      await expectRevert(this.token.getPriorVotes(holder, blockNumber), 'ERC20Comp::getPriorVotes: not yet determined');

      await time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, blockNumber)).to.be.bignumber.equal('0');

      await time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('delegation with balance', async function () {
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

      expect(await this.token.getCurrentVotes(holder)).to.be.bignumber.equal('0');
      expect(await this.token.getCurrentVotes(holderDelegatee)).to.be.bignumber.equal(supply);

      await time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPriorVotes(holderDelegatee, receipt.blockNumber)).to.be.bignumber.equal('0');

      await time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, receipt.blockNumber + 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPriorVotes(holderDelegatee, receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('delegation without balance', async function () {
      const { receipt } = await this.token.delegate(recipientDelegatee, { from: recipient });
      expectEvent(receipt, 'DelegateChanged', {
        delegator: recipient,
        fromDelegate: recipient,
        toDelegate: recipientDelegatee,
      });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');
    });
  });

  describe('delegateFromBySig', function () {
    const delegator = Wallet.generate();
    const delegatorAddress = web3.utils.toChecksumAddress(delegator.getAddressString());
    const nonce = 0;
    const maxExpiry = MAX_UINT256;

    const buildData = (chainId, verifyingContract, message) => ({ data: {
      primaryType: 'Delegation',
      types: { EIP712Domain, Delegation },
      domain: { name, version, chainId, verifyingContract },
      message,
    }});

    it('accept signed delegation', async function () {
      const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
        delegator.getPrivateKey(),
        buildData(this.chainId, this.token.address, {
          delegatee: holderDelegatee,
          nonce,
          expiry: maxExpiry,
        }),
      ));

      await this.token.transfer(delegatorAddress, supply, { from: holder });
      const { receipt } = await this.token.delegateFromBySig(holderDelegatee, nonce, maxExpiry, v, r, s);
      expectEvent(receipt, 'DelegateChanged', {
        delegator: delegatorAddress,
        fromDelegate: delegatorAddress,
        toDelegate: holderDelegatee,
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: delegatorAddress,
        previousBalance: supply,
        newBalance: '0',
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: holderDelegatee,
        previousBalance: '0',
        newBalance: supply,
      });

      expect(await this.token.getCurrentVotes(delegatorAddress)).to.be.bignumber.equal('0');
      expect(await this.token.getCurrentVotes(holderDelegatee)).to.be.bignumber.equal(supply);

      await time.advanceBlock();
      expect(await this.token.getPriorVotes(delegatorAddress, receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPriorVotes(holderDelegatee, receipt.blockNumber)).to.be.bignumber.equal('0');

      await time.advanceBlock();
      expect(await this.token.getPriorVotes(delegatorAddress, receipt.blockNumber + 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPriorVotes(holderDelegatee, receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('rejects reused signature', async function () {
      const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
        delegator.getPrivateKey(),
        buildData(this.chainId, this.token.address, {
          delegatee: holderDelegatee,
          nonce,
          expiry: maxExpiry,
        }),
      ));

      await this.token.delegateFromBySig(holderDelegatee, nonce, maxExpiry, v, r, s);

      await expectRevert(
        this.token.delegateFromBySig(holderDelegatee, nonce, maxExpiry, v, r, s),
        'ERC20Comp::delegateBySig: invalid nonce',
      );
    });

    it('rejects expired permit', async function () {
      const expiry = (await time.latest()) - time.duration.weeks(1);
      const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
        delegator.getPrivateKey(),
        buildData(this.chainId, this.token.address, {
          delegatee: holderDelegatee,
          nonce,
          expiry,
        }),
      ));

      await expectRevert(
        this.token.delegateFromBySig(holderDelegatee, nonce, expiry, v, r, s),
        'ERC20Comp::delegateBySig: signature expired',
      );
    });
  });

  describe('transfers', function () {
    beforeEach(async function () {
      this.fromDelegatee = holder;
      this.toDelegatee = recipient;
    });

    it('no delegation', async function () {
    });

    it('sender has delegatee', async function () {
      this.fromDelegatee = holderDelegatee;
      await this.token.delegate(holderDelegatee, { from: holder });
    });

    it('recipient has delegatee', async function () {
      this.toDelegatee = recipientDelegatee;
      await this.token.delegate(recipientDelegatee, { from: recipient });
    });

    it('sender and recipient have delegatee', async function () {
      this.fromDelegatee = holderDelegatee;
      this.toDelegatee = recipientDelegatee;
      await this.token.delegate(holderDelegatee, { from: holder });
      await this.token.delegate(recipientDelegatee, { from: recipient });
    });

    afterEach(async function () {
      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: this.fromDelegatee, previousBalance: supply, newBalance: supply.subn(1) });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: this.toDelegatee, previousBalance: '0', newBalance: '1' });

      expect(await this.token.getCurrentVotes(this.fromDelegatee)).to.be.bignumber.equal(supply.subn(1));
      expect(await this.token.getCurrentVotes(this.toDelegatee)).to.be.bignumber.equal('1');

      // need to advance 2 blocks to see the effect of a transfer on "getPriorVotes"
      time.advanceBlock();
      const blockNumber = await web3.eth.getBlockNumber();
      time.advanceBlock();
      expect(await this.token.getPriorVotes(this.fromDelegatee, blockNumber)).to.be.bignumber.equal(supply.subn(1));
      expect(await this.token.getPriorVotes(this.toDelegatee, blockNumber)).to.be.bignumber.equal('1');
    });
  });
});
