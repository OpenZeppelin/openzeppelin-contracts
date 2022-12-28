const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { EIP712Domain, domainSeparator } = require('../../helpers/eip712');
const { web3 } = require('hardhat');

const Delegation = [
  { name: 'id', type: 'uint256' },
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

const version = '1';

function shouldBehaveLikeVotesMulti () {
  describe('run votes workflow', function () {
    it('initial nonce is 0', async function () {
      expect(await this.votes.nonces(this.account1)).to.be.bignumber.equal('0');
    });

    it('domain separator', async function () {
      expect(
        await this.votes.DOMAIN_SEPARATOR(),
      ).to.equal(
        await domainSeparator(this.name, version, this.chainId, this.votes.address),
      );
    });

    describe('delegation with signature', function () {
      const delegator = Wallet.generate();
      const delegatorAddress = web3.utils.toChecksumAddress(delegator.getAddressString());
      const nonce = 0;

      const buildData = (chainId, verifyingContract, name, message) => ({
        data: {
          primaryType: 'Delegation',
          types: { EIP712Domain, Delegation },
          domain: { name, version, chainId, verifyingContract },
          message,
        },
      });

      beforeEach(async function () {
        await this.votes.mint(delegatorAddress, this.tokenId, this.token0, this.data);
      });

      it('accept signed delegation', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            id: this.tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        expect(await this.votes.delegates(delegatorAddress, this.tokenId)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.votes.delegateBySig(this.tokenId, delegatorAddress, nonce, MAX_UINT256, v, r, s);
        expectEvent(receipt, 'DelegateChanged', {
          delegator: delegatorAddress,
          id: this.tokenId,
          fromDelegate: ZERO_ADDRESS,
          toDelegate: delegatorAddress,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: delegatorAddress,
          id: this.tokenId,
          previousBalance: '0',
          newBalance: '1',
        });

        expect(await this.votes.delegates(delegatorAddress, this.tokenId)).to.be.equal(delegatorAddress);

        expect(await this.votes.getVotes(delegatorAddress, this.tokenId)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastVotes(
          delegatorAddress,
          this.tokenId,
          receipt.blockNumber - 1,
        )).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(delegatorAddress, this.tokenId, receipt.blockNumber)).to.be.bignumber.equal('1');
      });

      it('rejects reused signature', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            id: this.tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await this.votes.delegateBySig(this.tokenId, delegatorAddress, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.votes.delegateBySig(this.tokenId, delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects bad delegatee', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            id: this.tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        const receipt = await this.votes.delegateBySig(this.tokenId, this.account1Delegatee, nonce, MAX_UINT256, v, r, s);
        const { args } = receipt.logs.find(({ event }) => event === 'DelegateChanged');
        expect(args.delegator).to.not.be.equal(delegatorAddress);
        expect(args.fromDelegate).to.be.equal(ZERO_ADDRESS);
        expect(args.toDelegate).to.be.equal(this.account1Delegatee);
      });

      it('rejects bad nonce', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            id: this.tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));
        await expectRevert(
          this.votes.delegateBySig(this.tokenId, delegatorAddress, nonce + 1, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects expired permit', async function () {
        const expiry = (await time.latest()) - time.duration.weeks(1);
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            id: this.tokenId,
            delegatee: delegatorAddress,
            nonce,
            expiry,
          }),
        ));

        await expectRevert(
          this.votes.delegateBySig(this.tokenId, delegatorAddress, nonce, expiry, v, r, s),
          'Votes: signature expired',
        );
      });
    });

    describe('set delegation', function () {
      describe('call', function () {
        it('delegation with tokens', async function () {
          await this.votes.mint(this.account1, this.tokenId, this.token0, this.data);
          expect(await this.votes.delegates(this.account1, this.tokenId)).to.be.equal(ZERO_ADDRESS);

          const { receipt } = await this.votes.delegate(this.tokenId, this.account1, { from: this.account1 });
          expectEvent(receipt, 'DelegateChanged', {
            delegator: this.account1,
            id: this.tokenId,
            fromDelegate: ZERO_ADDRESS,
            toDelegate: this.account1,
          });
          expectEvent(receipt, 'DelegateVotesChanged', {
            delegate: this.account1,
            id: this.tokenId,
            previousBalance: '0',
            newBalance: '1',
          });

          expect(await this.votes.delegates(this.account1, this.tokenId)).to.be.equal(this.account1);

          expect(await this.votes.getVotes(this.account1, this.tokenId)).to.be.bignumber.equal('1');
          expect(await this.votes.getPastVotes(this.account1, this.tokenId, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
          await time.advanceBlock();
          expect(await this.votes.getPastVotes(this.account1, this.tokenId, receipt.blockNumber)).to.be.bignumber.equal('1');
        });

        it('delegation without tokens', async function () {
          expect(await this.votes.delegates(this.account1, this.tokenId)).to.be.equal(ZERO_ADDRESS);

          const { receipt } = await this.votes.delegate(this.tokenId, this.account1, { from: this.account1 });
          expectEvent(receipt, 'DelegateChanged', {
            delegator: this.account1,
            id: this.tokenId,
            fromDelegate: ZERO_ADDRESS,
            toDelegate: this.account1,
          });
          expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

          expect(await this.votes.delegates(this.account1, this.tokenId)).to.be.equal(this.account1);
        });
      });
    });

    describe('change delegation', function () {
      beforeEach(async function () {
        await this.votes.mint(this.account1, this.tokenId, this.token0, this.data);
        await this.votes.delegate(this.tokenId, this.account1, { from: this.account1 });
      });

      it('call', async function () {
        expect(await this.votes.delegates(this.account1, this.tokenId)).to.be.equal(this.account1);

        const { receipt } = await this.votes.delegate(this.tokenId, this.account1Delegatee, { from: this.account1 });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: this.account1,
          id: this.tokenId,
          fromDelegate: this.account1,
          toDelegate: this.account1Delegatee,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: this.account1,
          id: this.tokenId,
          previousBalance: '1',
          newBalance: '0',
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: this.account1Delegatee,
          id: this.tokenId,
          previousBalance: '0',
          newBalance: '1',
        });
        const prevBlock = receipt.blockNumber - 1;
        expect(await this.votes.delegates(this.account1, this.tokenId)).to.be.equal(this.account1Delegatee);

        expect(await this.votes.getVotes(this.account1, this.tokenId)).to.be.bignumber.equal('0');
        expect(await this.votes.getVotes(this.account1Delegatee, this.tokenId)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastVotes(this.account1, this.tokenId, receipt.blockNumber - 1)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastVotes(this.account1Delegatee, this.tokenId, prevBlock)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(this.account1, this.tokenId, receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastVotes(this.account1Delegatee, this.tokenId, receipt.blockNumber)).to.be.bignumber.equal('1');
      });
    });

    describe('getPastTotalSupply', function () {
      beforeEach(async function () {
        await this.votes.delegate(this.tokenId, this.account1, { from: this.account1 });
      });

      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.votes.getPastTotalSupply(this.tokenId, 5e10),
          'block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.votes.getPastTotalSupply(this.tokenId, 0)).to.be.bignumber.equal('0');
      });

      it('returns the latest block if >= last checkpoint block', async function () {
        const t1 = await this.votes.mint(this.account1, this.tokenId, this.token0, this.data);
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.votes.getPastTotalSupply(this.tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
      });

      it('returns zero if < first checkpoint block', async function () {
        await time.advanceBlock();
        const t2 = await this.votes.mint(this.account1, this.tokenId, this.token1, this.data);
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.votes.getPastTotalSupply(this.tokenId, t2.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t2.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
      });

      it('generally returns the voting balance at the appropriate checkpoint', async function () {
        const t1 = await this.votes.mint(this.account1, this.tokenId, this.token1, this.data);
        await time.advanceBlock();
        await time.advanceBlock();
        const t2 = await this.votes.burn(this.account1, this.tokenId, this.token1);
        await time.advanceBlock();
        await time.advanceBlock();
        const t3 = await this.votes.mint(this.account1, this.tokenId, this.token2, this.data);
        await time.advanceBlock();
        await time.advanceBlock();
        const t4 = await this.votes.burn(this.account1, this.tokenId, this.token2);
        await time.advanceBlock();
        await time.advanceBlock();
        const t5 = await this.votes.mint(this.account1, this.tokenId, this.token3, this.data);
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.votes.getPastTotalSupply(this.tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t1.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t2.receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t2.receipt.blockNumber + 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t3.receipt.blockNumber)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t3.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t4.receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t4.receipt.blockNumber + 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t5.receipt.blockNumber)).to.be.bignumber.equal('1');
        expect(await this.votes.getPastTotalSupply(this.tokenId, t5.receipt.blockNumber + 1)).to.be.bignumber.equal('1');
      });
    });

    // The following tests are a adaptation of
    // https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
    describe('Compound test suite', function () {
      beforeEach(async function () {
        await this.votes.mint(this.account1, this.tokenId, this.token0, this.data);
        await this.votes.mint(this.account1, this.tokenId, this.token1, this.data);
        await this.votes.mint(this.account1, this.tokenId, this.token2, this.data);
        await this.votes.mint(this.account1, this.tokenId, this.token3, this.data);
      });

      describe('getPastVotes', function () {
        it('reverts if block number >= current block', async function () {
          await expectRevert(
            this.votes.getPastVotes(this.account2, this.tokenId, 5e10),
            'block not yet mined',
          );
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.votes.getPastVotes(this.account2, this.tokenId, 0)).to.be.bignumber.equal('0');
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const t1 = await this.votes.delegate(this.tokenId, this.account2, { from: this.account1 });
          await time.advanceBlock();
          await time.advanceBlock();
          const latest = await this.votes.getVotes(this.account2, this.tokenId);
          const nextBlock = t1.receipt.blockNumber + 1;
          expect(await this.votes.getPastVotes(this.account2, this.tokenId, t1.receipt.blockNumber)).to.be.bignumber.equal(latest);
          expect(await this.votes.getPastVotes(this.account2, this.tokenId, nextBlock)).to.be.bignumber.equal(latest);
        });

        it('returns zero if < first checkpoint block', async function () {
          await time.advanceBlock();
          const t1 = await this.votes.delegate(this.tokenId, this.account2, { from: this.account1 });
          await time.advanceBlock();
          await time.advanceBlock();

          expect(await this.votes.getPastVotes(this.account2, this.tokenId, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeVotesMulti,
};
