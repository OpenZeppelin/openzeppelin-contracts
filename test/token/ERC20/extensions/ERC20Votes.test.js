const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, Delegation } = require('../../../helpers/eip712');
const { batchInBlock } = require('../../../helpers/txpool');
const time = require('../../../helpers/time');

const { shouldBehaveLikeVotes } = require('../../../governance/utils/Votes.behavior');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];

const name = 'My Token';
const symbol = 'MTKN';
const version = '1';
const supply = ethers.parseEther('10000000');

describe('ERC20Votes', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      // accounts is required by shouldBehaveLikeVotes
      const accounts = await ethers.getSigners();
      const [holder, recipient, delegatee, other1, other2] = accounts;

      const token = await ethers.deployContract(Token, [name, symbol, name, version]);
      const domain = await getDomain(token);

      return { accounts, holder, recipient, delegatee, other1, other2, token, domain };
    };

    describe(`vote with ${mode}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        this.votes = this.token;
      });

      // includes ERC6372 behavior check
      shouldBehaveLikeVotes([1, 17, 42], { mode, fungible: true });

      it('initial nonce is 0', async function () {
        expect(await this.token.nonces(this.holder)).to.equal(0n);
      });

      it('minting restriction', async function () {
        const value = 2n ** 208n;
        await expect(this.token.$_mint(this.holder, value))
          .to.be.revertedWithCustomError(this.token, 'ERC20ExceededSafeSupply')
          .withArgs(value, value - 1n);
      });

      it('recent checkpoints', async function () {
        await this.token.connect(this.holder).delegate(this.holder);
        for (let i = 0; i < 6; i++) {
          await this.token.$_mint(this.holder, 1n);
        }
        const timepoint = await time.clock[mode]();
        expect(await this.token.numCheckpoints(this.holder)).to.equal(6n);
        // recent
        expect(await this.token.getPastVotes(this.holder, timepoint - 1n)).to.equal(5n);
        // non-recent
        expect(await this.token.getPastVotes(this.holder, timepoint - 6n)).to.equal(0n);
      });

      describe('set delegation', function () {
        describe('call', function () {
          it('delegation with balance', async function () {
            await this.token.$_mint(this.holder, supply);
            expect(await this.token.delegates(this.holder)).to.equal(ethers.ZeroAddress);

            const tx = await this.token.connect(this.holder).delegate(this.holder);
            const timepoint = await time.clockFromReceipt[mode](tx);

            await expect(tx)
              .to.emit(this.token, 'DelegateChanged')
              .withArgs(this.holder, ethers.ZeroAddress, this.holder)
              .to.emit(this.token, 'DelegateVotesChanged')
              .withArgs(this.holder, 0n, supply);

            expect(await this.token.delegates(this.holder)).to.equal(this.holder);
            expect(await this.token.getVotes(this.holder)).to.equal(supply);
            expect(await this.token.getPastVotes(this.holder, timepoint - 1n)).to.equal(0n);
            await mine();
            expect(await this.token.getPastVotes(this.holder, timepoint)).to.equal(supply);
          });

          it('delegation without balance', async function () {
            expect(await this.token.delegates(this.holder)).to.equal(ethers.ZeroAddress);

            await expect(this.token.connect(this.holder).delegate(this.holder))
              .to.emit(this.token, 'DelegateChanged')
              .withArgs(this.holder, ethers.ZeroAddress, this.holder)
              .to.not.emit(this.token, 'DelegateVotesChanged');

            expect(await this.token.delegates(this.holder)).to.equal(this.holder);
          });
        });

        describe('with signature', function () {
          const nonce = 0n;

          beforeEach(async function () {
            await this.token.$_mint(this.holder, supply);
          });

          it('accept signed delegation', async function () {
            const { r, s, v } = await this.holder
              .signTypedData(
                this.domain,
                { Delegation },
                {
                  delegatee: this.holder.address,
                  nonce,
                  expiry: ethers.MaxUint256,
                },
              )
              .then(ethers.Signature.from);

            expect(await this.token.delegates(this.holder)).to.equal(ethers.ZeroAddress);

            const tx = await this.token.delegateBySig(this.holder, nonce, ethers.MaxUint256, v, r, s);
            const timepoint = await time.clockFromReceipt[mode](tx);

            await expect(tx)
              .to.emit(this.token, 'DelegateChanged')
              .withArgs(this.holder, ethers.ZeroAddress, this.holder)
              .to.emit(this.token, 'DelegateVotesChanged')
              .withArgs(this.holder, 0n, supply);

            expect(await this.token.delegates(this.holder)).to.equal(this.holder);

            expect(await this.token.getVotes(this.holder)).to.equal(supply);
            expect(await this.token.getPastVotes(this.holder, timepoint - 1n)).to.equal(0n);
            await mine();
            expect(await this.token.getPastVotes(this.holder, timepoint)).to.equal(supply);
          });

          it('rejects reused signature', async function () {
            const { r, s, v } = await this.holder
              .signTypedData(
                this.domain,
                { Delegation },
                {
                  delegatee: this.holder.address,
                  nonce,
                  expiry: ethers.MaxUint256,
                },
              )
              .then(ethers.Signature.from);

            await this.token.delegateBySig(this.holder, nonce, ethers.MaxUint256, v, r, s);

            await expect(this.token.delegateBySig(this.holder, nonce, ethers.MaxUint256, v, r, s))
              .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
              .withArgs(this.holder, nonce + 1n);
          });

          it('rejects bad delegatee', async function () {
            const { r, s, v } = await this.holder
              .signTypedData(
                this.domain,
                { Delegation },
                {
                  delegatee: this.holder.address,
                  nonce,
                  expiry: ethers.MaxUint256,
                },
              )
              .then(ethers.Signature.from);

            const tx = await this.token.delegateBySig(this.delegatee, nonce, ethers.MaxUint256, v, r, s);

            const { args } = await tx
              .wait()
              .then(receipt => receipt.logs.find(event => event.fragment.name == 'DelegateChanged'));
            expect(args[0]).to.not.equal(this.holder);
            expect(args[1]).to.equal(ethers.ZeroAddress);
            expect(args[2]).to.equal(this.delegatee);
          });

          it('rejects bad nonce', async function () {
            const { r, s, v, serialized } = await this.holder
              .signTypedData(
                this.domain,
                { Delegation },
                {
                  delegatee: this.holder.address,
                  nonce,
                  expiry: ethers.MaxUint256,
                },
              )
              .then(ethers.Signature.from);

            const recovered = ethers.verifyTypedData(
              this.domain,
              { Delegation },
              {
                delegatee: this.holder.address,
                nonce: nonce + 1n,
                expiry: ethers.MaxUint256,
              },
              serialized,
            );

            await expect(this.token.delegateBySig(this.holder, nonce + 1n, ethers.MaxUint256, v, r, s))
              .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
              .withArgs(recovered, nonce);
          });

          it('rejects expired permit', async function () {
            const expiry = (await time.clock.timestamp()) - time.duration.weeks(1);

            const { r, s, v } = await this.holder
              .signTypedData(
                this.domain,
                { Delegation },
                {
                  delegatee: this.holder.address,
                  nonce,
                  expiry,
                },
              )
              .then(ethers.Signature.from);

            await expect(this.token.delegateBySig(this.holder, nonce, expiry, v, r, s))
              .to.be.revertedWithCustomError(this.token, 'VotesExpiredSignature')
              .withArgs(expiry);
          });
        });
      });

      describe('change delegation', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.holder, supply);
          await this.token.connect(this.holder).delegate(this.holder);
        });

        it('call', async function () {
          expect(await this.token.delegates(this.holder)).to.equal(this.holder);

          const tx = await this.token.connect(this.holder).delegate(this.delegatee);
          const timepoint = await time.clockFromReceipt[mode](tx);

          await expect(tx)
            .to.emit(this.token, 'DelegateChanged')
            .withArgs(this.holder, this.holder, this.delegatee)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, supply, 0n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.delegatee, 0n, supply);

          expect(await this.token.delegates(this.holder)).to.equal(this.delegatee);

          expect(await this.token.getVotes(this.holder)).to.equal(0n);
          expect(await this.token.getVotes(this.delegatee)).to.equal(supply);
          expect(await this.token.getPastVotes(this.holder, timepoint - 1n)).to.equal(supply);
          expect(await this.token.getPastVotes(this.delegatee, timepoint - 1n)).to.equal(0n);
          await mine();
          expect(await this.token.getPastVotes(this.holder, timepoint)).to.equal(0n);
          expect(await this.token.getPastVotes(this.delegatee, timepoint)).to.equal(supply);
        });
      });

      describe('transfers', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.holder, supply);
        });

        it('no delegation', async function () {
          await expect(this.token.connect(this.holder).transfer(this.recipient, 1n))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.not.emit(this.token, 'DelegateVotesChanged');

          this.holderVotes = 0n;
          this.recipientVotes = 0n;
        });

        it('sender delegation', async function () {
          await this.token.connect(this.holder).delegate(this.holder);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, supply, supply - 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'DelegateVotesChanged');
          for (const event of logs.filter(event => event.fragment.name == 'Transfer')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = supply - 1n;
          this.recipientVotes = 0n;
        });

        it('receiver delegation', async function () {
          await this.token.connect(this.recipient).delegate(this.recipient);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 0n, 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'DelegateVotesChanged');
          for (const event of logs.filter(event => event.fragment.name == 'Transfer')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = 0n;
          this.recipientVotes = 1n;
        });

        it('full delegation', async function () {
          await this.token.connect(this.holder).delegate(this.holder);
          await this.token.connect(this.recipient).delegate(this.recipient);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, supply, supply - 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 0n, 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'DelegateVotesChanged');
          for (const event of logs.filter(event => event.fragment.name == 'Transfer')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = supply - 1n;
          this.recipientVotes = 1n;
        });

        afterEach(async function () {
          expect(await this.token.getVotes(this.holder)).to.equal(this.holderVotes);
          expect(await this.token.getVotes(this.recipient)).to.equal(this.recipientVotes);

          // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
          const timepoint = await time.clock[mode]();
          await mine();
          expect(await this.token.getPastVotes(this.holder, timepoint)).to.equal(this.holderVotes);
          expect(await this.token.getPastVotes(this.recipient, timepoint)).to.equal(this.recipientVotes);
        });
      });

      // The following tests are a adaptation of https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
      describe('Compound test suite', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.holder, supply);
        });

        describe('balanceOf', function () {
          it('grants to initial account', async function () {
            expect(await this.token.balanceOf(this.holder)).to.equal(supply);
          });
        });

        describe('numCheckpoints', function () {
          it('returns the number of checkpoints for a delegate', async function () {
            await this.token.connect(this.holder).transfer(this.recipient, 100n); //give an account a few tokens for readability
            expect(await this.token.numCheckpoints(this.other1)).to.equal(0n);

            const t1 = await this.token.connect(this.recipient).delegate(this.other1);
            t1.timepoint = await time.clockFromReceipt[mode](t1);
            expect(await this.token.numCheckpoints(this.other1)).to.equal(1n);

            const t2 = await this.token.connect(this.recipient).transfer(this.other2, 10);
            t2.timepoint = await time.clockFromReceipt[mode](t2);
            expect(await this.token.numCheckpoints(this.other1)).to.equal(2n);

            const t3 = await this.token.connect(this.recipient).transfer(this.other2, 10);
            t3.timepoint = await time.clockFromReceipt[mode](t3);
            expect(await this.token.numCheckpoints(this.other1)).to.equal(3n);

            const t4 = await this.token.connect(this.holder).transfer(this.recipient, 20);
            t4.timepoint = await time.clockFromReceipt[mode](t4);
            expect(await this.token.numCheckpoints(this.other1)).to.equal(4n);

            expect(await this.token.checkpoints(this.other1, 0n)).to.deep.equal([t1.timepoint, 100n]);
            expect(await this.token.checkpoints(this.other1, 1n)).to.deep.equal([t2.timepoint, 90n]);
            expect(await this.token.checkpoints(this.other1, 2n)).to.deep.equal([t3.timepoint, 80n]);
            expect(await this.token.checkpoints(this.other1, 3n)).to.deep.equal([t4.timepoint, 100n]);
            await mine();
            expect(await this.token.getPastVotes(this.other1, t1.timepoint)).to.equal(100n);
            expect(await this.token.getPastVotes(this.other1, t2.timepoint)).to.equal(90n);
            expect(await this.token.getPastVotes(this.other1, t3.timepoint)).to.equal(80n);
            expect(await this.token.getPastVotes(this.other1, t4.timepoint)).to.equal(100n);
          });

          it('does not add more than one checkpoint in a block', async function () {
            await this.token.connect(this.holder).transfer(this.recipient, 100n);
            expect(await this.token.numCheckpoints(this.other1)).to.equal(0n);

            const [t1, t2, t3] = await batchInBlock([
              () => this.token.connect(this.recipient).delegate(this.other1, { gasLimit: 200000 }),
              () => this.token.connect(this.recipient).transfer(this.other2, 10n, { gasLimit: 200000 }),
              () => this.token.connect(this.recipient).transfer(this.other2, 10n, { gasLimit: 200000 }),
            ]);
            t1.timepoint = await time.clockFromReceipt[mode](t1);
            t2.timepoint = await time.clockFromReceipt[mode](t2);
            t3.timepoint = await time.clockFromReceipt[mode](t3);

            expect(await this.token.numCheckpoints(this.other1)).to.equal(1);
            expect(await this.token.checkpoints(this.other1, 0n)).to.be.deep.equal([t1.timepoint, 80n]);

            const t4 = await this.token.connect(this.holder).transfer(this.recipient, 20n);
            t4.timepoint = await time.clockFromReceipt[mode](t4);

            expect(await this.token.numCheckpoints(this.other1)).to.equal(2n);
            expect(await this.token.checkpoints(this.other1, 1n)).to.be.deep.equal([t4.timepoint, 100n]);
          });
        });

        describe('getPastVotes', function () {
          it('reverts if block number >= current block', async function () {
            const clock = await this.token.clock();
            await expect(this.token.getPastVotes(this.other1, 50_000_000_000n))
              .to.be.revertedWithCustomError(this.token, 'ERC5805FutureLookup')
              .withArgs(50_000_000_000n, clock);
          });

          it('returns 0 if there are no checkpoints', async function () {
            expect(await this.token.getPastVotes(this.other1, 0n)).to.equal(0n);
          });

          it('returns the latest block if >= last checkpoint block', async function () {
            const tx = await this.token.connect(this.holder).delegate(this.other1);
            const timepoint = await time.clockFromReceipt[mode](tx);
            await mine(2);

            expect(await this.token.getPastVotes(this.other1, timepoint)).to.equal(supply);
            expect(await this.token.getPastVotes(this.other1, timepoint + 1n)).to.equal(supply);
          });

          it('returns zero if < first checkpoint block', async function () {
            await mine();
            const tx = await this.token.connect(this.holder).delegate(this.other1);
            const timepoint = await time.clockFromReceipt[mode](tx);
            await mine(2);

            expect(await this.token.getPastVotes(this.other1, timepoint - 1n)).to.equal(0n);
            expect(await this.token.getPastVotes(this.other1, timepoint + 1n)).to.equal(supply);
          });

          it('generally returns the voting balance at the appropriate checkpoint', async function () {
            const t1 = await this.token.connect(this.holder).delegate(this.other1);
            await mine(2);
            const t2 = await this.token.connect(this.holder).transfer(this.other2, 10);
            await mine(2);
            const t3 = await this.token.connect(this.holder).transfer(this.other2, 10);
            await mine(2);
            const t4 = await this.token.connect(this.other2).transfer(this.holder, 20);
            await mine(2);

            t1.timepoint = await time.clockFromReceipt[mode](t1);
            t2.timepoint = await time.clockFromReceipt[mode](t2);
            t3.timepoint = await time.clockFromReceipt[mode](t3);
            t4.timepoint = await time.clockFromReceipt[mode](t4);

            expect(await this.token.getPastVotes(this.other1, t1.timepoint - 1n)).to.equal(0n);
            expect(await this.token.getPastVotes(this.other1, t1.timepoint)).to.equal(supply);
            expect(await this.token.getPastVotes(this.other1, t1.timepoint + 1n)).to.equal(supply);
            expect(await this.token.getPastVotes(this.other1, t2.timepoint)).to.equal(supply - 10n);
            expect(await this.token.getPastVotes(this.other1, t2.timepoint + 1n)).to.equal(supply - 10n);
            expect(await this.token.getPastVotes(this.other1, t3.timepoint)).to.equal(supply - 20n);
            expect(await this.token.getPastVotes(this.other1, t3.timepoint + 1n)).to.equal(supply - 20n);
            expect(await this.token.getPastVotes(this.other1, t4.timepoint)).to.equal(supply);
            expect(await this.token.getPastVotes(this.other1, t4.timepoint + 1n)).to.equal(supply);
          });
        });
      });

      describe('getPastTotalSupply', function () {
        beforeEach(async function () {
          await this.token.connect(this.holder).delegate(this.holder);
        });

        it('reverts if block number >= current block', async function () {
          const clock = await this.token.clock();
          await expect(this.token.getPastTotalSupply(50_000_000_000n))
            .to.be.revertedWithCustomError(this.token, 'ERC5805FutureLookup')
            .withArgs(50_000_000_000n, clock);
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.token.getPastTotalSupply(0n)).to.equal(0n);
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const tx = await this.token.$_mint(this.holder, supply);
          const timepoint = await time.clockFromReceipt[mode](tx);
          await mine(2);

          expect(await this.token.getPastTotalSupply(timepoint)).to.equal(supply);
          expect(await this.token.getPastTotalSupply(timepoint + 1n)).to.equal(supply);
        });

        it('returns zero if < first checkpoint block', async function () {
          await mine();
          const tx = await this.token.$_mint(this.holder, supply);
          const timepoint = await time.clockFromReceipt[mode](tx);
          await mine(2);

          expect(await this.token.getPastTotalSupply(timepoint - 1n)).to.equal(0n);
          expect(await this.token.getPastTotalSupply(timepoint + 1n)).to.equal(supply);
        });

        it('generally returns the voting balance at the appropriate checkpoint', async function () {
          const t1 = await this.token.$_mint(this.holder, supply);
          await mine(2);
          const t2 = await this.token.$_burn(this.holder, 10n);
          await mine(2);
          const t3 = await this.token.$_burn(this.holder, 10n);
          await mine(2);
          const t4 = await this.token.$_mint(this.holder, 20n);
          await mine(2);

          t1.timepoint = await time.clockFromReceipt[mode](t1);
          t2.timepoint = await time.clockFromReceipt[mode](t2);
          t3.timepoint = await time.clockFromReceipt[mode](t3);
          t4.timepoint = await time.clockFromReceipt[mode](t4);

          expect(await this.token.getPastTotalSupply(t1.timepoint - 1n)).to.equal(0n);
          expect(await this.token.getPastTotalSupply(t1.timepoint)).to.equal(supply);
          expect(await this.token.getPastTotalSupply(t1.timepoint + 1n)).to.equal(supply);
          expect(await this.token.getPastTotalSupply(t2.timepoint)).to.equal(supply - 10n);
          expect(await this.token.getPastTotalSupply(t2.timepoint + 1n)).to.equal(supply - 10n);
          expect(await this.token.getPastTotalSupply(t3.timepoint)).to.equal(supply - 20n);
          expect(await this.token.getPastTotalSupply(t3.timepoint + 1n)).to.equal(supply - 20n);
          expect(await this.token.getPastTotalSupply(t4.timepoint)).to.equal(supply);
          expect(await this.token.getPastTotalSupply(t4.timepoint + 1n)).to.equal(supply);
        });
      });
    });
  }
});
