const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, Delegation, MultiDelegation } = require('../../../helpers/eip712');
const { batchInBlock } = require('../../../helpers/txpool');
const time = require('../../../helpers/time');

const { shouldBehaveLikeMultiVotes } = require('../../../governance/utils/MultiVotes.behavior');

const TOKENS = [
  { Token: '$ERC20MultiVotes', mode: 'blocknumber' },
  { Token: '$ERC20MultiVotesTimestampMock', mode: 'timestamp' },
];

const name = 'My Token';
const symbol = 'MTKN';
const version = '1';
const supply = ethers.parseEther('10000000');

describe('ERC20MultiVotes', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      // accounts is required by shouldBehaveLikeMultiVotes
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
      shouldBehaveLikeMultiVotes([1, 17, 42], { mode, fungible: true });

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

      it('initial free units is 0', async function () {
        expect(await this.token.getFreeUnits(this.holder)).to.equal(0);
      });

      describe('set defaulted delegation', function () {
        describe('call', function () {
          it('defaulted delegation with balance', async function () {
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

          it('defaulted delegation without balance', async function () {
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

      describe('set partial delegation', function () {
        describe('call', function () {
          it('partial delegation with balance', async function () {
            await this.token.$_mint(this.holder, supply);
            expect(await this.token.getDelegatedUnits(this.holder, this.holder)).to.equal(0);

            const tx = await this.token.multiDelegate([this.holder], [supply]);
            const timepoint = await time.clockFromReceipt[mode](tx);

            await expect(tx)
              .to.emit(this.token, 'DelegateModified')
              .withArgs(this.holder, this.holder, 0, supply)
              .to.emit(this.token, 'DelegateVotesChanged')
              .withArgs(this.holder, 0n, supply);

            let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
            expect([...multiDelegates]).to.have.members([this.holder.address]);
            expect(await this.token.getDelegatedUnits(this.holder, this.holder)).to.equal(supply);
            expect(await this.token.getVotes(this.holder)).to.equal(supply);
            expect(await this.token.getPastVotes(this.holder, timepoint - 1n)).to.equal(0n);
            await mine();
            expect(await this.token.getPastVotes(this.holder, timepoint)).to.equal(supply);
          });

          it('partial delegation without balance', async function () {
            await expect(this.token.multiDelegate([this.holder], [supply]))
              .to.revertedWithCustomError(this.token, 'MultiVotesExceededAvailableUnits')
              .withArgs(supply, 0);
          });

          describe('with signature', function () {
            const nonce = 0n;

            const MULTI_DELEGATION_TYPE =
              'MultiDelegation(address[] delegatees,uint256[] units,uint256 nonce,uint256 expiry)';
            const MULTI_DELEGATION_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(MULTI_DELEGATION_TYPE));
            const abiCoder = new ethers.AbiCoder();
            const getSigner = (delegatees, units, nonce, expiry, v, r, s, domain) => {
              const delegatesHash = ethers.keccak256(ethers.solidityPacked(['address[]'], [delegatees]));
              const unitsHash = ethers.keccak256(ethers.solidityPacked(['uint256[]'], [units]));
              const structHash = ethers.keccak256(
                abiCoder.encode(
                  ['bytes32', 'bytes32', 'bytes32', 'uint256', 'uint256'],
                  [MULTI_DELEGATION_TYPEHASH, delegatesHash, unitsHash, nonce, expiry],
                ),
              );
              const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
              const digest = ethers.keccak256(
                ethers.solidityPacked(['string', 'bytes32', 'bytes32'], ['\x19\x01', domainSeparator, structHash]),
              );
              return ethers.recoverAddress(digest, { v, r, s });
            };

            beforeEach(async function () {
              await this.token.$_mint(this.holder, supply);
            });

            it('accept signed partial delegation', async function () {
              const { r, s, v } = await this.holder
                .signTypedData(
                  this.domain,
                  { MultiDelegation },
                  {
                    delegatees: [this.delegatee.address],
                    units: [supply],
                    nonce,
                    expiry: ethers.MaxUint256,
                  },
                )
                .then(ethers.Signature.from);

              const tx = await this.token.multiDelegateBySig(
                [this.delegatee],
                [supply],
                nonce,
                ethers.MaxUint256,
                v,
                r,
                s,
              );
              const timepoint = await time.clockFromReceipt[mode](tx);

              await expect(tx)
                .to.emit(this.token, 'DelegateModified')
                .withArgs(this.holder, this.delegatee, 0, supply)
                .to.emit(this.token, 'DelegateVotesChanged')
                .withArgs(this.delegatee, 0, supply);

              let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
              expect([...multiDelegates]).to.have.members([this.delegatee.address]);
              expect(await this.token.getDelegatedUnits(this.holder, this.delegatee)).to.equal(supply);

              expect(await this.token.getVotes(this.holder.address)).to.equal(0n);
              expect(await this.token.getVotes(this.delegatee)).to.equal(supply);
              expect(await this.token.getPastVotes(this.delegatee, timepoint - 3n)).to.equal(0n);
              await mine();
              expect(await this.token.getPastVotes(this.delegatee, timepoint)).to.equal(supply);
            });

            it('rejects reused signature', async function () {
              const { r, s, v } = await this.holder
                .signTypedData(
                  this.domain,
                  { MultiDelegation },
                  {
                    delegatees: [this.delegatee.address],
                    units: [supply],
                    nonce,
                    expiry: ethers.MaxUint256,
                  },
                )
                .then(ethers.Signature.from);

              await this.token.multiDelegateBySig([this.delegatee], [supply], nonce, ethers.MaxUint256, v, r, s);

              await expect(this.token.multiDelegateBySig([this.delegatee], [supply], nonce, ethers.MaxUint256, v, r, s))
                .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
                .withArgs(this.holder, nonce + 1n);
            });

            it('rejects bad delegatees', async function () {
              const { r, s, v } = await this.holder
                .signTypedData(
                  this.domain,
                  { MultiDelegation },
                  {
                    delegatees: [this.delegatee.address],
                    units: [supply],
                    nonce,
                    expiry: ethers.MaxUint256,
                  },
                )
                .then(ethers.Signature.from);

              const badSigner = getSigner(
                [this.other.address],
                [supply],
                nonce,
                ethers.MaxUint256,
                v,
                r,
                s,
                this.domain,
              );
              await this.token.$_mint(badSigner, supply);

              const tx = await this.token.multiDelegateBySig([this.other], [supply], nonce, ethers.MaxUint256, v, r, s);
              const receipt = await tx.wait();

              const [delegateModified] = receipt.logs.filter(
                log => this.token.interface.parseLog(log)?.name === 'DelegateModified',
              );
              const [delegateVotesChanged] = receipt.logs.filter(
                log => this.token.interface.parseLog(log)?.name === 'DelegateVotesChanged',
              );

              const log1 = this.token.interface.parseLog(delegateModified);
              expect(log1.args.delegator).to.not.be.equal(this.holder);
              expect(log1.args.delegate).to.equal(this.other);
              expect(log1.args.fromUnits).to.equal(0);
              expect(log1.args.toUnits).to.equal(supply);

              const log2 = this.token.interface.parseLog(delegateVotesChanged);
              expect(log2.args.delegate).to.equal(this.other);
              expect(log2.args.previousVotes).to.equal(0);
              expect(log2.args.newVotes).to.equal(supply);

              let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
              expect([...multiDelegates]).to.have.members([]);
              expect(await this.token.getDelegatedUnits(this.holder, this.other)).to.equal(0);
              expect(await this.token.getVotes(this.other.address)).to.equal(supply);
            });

            it('rejects bad units', async function () {
              const { r, s, v } = await this.holder
                .signTypedData(
                  this.domain,
                  { MultiDelegation },
                  {
                    delegatees: [this.delegatee.address],
                    units: [supply],
                    nonce,
                    expiry: ethers.MaxUint256,
                  },
                )
                .then(ethers.Signature.from);

              const badSigner = getSigner(
                [this.delegatee.address],
                [supply - 1n],
                nonce,
                ethers.MaxUint256,
                v,
                r,
                s,
                this.domain,
              );
              await this.token.$_mint(badSigner, supply);

              const tx = await this.token.multiDelegateBySig(
                [this.delegatee],
                [supply - 1n],
                nonce,
                ethers.MaxUint256,
                v,
                r,
                s,
              );
              const receipt = await tx.wait();

              const [delegateModified] = receipt.logs.filter(
                log => this.token.interface.parseLog(log)?.name === 'DelegateModified',
              );
              const [delegateVotesChanged] = receipt.logs.filter(
                log => this.token.interface.parseLog(log)?.name === 'DelegateVotesChanged',
              );

              const log1 = this.token.interface.parseLog(delegateModified);
              expect(log1).to.exist;
              expect(log1.args.delegator).to.not.be.equal(this.holder);
              expect(log1.args.delegate).to.equal(this.delegatee);
              expect(log1.args.fromUnits).to.equal(0);
              expect(log1.args.toUnits).to.equal(supply - 1n);

              const log2 = this.token.interface.parseLog(delegateVotesChanged);
              expect(log2).to.exist;
              expect(log2.args.delegate).to.equal(this.delegatee);
              expect(log2.args.previousVotes).to.equal(0);
              expect(log2.args.newVotes).to.equal(supply - 1n);

              let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
              expect([...multiDelegates]).to.have.members([]);
              expect(await this.token.getDelegatedUnits(this.holder, this.delegatee)).to.equal(0);
              expect(await this.token.getVotes(this.delegatee.address)).to.equal(supply - 1n);
            });

            it('rejects bad nonce', async function () {
              const { r, s, v } = await this.holder
                .signTypedData(
                  this.domain,
                  { MultiDelegation },
                  {
                    delegatees: [this.delegatee.address],
                    units: [supply],
                    nonce: nonce + 1n,
                    expiry: ethers.MaxUint256,
                  },
                )
                .then(ethers.Signature.from);

              await expect(
                this.token.multiDelegateBySig([this.delegatee], [supply], nonce + 1n, ethers.MaxUint256, v, r, s),
              )
                .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
                .withArgs(this.holder, 0);
            });

            it('rejects expired permit', async function () {
              const expiry = (await time.clock.timestamp()) - 1n;
              const { r, s, v } = await this.holder
                .signTypedData(
                  this.domain,
                  { MultiDelegation },
                  {
                    delegatees: [this.delegatee.address],
                    units: [supply],
                    nonce,
                    expiry: expiry,
                  },
                )
                .then(ethers.Signature.from);

              await expect(this.token.multiDelegateBySig([this.delegatee], [supply], nonce, expiry, v, r, s))
                .to.be.revertedWithCustomError(this.token, 'VotesExpiredSignature')
                .withArgs(expiry);
            });
          });
        });
      });

      describe('change defaulted delegation', function () {
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

      describe('change partial delegation', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.holder, supply);
          await this.token.connect(this.holder).multiDelegate([this.delegatee], [supply / 2n]);
        });

        describe('call', async function () {
          it('increment units', async function () {
            const tx = await this.token.connect(this.holder).multiDelegate([this.delegatee], [supply - supply / 4n]);

            await expect(tx)
              .to.emit(this.token, 'DelegateModified')
              .withArgs(this.holder, this.delegatee, supply / 2n, supply - supply / 4n)
              .to.emit(this.token, 'DelegateVotesChanged')
              .withArgs(this.delegatee, supply / 2n, supply - supply / 4n);

            let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
            expect([...multiDelegates]).to.have.members([this.delegatee.address]);
            expect(await this.token.getDelegatedUnits(this.holder, this.delegatee)).to.equal(supply - supply / 4n);
            expect(await this.token.getVotes(this.delegatee)).to.equal(supply - supply / 4n);

            this.delegateeVotes = supply - supply / 4n;
          });

          it('decrement units', async function () {
            const tx = await this.token.connect(this.holder).multiDelegate([this.delegatee], [supply / 4n]);

            await expect(tx)
              .to.emit(this.token, 'DelegateModified')
              .withArgs(this.holder, this.delegatee, supply / 2n, supply / 4n)
              .to.emit(this.token, 'DelegateVotesChanged')
              .withArgs(this.delegatee, supply / 2n, supply / 4n);

            let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
            expect([...multiDelegates]).to.have.members([this.delegatee.address]);
            expect(await this.token.getDelegatedUnits(this.holder, this.delegatee)).to.equal(supply / 4n);
            expect(await this.token.getVotes(this.delegatee)).to.equal(supply / 4n);

            this.delegateeVotes = supply / 4n;
          });

          it('remove', async function () {
            const tx = await this.token.connect(this.holder).multiDelegate([this.delegatee], [0]);

            await expect(tx)
              .to.emit(this.token, 'DelegateModified')
              .withArgs(this.holder, this.delegatee, supply / 2n, 0)
              .to.emit(this.token, 'DelegateVotesChanged')
              .withArgs(this.delegatee, supply / 2n, 0);

            let multiDelegates = await this.token.multiDelegates(this.holder, 0, 100);
            expect([...multiDelegates]).to.have.members([]);
            expect(await this.token.getDelegatedUnits(this.holder, this.delegatee)).to.equal(0);
            expect(await this.token.getVotes(this.delegatee)).to.equal(0);

            this.delegateeVotes = 0;
          });

          afterEach(async function () {
            expect(await this.token.getVotes(this.delegatee)).to.equal(this.delegateeVotes);

            // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
            const timepoint = await time.clock[mode]();
            await mine();
            expect(await this.token.getPastVotes(this.delegatee, timepoint)).to.equal(this.delegateeVotes);
          });
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

        it('0 with sender/receiver defaulted', async function () {
          await this.token.connect(this.holder).delegate(this.holder);
          await this.token.connect(this.recipient).delegate(this.recipient);

          await expect(this.token.connect(this.holder).transfer(this.recipient, 0n))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 0n)
            .to.not.emit(this.token, 'DelegateVotesChanged');

          this.holderVotes = supply;
          this.recipientVotes = 0n;
        });

        it('0 with sender/receiver partial', async function () {
          await this.token.connect(this.holder).transfer(this.recipient, 100n);
          await this.token.connect(this.recipient).multiDelegate([this.recipient], [50]);
          await this.token.connect(this.holder).multiDelegate([this.holder], [supply / 2n]);

          await expect(this.token.connect(this.holder).transfer(this.recipient, 0n))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 0n)
            .to.not.emit(this.token, 'DelegateVotesChanged');

          this.holderVotes = supply / 2n;
          this.recipientVotes = 50n;
        });

        it('sender defaulted delegation', async function () {
          await this.token.connect(this.holder).delegate(this.holder);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, supply, supply - 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'Transfer');
          for (const event of logs.filter(event => event.fragment.name == 'DelegateVotesChanged')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = supply - 1n;
          this.recipientVotes = 0n;
        });

        it('sender partial full delegation', async function () {
          await this.token.connect(this.holder).multiDelegate([this.holder], [supply]);

          const tx = this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx).to.revertedWithCustomError(this.token, 'MultiVotesExceededAvailableUnits').withArgs(1, 0);

          this.holderVotes = supply;
          this.recipientVotes = 0n;
        });

        it('sender partial delegation', async function () {
          await this.token.connect(this.holder).multiDelegate([this.holder], [supply / 2n]);

          const tx = this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.not.emit(this.token, 'DelegateVotesChanged');

          this.holderVotes = supply / 2n;
          this.recipientVotes = 0n;
        });

        it('receiver defaulted delegation', async function () {
          await this.token.connect(this.recipient).delegate(this.recipient);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 0n, 1n);

          const { logs } = await tx.wait();
          const { index } = logs.find(event => event.fragment.name == 'Transfer');
          for (const event of logs.filter(event => event.fragment.name == 'DelegateVotesChanged')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = 0n;
          this.recipientVotes = 1n;
        });

        it('receiver partial full delegation', async function () {
          await this.token.connect(this.holder).transfer(this.recipient, 100n);
          await this.token.connect(this.recipient).multiDelegate([this.recipient], [100]);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.not.emit(this.token, 'DelegateVotesChanged');

          const tx1 = this.token.connect(this.recipient).multiDelegate([this.other], [2]);
          await expect(tx1).to.revertedWithCustomError(this.token, 'MultiVotesExceededAvailableUnits').withArgs(2, 1);

          const tx2 = await this.token.connect(this.recipient).multiDelegate([this.other], [1]);
          await expect(tx2)
            .to.emit(this.token, 'DelegateModified')
            .withArgs(this.recipient, this.other, 0, 1)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.other, 0, 1);

          this.holderVotes = 0n;
          this.recipientVotes = 100n;
        });

        it('receiver partial delegation', async function () {
          await this.token.connect(this.holder).transfer(this.recipient, 100n);
          await this.token.connect(this.recipient).multiDelegate([this.recipient], [50]);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.not.emit(this.token, 'DelegateVotesChanged');

          const tx1 = await this.token.connect(this.recipient).multiDelegate([this.other], [51]);
          await expect(tx1)
            .to.emit(this.token, 'DelegateModified')
            .withArgs(this.recipient, this.other, 0, 51)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.other, 0, 51);

          this.holderVotes = 0n;
          this.recipientVotes = 50n;
        });

        it('sender defaulted and partial full delegation', async function () {
          await this.token.connect(this.holder).multiDelegate([this.holder], [supply]);
          await this.token.connect(this.holder).delegate(this.holder);

          const tx = this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx).to.revertedWithCustomError(this.token, 'MultiVotesExceededAvailableUnits').withArgs(1, 0);

          this.holderVotes = supply;
          this.recipientVotes = 0;
        });

        it('sender defaulted and partial delegation', async function () {
          await this.token.connect(this.holder).delegate(this.holder);
          await this.token.connect(this.holder).multiDelegate([this.holder], [supply / 2n]);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, supply, supply - 1n);

          this.holderVotes = supply - 1n;
          this.recipientVotes = 0;
        });

        it('receiver defaulted and partial full delegation', async function () {
          await this.token.connect(this.holder).transfer(this.recipient, 100n);
          await this.token.connect(this.recipient).multiDelegate([this.recipient], [100]);
          await this.token.connect(this.recipient).delegate(this.recipient);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 100, 101);

          const tx1 = this.token.connect(this.recipient).transfer(this.other, 2n);
          await expect(tx1).to.revertedWithCustomError(this.token, 'MultiVotesExceededAvailableUnits').withArgs(2, 1);

          const tx2 = await this.token.connect(this.recipient).transfer(this.other, 1n);
          await expect(tx2)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.recipient, this.other, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 101, 100);

          this.holderVotes = 0;
          this.recipientVotes = 100;
        });

        it('receiver defaulted and partial delegation', async function () {
          await this.token.connect(this.holder).transfer(this.recipient, 100n);
          await this.token.connect(this.recipient).multiDelegate([this.recipient], [50]);
          await this.token.connect(this.recipient).delegate(this.recipient);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 100, 101);

          const tx1 = await this.token.connect(this.recipient).transfer(this.other, 51n);
          await expect(tx1)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.recipient, this.other, 51n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 101, 50);

          this.holderVotes = 0;
          this.recipientVotes = 50;
        });

        it('sender and receiver defaulted delegation', async function () {
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
          const { index } = logs.find(event => event.fragment.name == 'Transfer');
          for (const event of logs.filter(event => event.fragment.name == 'DelegateVotesChanged')) {
            expect(event.index).to.lt(index);
          }

          this.holderVotes = supply - 1n;
          this.recipientVotes = 1n;
        });

        it('sender and receiver defaulted + partial delegation', async function () {
          await this.token.connect(this.holder).transfer(this.recipient, 100n);
          await this.token.connect(this.recipient).multiDelegate([this.recipient], [50]);
          await this.token.connect(this.recipient).delegate(this.recipient);

          await this.token.connect(this.holder).multiDelegate([this.holder], [supply / 2n]);
          await this.token.connect(this.holder).delegate(this.holder);

          const tx = await this.token.connect(this.holder).transfer(this.recipient, 1n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.recipient, 1n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.holder, supply - 100n, supply - 101n)
            .to.emit(this.token, 'DelegateVotesChanged')
            .withArgs(this.recipient, 100, 101);

          this.holderVotes = supply - 101n;
          this.recipientVotes = 101;
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
