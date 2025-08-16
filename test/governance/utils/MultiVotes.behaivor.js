const { ethers } = require('hardhat');
const { expect } = require('chai');
const { mine } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, MultiDelegation } = require('../../helpers/eip712');
const time = require('../../helpers/time');

const { shouldBehaveLikeVotes } = require('./Votes.behavior');

const MULTI_DELEGATION_TYPE = "MultiDelegation(address[] delegatees,uint256[] units,uint256 nonce,uint256 expiry)";
const MULTI_DELEGATION_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(MULTI_DELEGATION_TYPE));
const abiCoder = new ethers.AbiCoder();
const getSigner = (delegatees, units, nonce, expiry, v, r, s, domain) => {
  const delegatesHash = ethers.keccak256(ethers.solidityPacked(["address[]"], [delegatees]));
  const unitsHash = ethers.keccak256(ethers.solidityPacked(["uint256[]"], [units]));
  const structHash = ethers.keccak256(
    abiCoder.encode(
      ["bytes32", "bytes32", "bytes32", "uint256", "uint256"],
      [MULTI_DELEGATION_TYPEHASH, delegatesHash, unitsHash, nonce, expiry]
    )
  );
  const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
  const digest = ethers.keccak256(
    ethers.solidityPacked(
      ["string", "bytes32", "bytes32"],
      ["\x19\x01", domainSeparator, structHash]
    )
  );
  return ethers.recoverAddress(digest, { v, r, s });
}

function shouldBehaveLikeMultiVotes(tokens, { mode = 'blocknumber', fungible = true }) {
  beforeEach(async function () {
    [this.delegator, this.delegatee, this.bob, this.alice, this.other] = this.accounts;
    this.domain = await getDomain(this.votes);
  });

  shouldBehaveLikeVotes(tokens, {mode, fungible});

  describe('run multivotes workflow', function () {
    beforeEach(async function () {
      await mine();
      await this.votes.$_mint(this.delegator, 110);
      await this.votes.$_mint(this.bob, 110);    
      await this.votes.$_burn(this.delegator, 10);
      await this.votes.$_burn(this.bob, 10);
    });

    it('not exhisting delegates has zero assigned units', async function () {
      expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.be.equal(0);
    });

    it('defaulted delegate starts with zero address', async function () {
      expect(await this.votes.delegates(this.delegator)).to.equal("0x0000000000000000000000000000000000000000");
    });

    describe('delegation with signature', function () {

      it('rejects delegates and units mismatch', async function () {
        expect(this.votes.connect(this.delegator).multiDelegate([this.delegatee], [1, 15]))
        .to.be.revertedWithCustomError(this.votes, 'MultiVotesDelegatesAndUnitsMismatch')
        .withArgs(1, 2);

        expect(this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1]))
        .to.be.revertedWithCustomError(this.votes, 'MultiVotesDelegatesAndUnitsMismatch')
        .withArgs(2, 1);
      });

      it('rejects no delegates given', async function () {
        await expect(this.votes.connect(this.delegator).multiDelegate([], []))
        .to.be.revertedWithCustomError(this.votes, 'MultiVotesNoDelegatesGiven');
      });

      it('rejects delegation exceeding avaiable units', async function () {
        await expect(this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [90, 15]))
        .to.be.revertedWithCustomError(this.votes, 'MultiVotesExceededAvailableUnits')
        .withArgs(105, 100);
      });

      it('partial delegation', async function () {
        const tx = await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1, 15]);
        await expect(tx)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.delegator, this.delegatee, 0, 1)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.delegator, this.bob, 0, 15)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.delegatee, 0, 1)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.bob, 0, 15);

        let multiDelegates = await this.votes.multiDelegates(this.delegator);
        expect([...multiDelegates]).to.have.members([this.delegatee.address, this.bob.address]);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(1);
        expect(await this.votes.getDelegatedUnits(this.delegator, this.bob)).to.equal(15);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(84);
        
        expect(await this.votes.getVotes(this.delegatee)).to.equal(1);
        expect(await this.votes.getVotes(this.bob)).to.equal(15);
      });

      it('partial delegation stacking', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1, 15]);
        const tx = await this.votes.connect(this.delegator).multiDelegate([this.alice], [20])
        await expect(tx)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.delegator, this.alice, 0, 20)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.alice, 0, 20)

        let multiDelegates = await this.votes.multiDelegates(this.delegator);
        expect([...multiDelegates]).to.have.members([this.delegatee.address, this.bob.address, this.alice.address]);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(1);
        expect(await this.votes.getDelegatedUnits(this.delegator, this.bob)).to.equal(15);
        expect(await this.votes.getDelegatedUnits(this.delegator, this.alice)).to.equal(20);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(64);

        expect(await this.votes.getVotes(this.delegatee)).to.equal(1);
        expect(await this.votes.getVotes(this.bob)).to.equal(15);
        expect(await this.votes.getVotes(this.alice)).to.equal(20);
      })

      it('partial delegation votes stacking', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.alice], [20]);
        const tx = await this.votes.connect(this.bob).multiDelegate([this.alice], [95]);
        await expect(tx)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.bob, this.alice, 0, 95)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.alice, 20, 115);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.alice)).to.equal(20);
        expect(await this.votes.getDelegatedUnits(this.bob, this.alice)).to.equal(95);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(80);
        expect(await this.votes.getFreeUnits(this.bob)).to.equal(5);

        expect(await this.votes.getVotes(this.alice)).to.equal(115);
      })

      it('partial delegation removal', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1, 15]);
        const tx = await this.votes.connect(this.delegator).multiDelegate([this.delegatee], [0]);
        await expect(tx)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.delegator, this.delegatee, 1, 0)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.delegatee, 1, 0)
        
        let multiDelegates = await this.votes.multiDelegates(this.delegator);
        expect([...multiDelegates]).to.have.members([this.bob.address]);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(0);
        expect(await this.votes.getDelegatedUnits(this.delegator, this.bob)).to.equal(15);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(85);

        expect(await this.votes.getVotes(this.delegatee)).to.equal(0);
        expect(await this.votes.getVotes(this.bob)).to.equal(15);
      });

      it('partial delegation units change', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1, 15]);
        const tx = await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [20, 10]);
        await expect(tx)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.delegator, this.delegatee, 1, 20)
          .to.emit(this.votes, 'DelegateModified')
          .withArgs(this.delegator, this.bob, 15, 10)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.delegatee, 1, 20)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.bob, 15, 10);

        let multiDelegates = await this.votes.multiDelegates(this.delegator);
        expect([...multiDelegates]).to.have.members([this.delegatee.address, this.bob.address]);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(20);
        expect(await this.votes.getDelegatedUnits(this.delegator, this.bob)).to.equal(10);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(70);

        expect(await this.votes.getVotes(this.delegatee)).to.equal(20);
        expect(await this.votes.getVotes(this.bob)).to.equal(10);
      });

      it('partial delegation unchanged', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.bob], [1, 15]);
        const tx = await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.other], [1, 0]);
        await expect(tx)
          .to.not.emit(this.votes, 'DelegateModified')
          .to.not.emit(this.votes, 'DelegateVotesChanged');

        let multiDelegates = await this.votes.multiDelegates(this.delegator);
        expect([...multiDelegates]).to.have.members([this.delegatee.address, this.bob.address]);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(1);
        expect(await this.votes.getDelegatedUnits(this.delegator, this.bob)).to.equal(15);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(84);

        expect(await this.votes.getVotes(this.delegatee)).to.equal(1);
        expect(await this.votes.getVotes(this.bob)).to.equal(15);
      });

      it('defaulted delegation', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.other], [10]);

        await expect(this.votes.connect(this.delegator).delegate(this.delegatee))
          .to.emit(this.votes, 'DelegateChanged')
          .withArgs(this.delegator, ethers.ZeroAddress, this.delegatee)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.delegatee, 0, 90);

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(0);
        expect(await this.votes.getVotes(this.delegatee)).to.equal(90);
      });

      it('defaulted delegation change', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.other], [10]);

        await this.votes.connect(this.delegator).delegate(this.delegatee);
        await expect(this.votes.connect(this.delegator).delegate(this.alice))
          .to.emit(this.votes, 'DelegateChanged')
          .withArgs(this.delegator, this.delegatee, this.alice)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.delegatee, 90, 0)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.alice, 0, 90)

        expect(await this.votes.getDelegatedUnits(this.delegator, this.other)).to.equal(10);
        expect(await this.votes.getVotes(this.delegatee)).to.equal(0);
        expect(await this.votes.getVotes(this.alice)).to.equal(90);
      });

      it('defaulted delegation alongside partial delegations', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.other], [5, 5]);
        await expect(this.votes.connect(this.delegator).delegate(this.delegatee))
          .to.emit(this.votes, 'DelegateChanged')
          .withArgs(this.delegator, ethers.ZeroAddress, this.delegatee)
          .to.emit(this.votes, 'DelegateVotesChanged')
          .withArgs(this.delegatee, 5, 95)

        expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(5);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(90);
        expect(await this.votes.getVotes(this.delegatee)).to.equal(95);
        expect(await this.votes.getVotes(ethers.ZeroAddress)).to.equal(0);
      });

      describe('with signature', function () {
        const nonce = 0n;

        it('accept signed partial delegation', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { MultiDelegation },
              {
                delegatees: [this.delegatee.address],
                units: [15],
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          const tx = await this.votes.multiDelegateBySig([this.delegatee], [15], nonce, ethers.MaxUint256, v, r, s);
          const timepoint = await time.clockFromReceipt[mode](tx);

          await expect(tx)
            .to.emit(this.votes, 'DelegateModified')
            .withArgs(this.delegator, this.delegatee, 0, 15)
            .to.emit(this.votes, 'DelegateVotesChanged')
            .withArgs(this.delegatee, 0, 15)

          let multiDelegates = await this.votes.multiDelegates(this.delegator);
          expect([...multiDelegates]).to.have.members([this.delegatee.address]);
          expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(15);

          expect(await this.votes.getVotes(this.delegator.address)).to.equal(0n);
          expect(await this.votes.getVotes(this.delegatee)).to.equal(15);
          expect(await this.votes.getPastVotes(this.delegatee, timepoint - 5n)).to.equal(0n);
          await mine();
          expect(await this.votes.getPastVotes(this.delegatee, timepoint)).to.equal(15);
        });

        it('rejects reused signature', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { MultiDelegation },
              {
                delegatees: [this.delegatee.address],
                units: [15],
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          await this.votes.multiDelegateBySig([this.delegatee], [15], nonce, ethers.MaxUint256, v, r, s);

          await expect(this.votes.multiDelegateBySig([this.delegatee], [15], nonce, ethers.MaxUint256, v, r, s))
            .to.be.revertedWithCustomError(this.votes, 'InvalidAccountNonce')
            .withArgs(this.delegator, nonce + 1n);
        });

        it('rejects bad delegatees', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { MultiDelegation },
              {
                delegatees: [this.delegatee.address],
                units: [15],
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          const badSigner = getSigner([this.other.address], [15], nonce, ethers.MaxUint256, v, r, s, this.domain);
          await this.votes.$_mint(badSigner, 100);

          const tx = await this.votes.multiDelegateBySig([this.other], [15], nonce, ethers.MaxUint256, v, r, s);
          const receipt = await tx.wait();

          const [delegateModified] = receipt.logs.filter(
            log => this.votes.interface.parseLog(log)?.name === 'DelegateModified',
          );
          const [delegateVotesChanged] = receipt.logs.filter(
            log => this.votes.interface.parseLog(log)?.name === 'DelegateVotesChanged',
          );

          const log1 = this.votes.interface.parseLog(delegateModified);
          expect(log1.args.delegator).to.not.be.equal(this.delegator);
          expect(log1.args.delegate).to.equal(this.other);
          expect(log1.args.fromUnits).to.equal(0);
          expect(log1.args.toUnits).to.equal(15);

          const log2 = this.votes.interface.parseLog(delegateVotesChanged);
          expect(log2.args.delegate).to.equal(this.other);
          expect(log2.args.previousVotes).to.equal(0);
          expect(log2.args.newVotes).to.equal(15);

          let multiDelegates = await this.votes.multiDelegates(this.delegator);
          expect([...multiDelegates]).to.have.members([]);
          expect(await this.votes.getDelegatedUnits(this.delegator, this.other)).to.equal(0);
          expect(await this.votes.getVotes(this.other.address)).to.equal(15);
        });

        it('rejects bad units', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { MultiDelegation },
              {
                delegatees: [this.delegatee.address],
                units: [15],
                nonce,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          const badSigner = getSigner([this.delegatee.address], [8], nonce, ethers.MaxUint256, v, r, s, this.domain);
          await this.votes.$_mint(badSigner, 100);

          const tx = await this.votes.multiDelegateBySig([this.delegatee], [8], nonce, ethers.MaxUint256, v, r, s);
          const receipt = await tx.wait();

          const [delegateModified] = receipt.logs.filter(
            log => this.votes.interface.parseLog(log)?.name === 'DelegateModified',
          );
          const [delegateVotesChanged] = receipt.logs.filter(
            log => this.votes.interface.parseLog(log)?.name === 'DelegateVotesChanged',
          );

          const log1 = this.votes.interface.parseLog(delegateModified);
          expect(log1).to.exist;
          expect(log1.args.delegator).to.not.be.equal(this.delegator);
          expect(log1.args.delegate).to.equal(this.delegatee);
          expect(log1.args.fromUnits).to.equal(0);
          expect(log1.args.toUnits).to.equal(8);

          const log2 = this.votes.interface.parseLog(delegateVotesChanged);
          expect(log2).to.exist;
          expect(log2.args.delegate).to.equal(this.delegatee);
          expect(log2.args.previousVotes).to.equal(0);
          expect(log2.args.newVotes).to.equal(8);

          let multiDelegates = await this.votes.multiDelegates(this.delegator);
          expect([...multiDelegates]).to.have.members([]);
          expect(await this.votes.getDelegatedUnits(this.delegator, this.delegatee)).to.equal(0);
          expect(await this.votes.getVotes(this.delegatee.address)).to.equal(8);
        });

        it('rejects bad nonce', async function () {
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { MultiDelegation },
              {
                delegatees: [this.delegatee.address],
                units: [15],
                nonce: nonce + 1n,
                expiry: ethers.MaxUint256,
              },
            )
            .then(ethers.Signature.from);

          await expect(this.votes.multiDelegateBySig([this.delegatee], [15], nonce + 1n, ethers.MaxUint256, v, r, s))
            .to.be.revertedWithCustomError(this.votes, 'InvalidAccountNonce')
            .withArgs(this.delegator, 0);
        });

        it('rejects expired permit', async function () {
          const expiry = (await time.clock.timestamp()) - 1n;
          const { r, s, v } = await this.delegator
            .signTypedData(
              this.domain,
              { MultiDelegation },
              {
                delegatees: [this.delegatee.address],
                units: [15],
                nonce,
                expiry: expiry,
              },
            )
            .then(ethers.Signature.from);

          await expect(this.votes.multiDelegateBySig([this.delegatee], [15], nonce, expiry, v, r, s))
            .to.be.revertedWithCustomError(this.votes, 'VotesExpiredSignature')
            .withArgs(expiry);
        });
      });
    })

    describe('burning', async function () {
      it('burns', async function () {
        await this.votes.$_burn(this.delegator, 50);
        expect(await this.votes.getFreeUnits(this.delegator)).to.equal(50);
        expect(await this.votes.$_getVotingUnits(this.delegator)).to.equal(50);
      })

      it('rejects more than avaiable burn', async function () {
        await expect(this.votes.$_burn(this.delegator, 101))
          .to.be.revertedWithCustomError(this.votes, 'MultiVotesExceededAvailableUnits')
          .withArgs(101, 100);
      })

      it('rejects burn of assigned units', async function () {
        await this.votes.connect(this.delegator).multiDelegate([this.delegatee, this.other], [5, 35]);
        await expect(this.votes.$_burn(this.delegator, 61))
          .to.be.revertedWithCustomError(this.votes, 'MultiVotesExceededAvailableUnits')
          .withArgs(61, 60);
      })
    })
  });
}

module.exports = {
  shouldBehaveLikeMultiVotes,
};
