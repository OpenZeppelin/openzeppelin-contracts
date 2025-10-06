const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const { MAX_UINT256 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { EIP712Domain, domainSeparator } = require('../../helpers/eip712');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

const version = '1';

function shouldBehaveLikeVotesNF () {
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
        await this.votes.mint(delegatorAddress, this.NFT0);
      });

      it('accept signed delegation', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        expect(await this.votes.delegates(delegatorAddress)).to.be.equal(delegatorAddress);

        const { receipt } = await this.votes.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);
        expectEvent(receipt, 'DelegateChanged', {
          delegator: delegatorAddress,
          fromDelegate: delegatorAddress,
          toDelegate: delegatorAddress,
        });
        expectEvent.notEmitted(receipt, 'DelegateVotesChanged');
        expect(await this.votes.delegates(delegatorAddress)).to.be.equal(delegatorAddress);
        const NFT0power = await this.votes.powerOfToken(this.NFT0);
        expect(await this.votes.getVotes(delegatorAddress)).to.be.bignumber.equal(NFT0power);
      });

      it('rejects reused signature', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await this.votes.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.votes.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects bad delegatee', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await expectRevert(
          this.votes.delegateBySig(this.account1Delegatee, nonce, MAX_UINT256, v, r, s),
          'Votes: no units to transfer',
        );
      });

      it('rejects bad nonce', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));
        await expectRevert(
          this.votes.delegateBySig(delegatorAddress, nonce + 1, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects expired permit', async function () {
        const expiry = (await time.latest()) - time.duration.weeks(1);
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee: delegatorAddress,
            nonce,
            expiry,
          }),
        ));

        await expectRevert(
          this.votes.delegateBySig(delegatorAddress, nonce, expiry, v, r, s),
          'Votes: signature expired',
        );
      });
    });

    describe('set delegation', function () {
      describe('call', function () {
        it('delegation with tokens', async function () {
          await this.votes.mint(this.account1, this.NFT0);
          const NFT0power = await this.votes.powerOfToken(this.NFT0);
          const { receipt } = await this.votes.delegate(this.account1, { from: this.account1 });
          expectEvent(receipt, 'DelegateChanged', {
            delegator: this.account1,
            fromDelegate: this.account1,
            toDelegate: this.account1,
          });
          expectEvent.notEmitted(receipt, 'DelegateVotesChanged');
          expect(await this.votes.delegates(this.account1)).to.be.equal(this.account1);
          expect(await this.votes.getVotes(this.account1)).to.be.bignumber.equal(NFT0power);
        });

        it('delegation without tokens', async function () {
          expect(await this.votes.delegates(this.account1)).to.be.equal(this.account1);

          const { receipt } = await this.votes.delegate(this.account1, { from: this.account1 });
          expectEvent(receipt, 'DelegateChanged', {
            delegator: this.account1,
            fromDelegate: this.account1,
            toDelegate: this.account1,
          });
          expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

          expect(await this.votes.delegates(this.account1)).to.be.equal(this.account1);
        });
      });
    });

    describe('change delegation', function () {
      beforeEach(async function () {
        await this.votes.mint(this.account1, this.NFT0);
        await this.votes.delegate(this.account1, { from: this.account1 });
        this.NFT0power = await this.votes.powerOfToken(this.NFT0);
      });

      it('call', async function () {
        expect(await this.votes.delegates(this.account1)).to.be.equal(this.account1);

        const { receipt } = await this.votes.delegate(this.account1Delegatee, { from: this.account1 });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: this.account1,
          fromDelegate: this.account1,
          toDelegate: this.account1Delegatee,
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: this.account1,
          previousBalance: this.NFT0power.toString(),
          newBalance: '0',
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: this.account1Delegatee,
          previousBalance: '0',
          newBalance: this.NFT0power.toString(),
        });
        const prevBlock = receipt.blockNumber - 1;
        expect(await this.votes.delegates(this.account1)).to.be.equal(this.account1Delegatee);

        expect(await this.votes.getVotes(this.account1)).to.be.bignumber.equal('0');
        expect(await this.votes.getVotes(this.account1Delegatee)).to.be.bignumber.equal(this.NFT0power.toString());
        expect(await this.votes.getPastVotes(this.account1, receipt.blockNumber - 1))
          .to.be.bignumber.equal(this.NFT0power.toString());
        expect(await this.votes.getPastVotes(this.account1Delegatee, prevBlock)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(this.account1, receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastVotes(this.account1Delegatee, receipt.blockNumber))
          .to.be.bignumber.equal(this.NFT0power.toString());
      });
    });

    describe('getPastTotalSupply', function () {
      beforeEach(async function () {
        await this.votes.delegate(this.account1, { from: this.account1 });
      });

      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.votes.getPastTotalSupply(5e10),
          'block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.votes.getPastTotalSupply(0)).to.be.bignumber.equal('0');
      });

      it('returns the latest block if >= last checkpoint block', async function () {
        const t1 = await this.votes.mint(this.account1, this.NFT0);
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.votes.getPastTotalSupply(t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t1.receipt.blockNumber + 1))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT0));
      });

      it('returns zero if < first checkpoint block', async function () {
        await time.advanceBlock();
        const t2 = await this.votes.mint(this.account1, this.NFT1);
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.votes.getPastTotalSupply(t2.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t2.receipt.blockNumber + 1))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT1));
      });

      it('generally returns the voting balance at the appropriate checkpoint', async function () {
        const t1 = await this.votes.mint(this.account1, this.NFT1);
        await time.advanceBlock();
        await time.advanceBlock();
        const t2 = await this.votes.burn(this.NFT1);
        await time.advanceBlock();
        await time.advanceBlock();
        const t3 = await this.votes.mint(this.account1, this.NFT2);
        await time.advanceBlock();
        await time.advanceBlock();
        const t4 = await this.votes.burn(this.NFT2);
        await time.advanceBlock();
        await time.advanceBlock();
        const t5 = await this.votes.mint(this.account1, this.NFT3);
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.votes.getPastTotalSupply(t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t1.receipt.blockNumber))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT1));
        expect(await this.votes.getPastTotalSupply(t1.receipt.blockNumber + 1))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT1));
        expect(await this.votes.getPastTotalSupply(t2.receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t2.receipt.blockNumber + 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t3.receipt.blockNumber))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT2));
        expect(await this.votes.getPastTotalSupply(t3.receipt.blockNumber + 1))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT2));
        expect(await this.votes.getPastTotalSupply(t4.receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t4.receipt.blockNumber + 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t5.receipt.blockNumber))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT3));
        expect(await this.votes.getPastTotalSupply(t5.receipt.blockNumber + 1))
          .to.be.bignumber.equal(await this.votes.powerOfToken(this.NFT3));
      });
    });

    // The following tests are a adaptation of
    // https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
    describe('Compound test suite', function () {
      beforeEach(async function () {
        await this.votes.mint(this.account1, this.NFT0);
        await this.votes.mint(this.account1, this.NFT1);
        await this.votes.mint(this.account1, this.NFT2);
        await this.votes.mint(this.account1, this.NFT3);
      });

      describe('getPastVotes', function () {
        it('reverts if block number >= current block', async function () {
          await expectRevert(
            this.votes.getPastVotes(this.account2, 5e10),
            'block not yet mined',
          );
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.votes.getPastVotes(this.account2, 0)).to.be.bignumber.equal('0');
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const t1 = await this.votes.delegate(this.account2, { from: this.account1 });
          await time.advanceBlock();
          await time.advanceBlock();
          const latest = await this.votes.getVotes(this.account2);
          const nextBlock = t1.receipt.blockNumber + 1;
          expect(await this.votes.getPastVotes(this.account2, t1.receipt.blockNumber)).to.be.bignumber.equal(latest);
          expect(await this.votes.getPastVotes(this.account2, nextBlock)).to.be.bignumber.equal(latest);
        });

        it('returns zero if < first checkpoint block', async function () {
          await time.advanceBlock();
          const t1 = await this.votes.delegate(this.account2, { from: this.account1 });
          await time.advanceBlock();
          await time.advanceBlock();

          expect(await this.votes.getPastVotes(this.account2, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeVotesNF,
};
