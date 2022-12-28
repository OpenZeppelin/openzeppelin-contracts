/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { shouldBehaveLikeVotesMulti } = require('../../../governance/utils/VotesMulti.behavior');
const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC1155VotesMock = artifacts.require('ERC1155VotesMock');

const { batchInBlock } = require('../../../helpers/txpool');
const { EIP712Domain, domainSeparator } = require('../../../helpers/eip712');

const Delegation = [
  { name: 'id', type: 'uint256' },
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

contract('ERC1155Votes', function (accounts) {
  const [ holder, recipient, holderDelegatee, other1, other2 ] = accounts;

  const initialURI = 'https://token-cdn-domain/{id}.json';
  const name = 'My Token';
  const version = '1';

  const tokenId = new BN(1990);
  const supply = new BN(9001);

  const data = '0x12345678';

  beforeEach(async function () {
    this.token = await ERC1155VotesMock.new(initialURI, name);

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

  it('minting restriction', async function () {
    const amount = new BN('2').pow(new BN('224'));
    await expectRevert(
      this.token.mint(holder, tokenId, amount, data),
      "SafeCast: value doesn't fit in 224 bits",
    );
    await expectRevert(
      this.token.mintBatch(holder, [tokenId], [amount], data),
      "SafeCast: value doesn't fit in 224 bits",
    );
  });

  it('recent checkpoints', async function () {
    await this.token.delegate(tokenId, holder, { from: holder });
    for (let i = 0; i < 6; i++) {
      // test mintBatch
      await this.token.mintBatch(holder, [tokenId], [1], data);
    }
    const block = await web3.eth.getBlockNumber();
    // recent
    expect(await this.token.getPastVotes(holder, tokenId, block - 1)).to.be.bignumber.equal('5');
    // non-recent
    expect(await this.token.getPastVotes(holder, tokenId, block - 6)).to.be.bignumber.equal('0');
  });

  describe('set delegation', function () {
    describe('call', function () {
      it('delegation with balance', async function () {
        await this.token.mint(holder, tokenId, supply, data);
        expect(await this.token.delegates(holder, tokenId)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(tokenId, holder, { from: holder });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: holder,
          id: tokenId,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: holder,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: holder,
          id: tokenId,
          previousBalance: '0',
          newBalance: supply,
        });

        expect(await this.token.delegates(holder, tokenId)).to.be.equal(holder);

        expect(await this.token.getVotes(holder, tokenId)).to.be.bignumber.equal(supply);
        expect(await this.token.getPastVotes(holder, tokenId, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.getPastVotes(holder, tokenId, receipt.blockNumber)).to.be.bignumber.equal(supply);
      });

      it('delegation without balance', async function () {
        expect(await this.token.delegates(holder, tokenId)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(tokenId, holder, { from: holder });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: holder,
          id: tokenId,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: holder,
        });
        expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

        expect(await this.token.delegates(holder, tokenId)).to.be.equal(holder);
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
        await this.token.mint(delegatorAddress, tokenId, supply, data);
      });

      it('accept signed delegation', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            id: tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        expect(await this.token.delegates(delegatorAddress, tokenId)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegateBySig(tokenId, delegatorAddress, nonce, MAX_UINT256, v, r, s);
        expectEvent(receipt, 'DelegateChanged', {
          delegator: delegatorAddress,
          id: tokenId,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: delegatorAddress,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: delegatorAddress,
          id: tokenId,
          previousBalance: '0',
          newBalance: supply,
        });

        expect(await this.token.delegates(delegatorAddress, tokenId)).to.be.equal(delegatorAddress);

        expect(await this.token.getVotes(delegatorAddress, tokenId)).to.be.bignumber.equal(supply);
        expect(await this.token.getPastVotes(delegatorAddress, tokenId, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.getPastVotes(delegatorAddress, tokenId, receipt.blockNumber)).to.be.bignumber.equal(supply);
      });

      it('rejects reused signature', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            id: tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await this.token.delegateBySig(tokenId, delegatorAddress, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.token.delegateBySig(tokenId, delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects bad delegatee', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            id: tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        const receipt = await this.token.delegateBySig(tokenId, holderDelegatee, nonce, MAX_UINT256, v, r, s);
        const { args } = receipt.logs.find(({ event }) => event == 'DelegateChanged');
        expect(args.delegator).to.not.be.equal(delegatorAddress);
        expect(args.fromDelegate).to.be.equal(ZERO_ADDRESS);
        expect(args.toDelegate).to.be.equal(holderDelegatee);
      });

      it('rejects bad nonce', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            id: tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));
        await expectRevert(
          this.token.delegateBySig(tokenId, delegatorAddress, nonce + 1, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects expired permit', async function () {
        const expiry = (await time.latest()) - time.duration.weeks(1);
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            id: tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry,
          }),
        ));

        await expectRevert(
          this.token.delegateBySig(tokenId, delegatorAddress, nonce, expiry, v, r, s),
          'Votes: signature expired',
        );
      });
    });
  });

  describe('change delegation', function () {
    beforeEach(async function () {
      await this.token.mint(holder, tokenId, supply, data);
      await this.token.delegate(tokenId, holder, { from: holder });
    });

    it('call', async function () {
      expect(await this.token.delegates(holder, tokenId)).to.be.equal(holder);

      const { receipt } = await this.token.delegate(tokenId, holderDelegatee, { from: holder });
      expectEvent(receipt, 'DelegateChanged', {
        delegator: holder,
        id: tokenId,
        fromDelegate: holder,
        toDelegate: holderDelegatee,
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: holder,
        id: tokenId,
        previousBalance: supply,
        newBalance: '0',
      });
      expectEvent(receipt, 'DelegateVotesChanged', {
        delegate: holderDelegatee,
        id: tokenId,
        previousBalance: '0',
        newBalance: supply,
      });

      expect(await this.token.delegates(holder, tokenId)).to.be.equal(holderDelegatee);

      expect(await this.token.getVotes(holder, tokenId)).to.be.bignumber.equal('0');
      expect(await this.token.getVotes(holderDelegatee, tokenId)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastVotes(holder, tokenId, receipt.blockNumber - 1)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastVotes(holderDelegatee, tokenId, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      await time.advanceBlock();
      expect(await this.token.getPastVotes(holder, tokenId, receipt.blockNumber)).to.be.bignumber.equal('0');
      expect(await this.token.getPastVotes(holderDelegatee, tokenId, receipt.blockNumber)).to.be.bignumber.equal(supply);
    });
  });

  describe('transfers', function () {
    beforeEach(async function () {
      await this.token.mint(holder, tokenId, supply, data);
    });

    it('no delegation', async function () {
      const { receipt } = await this.token.safeTransferFrom(holder, recipient, tokenId, 1, data, { from: holder });
      expectEvent(receipt, 'TransferSingle', {
        operator: holder,
        from: holder,
        to: recipient,
        id: tokenId,
        value: '1',
      });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    it('sender delegation', async function () {
      await this.token.delegate(tokenId, holder, { from: holder });

      const { receipt } = await this.token.safeTransferFrom(holder, recipient, tokenId, 1, data, { from: holder });
      expectEvent(receipt, 'TransferSingle', {
        operator: holder,
        from: holder,
        to: recipient,
        id: tokenId,
        value: '1',
      });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, id: tokenId, previousBalance: supply, newBalance: supply.subn(1) });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'TransferSingle');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '0';
    });

    it('receiver delegation', async function () {
      await this.token.delegate(tokenId, recipient, { from: recipient });

      const { receipt } = await this.token.safeTransferFrom(holder, recipient, tokenId, 1, data, { from: holder });
      expectEvent(receipt, 'TransferSingle', {
        operator: holder,
        from: holder,
        to: recipient,
        id: tokenId,
        value: '1',
      });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'TransferSingle');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = '0';
      this.recipientVotes = '1';
    });

    it('full delegation', async function () {
      await this.token.delegate(tokenId, holder, { from: holder });
      await this.token.delegate(tokenId, recipient, { from: recipient });

      const { receipt } = await this.token.safeTransferFrom(holder, recipient, tokenId, 1, data, { from: holder });
      expectEvent(receipt, 'TransferSingle', {
        operator: holder,
        from: holder,
        to: recipient,
        id: tokenId,
        value: '1',
      });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: supply, newBalance: supply.subn(1) });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'TransferSingle');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '1';
    });

    afterEach(async function () {
      expect(await this.token.getVotes(holder, tokenId)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getVotes(recipient, tokenId)).to.be.bignumber.equal(this.recipientVotes);

      // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
      const blockNumber = await time.latestBlock();
      await time.advanceBlock();
      expect(await this.token.getPastVotes(holder, tokenId, blockNumber)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getPastVotes(recipient, tokenId, blockNumber)).to.be.bignumber.equal(this.recipientVotes);
    });
  });

  // The following tests are a adaptation of https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
  describe('Compound test suite', function () {
    beforeEach(async function () {
      await this.token.mint(holder, tokenId, supply, data);
    });

    describe('numCheckpoints', function () {
      it('returns the number of checkpoints for a delegate', async function () {
        await this.token.safeTransferFrom(holder, recipient, tokenId, '100', data, { from: holder }); //give an account a few tokens for readability
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('0');

        const t1 = await this.token.delegate(tokenId, other1, { from: recipient });
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('1');
        
        const t2 = await this.token.safeTransferFrom(recipient, other2, tokenId, 10, data, { from: recipient });
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('2');

        const t3 = await this.token.safeTransferFrom(recipient, other2, tokenId, 10, data, { from: recipient });
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('3');

        const t4 = await this.token.safeTransferFrom(holder, recipient, tokenId, 20, data, { from: holder });
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('4');

        expect(await this.token.checkpoints(other1, tokenId, 0)).to.be.deep.equal([ t1.receipt.blockNumber.toString(), '100' ]);
        expect(await this.token.checkpoints(other1, tokenId, 1)).to.be.deep.equal([ t2.receipt.blockNumber.toString(), '90' ]);
        expect(await this.token.checkpoints(other1, tokenId, 2)).to.be.deep.equal([ t3.receipt.blockNumber.toString(), '80' ]);
        expect(await this.token.checkpoints(other1, tokenId, 3)).to.be.deep.equal([ t4.receipt.blockNumber.toString(), '100' ]);

        await time.advanceBlock();
        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal('100');
        expect(await this.token.getPastVotes(other1, tokenId, t2.receipt.blockNumber)).to.be.bignumber.equal('90');
        expect(await this.token.getPastVotes(other1, tokenId, t3.receipt.blockNumber)).to.be.bignumber.equal('80');
        expect(await this.token.getPastVotes(other1, tokenId, t4.receipt.blockNumber)).to.be.bignumber.equal('100');
      });

      it('does not add more than one checkpoint in a block', async function () {
        await this.token.safeTransferFrom(holder, recipient, tokenId, '100', data, { from: holder });
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('0');

        const [ t1, t2, t3 ] = await batchInBlock([
          () => this.token.delegate(tokenId, other1, { from: recipient, gas: 200000 }),
          () => this.token.safeTransferFrom(recipient, other2, tokenId, 10, data, { from: recipient, gas: 100000 }),
          () => this.token.safeTransferFrom(recipient, other2, tokenId, 10, data, { from: recipient, gas: 100000 }),
        ]);
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('1');
        expect(await this.token.checkpoints(other1, tokenId, 0)).to.be.deep.equal([ t1.receipt.blockNumber.toString(), '80' ]);
        // expectReve(await this.token.checkpoints(other1, 1)).to.be.deep.equal([ '0', '0' ]); // Reverts due to array overflow check
        // expect(await this.token.checkpoints(other1, 2)).to.be.deep.equal([ '0', '0' ]); // Reverts due to array overflow check

        const t4 = await this.token.safeTransferFrom(holder, recipient, tokenId, 20, data, { from: holder });
        expect(await this.token.numCheckpoints(other1, tokenId)).to.be.bignumber.equal('2');
        expect(await this.token.checkpoints(other1, tokenId, 1)).to.be.deep.equal([ t4.receipt.blockNumber.toString(), '100' ]);
      });
    });

    describe('balanceOf', function () {
      it('grants to initial account', async function () {
        expect(await this.token.balanceOf(holder, tokenId)).to.be.bignumber.equal(supply);
      });
    });

    describe('getPastVotes', function () {
      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.token.getPastVotes(other1, tokenId, 5e10),
          'Checkpoints: block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.token.getPastVotes(other1, tokenId, 0)).to.be.bignumber.equal('0');
      });

      it('returns the latest block if >= last checkpoint block', async function () {
        const t1 = await this.token.delegate(tokenId, other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });

      it('returns zero if < first checkpoint block', async function () {
        await time.advanceBlock();
        const t1 = await this.token.delegate(tokenId, other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });

      it('generally returns the voting balance at the appropriate checkpoint', async function () {
        const t1 = await this.token.delegate(tokenId, other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t2 = await this.token.safeTransferFrom(holder, other2, tokenId, 10, data, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t3 = await this.token.safeTransferFrom(holder, other2, tokenId, 10, data, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t4 = await this.token.safeTransferFrom(other2, holder, tokenId, 20, data, { from: other2 });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
        expect(await this.token.getPastVotes(other1, tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
        expect(await this.token.getPastVotes(other1, tokenId, t2.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(10));
        expect(await this.token.getPastVotes(other1, tokenId, t2.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(10));
        expect(await this.token.getPastVotes(other1, tokenId, t3.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(20));
        expect(await this.token.getPastVotes(other1, tokenId, t3.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(20));
        expect(await this.token.getPastVotes(other1, tokenId, t4.receipt.blockNumber)).to.be.bignumber.equal(supply);
        expect(await this.token.getPastVotes(other1, tokenId, t4.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });
    });
  });

  describe('getPastTotalSupply', function () {
    beforeEach(async function () {
      await this.token.delegate(tokenId, holder, { from: holder });
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.token.getPastTotalSupply(tokenId, 5e10),
        'Votes: block not yet mined',
      );
    });

    it('returns 0 if there are no checkpoints', async function () {
      expect(await this.token.getPastTotalSupply(tokenId, 0)).to.be.bignumber.equal('0');
    });

    it('returns the latest block if >= last checkpoint block', async function () {
      t1 = await this.token.mint(holder, tokenId, supply, data);

      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('returns zero if < first checkpoint block', async function () {
      await time.advanceBlock();
      const t1 = await this.token.mint(holder, tokenId, supply, data);
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('generally returns the voting balance at the appropriate checkpoint', async function () {
      const t1 = await this.token.mint(holder, tokenId, supply, data);
      await time.advanceBlock();
      await time.advanceBlock();
      const t2 = await this.token.burn(holder, tokenId, 10);
      await time.advanceBlock();
      await time.advanceBlock();
      const t3 = await this.token.burn(holder, tokenId, 10);
      await time.advanceBlock();
      await time.advanceBlock();
      const t4 = await this.token.mint(holder, tokenId, 20, data);
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastTotalSupply(tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastTotalSupply(tokenId, t2.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(10));
      expect(await this.token.getPastTotalSupply(tokenId, t2.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(10));
      expect(await this.token.getPastTotalSupply(tokenId, t3.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(20));
      expect(await this.token.getPastTotalSupply(tokenId, t3.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(20));
      expect(await this.token.getPastTotalSupply(tokenId, t4.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.getPastTotalSupply(tokenId, t4.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });
  });

  describe('Voting workflow', function () {
    beforeEach(async function () {
      this.account1 = holder;
      this.account1Delegatee = holderDelegatee;
      this.account2 = recipient;
      this.name = 'My Token';
      this.votes = this.token
      this.tokenId = tokenId;
      this.data = data;
      this.token0 = 1;
      this.token1 = 1;
      this.token2 = 1;
      this.token3 = 1;
    });

    shouldBehaveLikeVotesMulti();
  });
});
