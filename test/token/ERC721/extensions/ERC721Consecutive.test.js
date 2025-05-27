const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { sum } = require('../../../helpers/math');

const name = 'Non Fungible Token';
const symbol = 'NFT';

describe('ERC721Consecutive', function () {
  for (const offset of [0n, 1n, 42n]) {
    describe(`with offset ${offset}`, function () {
      async function fixture() {
        const accounts = await ethers.getSigners();
        const [alice, bruce, chris, receiver] = accounts;

        const batches = [
          { receiver: alice, amount: 0n },
          { receiver: alice, amount: 1n },
          { receiver: alice, amount: 2n },
          { receiver: bruce, amount: 5n },
          { receiver: chris, amount: 0n },
          { receiver: alice, amount: 7n },
        ];
        const delegates = [alice, chris];

        const token = await ethers.deployContract('$ERC721ConsecutiveMock', [
          name,
          symbol,
          offset,
          delegates,
          batches.map(({ receiver }) => receiver),
          batches.map(({ amount }) => amount),
        ]);

        return { accounts, alice, bruce, chris, receiver, batches, delegates, token };
      }

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      describe('minting during construction', function () {
        it('events are emitted at construction', async function () {
          let first = offset;
          for (const batch of this.batches) {
            if (batch.amount > 0) {
              await expect(this.token.deploymentTransaction())
                .to.emit(this.token, 'ConsecutiveTransfer')
                .withArgs(
                  first /* fromTokenId */,
                  first + batch.amount - 1n /* toTokenId */,
                  ethers.ZeroAddress /* fromAddress */,
                  batch.receiver /* toAddress */,
                );
            } else {
              // ".to.not.emit" only looks at event name, and doesn't check the parameters
            }
            first += batch.amount;
          }
        });

        it('ownership is set', async function () {
          const owners = [
            ...Array(Number(offset)).fill(ethers.ZeroAddress),
            ...this.batches.flatMap(({ receiver, amount }) => Array(Number(amount)).fill(receiver.address)),
          ];

          for (const tokenId in owners) {
            if (owners[tokenId] != ethers.ZeroAddress) {
              expect(await this.token.ownerOf(tokenId)).to.equal(owners[tokenId]);
            }
          }
        });

        it('balance & voting power are set', async function () {
          for (const account of this.accounts) {
            const balance =
              sum(...this.batches.filter(({ receiver }) => receiver === account).map(({ amount }) => amount)) ?? 0n;

            expect(await this.token.balanceOf(account)).to.equal(balance);

            // If not delegated at construction, check before + do delegation
            if (!this.delegates.includes(account)) {
              expect(await this.token.getVotes(account)).to.equal(0n);

              await this.token.connect(account).delegate(account);
            }

            // At this point all accounts should have delegated
            expect(await this.token.getVotes(account)).to.equal(balance);
          }
        });

        it('reverts on consecutive minting to the zero address', async function () {
          await expect(
            ethers.deployContract('$ERC721ConsecutiveMock', [
              name,
              symbol,
              offset,
              this.delegates,
              [ethers.ZeroAddress],
              [10],
            ]),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
            .withArgs(ethers.ZeroAddress);
        });
      });

      describe('minting after construction', function () {
        it('consecutive minting is not possible after construction', async function () {
          await expect(this.token.$_mintConsecutive(this.alice, 10)).to.be.revertedWithCustomError(
            this.token,
            'ERC721ForbiddenBatchMint',
          );
        });

        it('simple minting is possible after construction', async function () {
          const tokenId = sum(...this.batches.map(b => b.amount)) + offset;

          await expect(this.token.ownerOf(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(tokenId);

          await expect(this.token.$_mint(this.alice, tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.alice, tokenId);
        });

        it('cannot mint a token that has been batched minted', async function () {
          const tokenId = sum(...this.batches.map(b => b.amount)) + offset - 1n;

          expect(await this.token.ownerOf(tokenId)).to.not.equal(ethers.ZeroAddress);

          await expect(this.token.$_mint(this.alice, tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidSender')
            .withArgs(ethers.ZeroAddress);
        });
      });

      describe('ERC721 behavior', function () {
        const tokenId = offset + 1n;

        it('core takes over ownership on transfer', async function () {
          await this.token.connect(this.alice).transferFrom(this.alice, this.receiver, tokenId);

          expect(await this.token.ownerOf(tokenId)).to.equal(this.receiver);
        });

        it('tokens can be burned and re-minted #1', async function () {
          await expect(this.token.connect(this.alice).$_burn(tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.alice, ethers.ZeroAddress, tokenId);

          await expect(this.token.ownerOf(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(tokenId);

          await expect(this.token.$_mint(this.bruce, tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.bruce, tokenId);

          expect(await this.token.ownerOf(tokenId)).to.equal(this.bruce);
        });

        it('tokens can be burned and re-minted #2', async function () {
          const tokenId = sum(...this.batches.map(({ amount }) => amount)) + offset;

          await expect(this.token.ownerOf(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(tokenId);

          // mint
          await expect(this.token.$_mint(this.alice, tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.alice, tokenId);

          expect(await this.token.ownerOf(tokenId)).to.equal(this.alice);

          // burn
          await expect(await this.token.$_burn(tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.alice, ethers.ZeroAddress, tokenId);

          await expect(this.token.ownerOf(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(tokenId);

          // re-mint
          await expect(this.token.$_mint(this.bruce, tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.bruce, tokenId);

          expect(await this.token.ownerOf(tokenId)).to.equal(this.bruce);
        });
      });
    });
  }

  describe('invalid use', function () {
    const receiver = ethers.Wallet.createRandom();

    it('cannot mint a batch larger than 5000', async function () {
      const factory = await ethers.getContractFactory('$ERC721ConsecutiveMock');

      await expect(ethers.deployContract('$ERC721ConsecutiveMock', [name, symbol, 0, [], [receiver], [5001n]]))
        .to.be.revertedWithCustomError(factory, 'ERC721ExceededMaxBatchMint')
        .withArgs(5001n, 5000n);
    });

    it('cannot use single minting during construction', async function () {
      const factory = await ethers.getContractFactory('$ERC721ConsecutiveNoConstructorMintMock');

      await expect(
        ethers.deployContract('$ERC721ConsecutiveNoConstructorMintMock', [name, symbol]),
      ).to.be.revertedWithCustomError(factory, 'ERC721ForbiddenMint');
    });

    it('consecutive mint not compatible with enumerability', async function () {
      const factory = await ethers.getContractFactory('$ERC721ConsecutiveEnumerableMock');

      await expect(
        ethers.deployContract('$ERC721ConsecutiveEnumerableMock', [name, symbol, [receiver], [100n]]),
      ).to.be.revertedWithCustomError(factory, 'ERC721EnumerableForbiddenBatchMint');
    });
  });
});
