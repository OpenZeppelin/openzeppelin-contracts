/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC20VotesMock = artifacts.require('ERC20VotesMock');

const { EIP712Domain, domainSeparator } = require('../../../helpers/eip712');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

contract('ERC20Votes', function (accounts) {
  const [ holder, recipient, holderDelegatee, recipientDelegatee ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';

  const supply = new BN(100);

  beforeEach(async function () {
    this.token = await ERC20VotesMock.new(name, symbol, holder, supply);

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
      it('delegation with balance', async function () {
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

        expect(await this.token.getCurrentVotes(holder)).to.be.bignumber.equal(supply);
        await time.advanceBlock();
        expect(await this.token.getPriorVotes(holder, receipt.blockNumber)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.getPriorVotes(holder, receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });

      it('delegation without balance', async function () {
        expect(await this.token.delegates(recipient)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(recipient, { from: recipient });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: recipient,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: recipient,
        });
        expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

        expect(await this.token.delegates(recipient)).to.be.equal(recipient);
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
        await this.token.transfer(delegatorAddress, supply, { from: holder });
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

        const { receipt } = await this.token.delegateFromBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);
        expectEvent(receipt, 'DelegateChanged', {
          delegator: delegatorAddress,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: delegatorAddress,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: delegatorAddress,
          previousBalance: '0',
          newBalance: supply,
        });

        expect(await this.token.delegates(delegatorAddress)).to.be.equal(delegatorAddress);

        expect(await this.token.getCurrentVotes(delegatorAddress)).to.be.bignumber.equal(supply);
        await time.advanceBlock();
        expect(await this.token.getPriorVotes(delegatorAddress, receipt.blockNumber)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.getPriorVotes(delegatorAddress, receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
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

        await this.token.delegateFromBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.token.delegateFromBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'ERC20Votes::delegateBySig: invalid nonce',
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

        const { logs } = await this.token.delegateFromBySig(holderDelegatee, nonce, MAX_UINT256, v, r, s);
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
          this.token.delegateFromBySig(delegatorAddress, nonce + 1, MAX_UINT256, v, r, s),
          'ERC20Votes::delegateBySig: invalid nonce',
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
          this.token.delegateFromBySig(delegatorAddress, nonce, expiry, v, r, s),
          'ERC20Votes::delegateBySig: signature expired',
        );
      });
    });
  });

  describe('change delegation', function () {
    beforeEach(async function () {
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

      expect(await this.token.getCurrentVotes(holder)).to.be.bignumber.equal('0');
      expect(await this.token.getCurrentVotes(holderDelegatee)).to.be.bignumber.equal(supply);
      await time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPriorVotes(holderDelegatee, receipt.blockNumber)).to.be.bignumber.equal('0');
      await time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, receipt.blockNumber + 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPriorVotes(holderDelegatee, receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });
  });

  describe('transfers', function () {
    it('no delegation', async function () {
      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    it('sender delegation', async function () {
      await this.token.delegate(holder, { from: holder });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: supply, newBalance: supply.subn(1) });

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '0';
    });

    it('receiver delegation', async function () {
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      this.holderVotes = '0';
      this.recipientVotes = '1';
    });

    it('full delegation', async function () {
      await this.token.delegate(holder, { from: holder });
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: supply, newBalance: supply.subn(1) });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '1';
    });

    afterEach(async function () {
      expect(await this.token.getCurrentVotes(holder)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getCurrentVotes(recipient)).to.be.bignumber.equal(this.recipientVotes);

      // need to advance 2 blocks to see the effect of a transfer on "getPriorVotes"
      time.advanceBlock();
      const blockNumber = await web3.eth.getBlockNumber();
      time.advanceBlock();
      expect(await this.token.getPriorVotes(holder, blockNumber)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getPriorVotes(recipient, blockNumber)).to.be.bignumber.equal(this.recipientVotes);
    });
  });
});
