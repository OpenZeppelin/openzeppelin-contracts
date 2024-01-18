const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const name = 'Non Fungible Token';
const symbol = 'NFT';
const tokenId = 1n;
const otherTokenId = 2n;
const unknownTokenId = 3n;

async function fixture() {
  const [owner, approved, another] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC721Burnable', [name, symbol]);
  return { owner, approved, another, token };
}

describe('ERC721Burnable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('like a burnable ERC721', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.owner, tokenId);
      await this.token.$_mint(this.owner, otherTokenId);
    });

    describe('burn', function () {
      describe('when successful', function () {
        it('emits a burn event, burns the given token ID and adjusts the balance of the owner', async function () {
          const balanceBefore = await this.token.balanceOf(this.owner);

          await expect(this.token.connect(this.owner).burn(tokenId))
            .to.emit(this.token, 'Transfer')
            .withArgs(this.owner, ethers.ZeroAddress, tokenId);

          await expect(this.token.ownerOf(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(tokenId);

          expect(await this.token.balanceOf(this.owner)).to.equal(balanceBefore - 1n);
        });
      });

      describe('when there is a previous approval burned', function () {
        beforeEach(async function () {
          await this.token.connect(this.owner).approve(this.approved, tokenId);
          await this.token.connect(this.owner).burn(tokenId);
        });

        describe('getApproved', function () {
          it('reverts', async function () {
            await expect(this.token.getApproved(tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
              .withArgs(tokenId);
          });
        });
      });

      describe('when there is no previous approval burned', function () {
        it('reverts', async function () {
          await expect(this.token.connect(this.another).burn(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
            .withArgs(this.another, tokenId);
        });
      });

      describe('when the given token ID was not tracked by this contract', function () {
        it('reverts', async function () {
          await expect(this.token.connect(this.owner).burn(unknownTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(unknownTokenId);
        });
      });
    });
  });
});
