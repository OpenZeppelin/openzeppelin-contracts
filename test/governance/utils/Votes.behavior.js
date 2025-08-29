const { ethers } = require('hardhat');
const { expect } = require('chai');
const { mine } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, Delegation } = require('../../helpers/eip712');
const time = require('../../helpers/time');

const { shouldBehaveLikeERC6372 } = require('./ERC6372.behavior');

function shouldBehaveLikeVotes(tokens, { mode = 'blocknumber', fungible = true }) {
  beforeEach(async function () {
    [this.delegator, this.delegatee, this.alice, this.bob, this.other] = this.accounts;
    this.domain = await getDomain(this.votes);
  });

  shouldBehaveLikeERC6372(mode);

  const getWeight = token => (fungible ? token : 1n);

  describe('run votes workflow', function () {
    it('initial nonce is 0', async function () {
      expect(await this.votes.nonces(this.alice)).to.equal(0n);
    });

    describe('delegation with signature', function () {
      const token = tokens[0];

      it('delegation without tokens', async function () {
        expect(await this.votes.delegates(this.alice)).to.equal(ethers.ZeroAddress);

        await expect(this.votes.connect(this.alice).delegate(this.alice))
          .to.emit(this.votes, 'DelegateChanged')
          .withArgs(this.alice, ethers.ZeroAddress, this.alice)
          .to.not.emit(this.votes, 'DelegateVotesChanged');

        expect(await this.votes.delegates(this.alice)).to.equal(this.alice);
      });

      it('delegation with tokens', async function () {
        await this.votes.$_mint(this.alice, token);
        const weight = getWeight(token);

        expect(await this.votes.delegates(this.alice)).to.equal(ethers.ZeroAddress);

        const tx = await this.votes.connect(this.alice).delegate(this.alice);
        const timepoint = await time.clockFromReceipt[mode](tx);

        await expect(tx)
          .to.emit(this.votes, 'DelegateChanged')
          .withArgs(this.alice, ethers.ZeroAddress, this.alice)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.alice, 0n, weight);

        expect(await this.votes.delegates(this.alice)).to.equal(this.alice);
        expect(await this.votes.getVotes(this.alice)).to.equal(weight);
        expect(await this.votes.getPastVotes(this.alice, timepoint - 1n)).to.equal(0n);
        await mine();
        expect(await this.votes.getPastVotes(this.alice, timepoint)).to.equal(weight);
      });

      it('delegation update', async function () {
        await this.votes.connect(this.alice).delegate(this.alice);
        await this.votes.$_mint(this.alice, token);
        const weight = getWeight(token);

        expect(await this.votes.delegates(this.alice)).to.equal(this.alice);
        expect(await this.votes.getVotes(this.alice)).to.equal(weight);
        expect(await this.votes.getVotes(this.bob)).to.equal(0n);

        const tx = await this.votes.connect(this.alice).delegate(this.bob);
        const timepoint = await time.clockFromReceipt[mode](tx);

        await expect(tx)
          .to.emit(this.votes, 'DelegateChanged')
          .withArgs(this.alice, this.alice, this.bob)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.alice, weight, 0n)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.bob, 0n, weight);

        expect(await this.votes.delegates(this.alice)).to.equal(this.bob);
        expect(await this.votes.getVotes(this.alice)).to.equal(0n);
        expect(await this.votes.getVotes(this.bob)).to.equal(weight);

        expect(await this.votes.getPastVotes(this.alice, timepoint - 1n)).to.equal(weight);
        expect(await this.votes.getPastVotes(this.bob, timepoint - 1n)).to.equal(0n);
        await mine();
        expect(await this.votes.getPastVotes(this.alice, timepoint)).to.equal(0n);
        expect(await this.votes.getPastVotes(this.bob, timepoint)).to.equal(weight);
      });

      describe('with signature', function () {
        const nonce = 0n;

        it('accept signed delegation', async function () {
          await this.votes.$_mint(this.delegator, token);
          const weight = getWeight(token);

          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { Delegation },
              {
                delegatee: this.delegatee.address,
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          expect(await this.votes.delegates(this.delegator)).to.equal(ethers.ZeroAddress);

          const tx = await this.votes.delegateBySig(this.delegatee, nonce, ethers.MaxUint256, v, r, s);
          const timepoint = await time.clockFromReceipt[mode](tx);

          await expect(tx)
            .to.emit(this.votes, 'DelegateChanged')
            .withArgs(this.delegator, ethers.ZeroAddress, this.delegatee)
            .to.emit(this.votes, 'DelegateVotesChanged')
            .withArgs(this.delegatee, 0n, weight);

          expect(await this.votes.delegates(this.delegator.address)).to.equal(this.delegatee);
          expect(await this.votes.getVotes(this.delegator.address)).to.equal(0n);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(weight);
          expect(await this.votes.getPastVotes(this.delegatee, timepoint - 1n)).to.equal(0n);
          await mine();
          expect(await this.votes.getPastVotes(this.delegatee, timepoint)).to.equal(weight);
        });

        it('rejects reused signature', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { Delegation },
              {
                delegatee: this.delegatee.address,
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          await this.votes.delegateBySig(this.delegatee, nonce, ethers.MaxUint256, v, r, s);

          await expect(this.votes.delegateBySig(this.delegatee, nonce, ethers.MaxUint256, v, r, s))
            .to.be.revertedWithCustomError(this.votes, 'InvalidAccountNonce')
            .withArgs(this.delegator, nonce + 1n);
        });

        it('rejects bad delegatee', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { Delegation },
              {
                delegatee: this.delegatee.address,
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          const tx = await this.votes.delegateBySig(this.other, nonce, ethers.MaxUint256, v, r, s);
          const receipt = await tx.wait();

          const [delegateChanged] = receipt.logs.filter(
            log => this.votes.interface.parseLog(log)?.name === 'DelegateChanged',
          );
          const { args } = this.votes.interface.parseLog(delegateChanged);
          expect(args.delegator).to.not.be.equal(this.delegator);
          expect(args.fromDelegate).to.equal(ethers.ZeroAddress);
          expect(args.toDelegate).to.equal(this.other);
        });

        it('rejects bad nonce', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { Delegation },
              {
                delegatee: this.delegatee.address,
                nonce: nonce + 1n,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          await expect(this.votes.delegateBySig(this.delegatee, nonce + 1n, ethers.MaxUint256, v, r, s))
            .to.be.revertedWithCustomError(this.votes, 'InvalidAccountNonce')
            .withArgs(this.delegator, 0n);
        });

        it('rejects expired permit', async function () {
          const expiry = (await time.clock.timestamp()) - 1n;
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { Delegation },
              {
                delegatee: this.delegatee.address,
                nonce,
                expiry,
              },
            )
            .then(ethers.Signature.from);

          await expect(this.votes.delegateBySig(this.delegatee, nonce, expiry, v, r, s))
            .to.be.revertedWithCustomError(this.votes, 'VotesExpiredSignature')
            .withArgs(expiry);
        });
      });
    });

    describe('getPastTotalSupply', function () {
      beforeEach(async function () {
        await this.votes.connect(this.alice).delegate(this.alice);
      });

      it('reverts if block number >= current block', async function () {
        const timepoint = 50_000_000_000n;
        const clock = await this.votes.clock();
        await expect(this.votes.getPastTotalSupply(timepoint))
          .to.be.revertedWithCustomError(this.votes, 'ERC5805FutureLookup')
          .withArgs(timepoint, clock);
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.votes.getPastTotalSupply(0n)).to.equal(0n);
      });

      it('returns the correct checkpointed total supply', async function () {
        const weight = tokens.map(token => getWeight(token));

        // t0 = mint #0
        const t0 = await this.votes.$_mint(this.alice, tokens[0]);
        await mine();
        // t1 = mint #1
        const t1 = await this.votes.$_mint(this.alice, tokens[1]);
        await mine();
        // t2 = burn #1
        const t2 = await this.votes.$_burn(...(fungible ? [this.alice] : []), tokens[1]);
        await mine();
        // t3 = mint #2
        const t3 = await this.votes.$_mint(this.alice, tokens[2]);
        await mine();
        // t4 = burn #0
        const t4 = await this.votes.$_burn(...(fungible ? [this.alice] : []), tokens[0]);
        await mine();
        // t5 = burn #2
        const t5 = await this.votes.$_burn(...(fungible ? [this.alice] : []), tokens[2]);
        await mine();

        t0.timepoint = await time.clockFromReceipt[mode](t0);
        t1.timepoint = await time.clockFromReceipt[mode](t1);
        t2.timepoint = await time.clockFromReceipt[mode](t2);
        t3.timepoint = await time.clockFromReceipt[mode](t3);
        t4.timepoint = await time.clockFromReceipt[mode](t4);
        t5.timepoint = await time.clockFromReceipt[mode](t5);

        expect(await this.votes.getPastTotalSupply(t0.timepoint - 1n)).to.equal(0n);
        expect(await this.votes.getPastTotalSupply(t0.timepoint)).to.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t0.timepoint + 1n)).to.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t1.timepoint)).to.equal(weight[0] + weight[1]);
        expect(await this.votes.getPastTotalSupply(t1.timepoint + 1n)).to.equal(weight[0] + weight[1]);
        expect(await this.votes.getPastTotalSupply(t2.timepoint)).to.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t2.timepoint + 1n)).to.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t3.timepoint)).to.equal(weight[0] + weight[2]);
        expect(await this.votes.getPastTotalSupply(t3.timepoint + 1n)).to.equal(weight[0] + weight[2]);
        expect(await this.votes.getPastTotalSupply(t4.timepoint)).to.equal(weight[2]);
        expect(await this.votes.getPastTotalSupply(t4.timepoint + 1n)).to.equal(weight[2]);
        expect(await this.votes.getPastTotalSupply(t5.timepoint)).to.equal(0n);
        await expect(this.votes.getPastTotalSupply(t5.timepoint + 1n))
          .to.be.revertedWithCustomError(this.votes, 'ERC5805FutureLookup')
          .withArgs(t5.timepoint + 1n, t5.timepoint + 1n);
      });
    });

    // The following tests are an adaptation of
    // https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
    describe('Compound test suite', function () {
      beforeEach(async function () {
        await this.votes.$_mint(this.alice, tokens[0]);
        await this.votes.$_mint(this.alice, tokens[1]);
        await this.votes.$_mint(this.alice, tokens[2]);
      });

      describe('getPastVotes', function () {
        it('reverts if block number >= current block', async function () {
          const clock = await this.votes.clock();
          const timepoint = 50_000_000_000n; // far in the future
          await expect(this.votes.getPastVotes(this.bob, timepoint))
            .to.be.revertedWithCustomError(this.votes, 'ERC5805FutureLookup')
            .withArgs(timepoint, clock);
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.votes.getPastVotes(this.bob, 0n)).to.equal(0n);
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const delegate = await this.votes.connect(this.alice).delegate(this.bob);
          const timepoint = await time.clockFromReceipt[mode](delegate);
          await mine(2);

          const latest = await this.votes.getVotes(this.bob);
          expect(await this.votes.getPastVotes(this.bob, timepoint)).to.equal(latest);
          expect(await this.votes.getPastVotes(this.bob, timepoint + 1n)).to.equal(latest);
        });

        it('returns zero if < first checkpoint block', async function () {
          await mine();
          const delegate = await this.votes.connect(this.alice).delegate(this.bob);
          const timepoint = await time.clockFromReceipt[mode](delegate);
          await mine(2);

          expect(await this.votes.getPastVotes(this.bob, timepoint - 1n)).to.equal(0n);
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeVotes,
};
