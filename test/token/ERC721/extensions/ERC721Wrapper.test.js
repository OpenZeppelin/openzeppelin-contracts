const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC721 } = require('../ERC721.behavior');

const name = 'Non Fungible Token';
const symbol = 'NFT';
const tokenId = 1n;
const otherTokenId = 2n;

async function fixture() {
  const accounts = await ethers.getSigners();
  const [owner, approved, other] = accounts;

  const underlying = await ethers.deployContract('$ERC721', [name, symbol]);
  await underlying.$_safeMint(owner, tokenId);
  await underlying.$_safeMint(owner, otherTokenId);
  const token = await ethers.deployContract('$ERC721Wrapper', [`Wrapped ${name}`, `W${symbol}`, underlying]);

  return { accounts, owner, approved, other, underlying, token };
}

describe('ERC721Wrapper', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.equal(`Wrapped ${name}`);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.equal(`W${symbol}`);
  });

  it('has underlying', async function () {
    expect(await this.token.underlying()).to.equal(this.underlying.target);
  });

  describe('depositFor', function () {
    it('works with token approval', async function () {
      await this.underlying.connect(this.owner).approve(this.token, tokenId);

      await expect(this.token.connect(this.owner).depositFor(this.owner, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.owner.address, this.token.target, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.owner.address, tokenId);
    });

    it('works with approval for all', async function () {
      await this.underlying.connect(this.owner).setApprovalForAll(this.token, true);

      await expect(this.token.connect(this.owner).depositFor(this.owner, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.owner.address, this.token.target, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.owner.address, tokenId);
    });

    it('works sending to another account', async function () {
      await this.underlying.connect(this.owner).approve(this.token, tokenId);

      await expect(this.token.connect(this.owner).depositFor(this.other, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.owner.address, this.token.target, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.other.address, tokenId);
    });

    it('works with multiple tokens', async function () {
      await this.underlying.connect(this.owner).approve(this.token, tokenId);
      await this.underlying.connect(this.owner).approve(this.token, otherTokenId);

      await expect(this.token.connect(this.owner).depositFor(this.owner, [tokenId, otherTokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.owner.address, this.token.target, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.owner.address, tokenId)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.owner.address, this.token.target, otherTokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.owner.address, otherTokenId);
    });

    it('reverts with missing approval', async function () {
      await expect(this.token.connect(this.owner).depositFor(this.owner, [tokenId]))
        .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
        .withArgs(this.token.target, tokenId);
    });
  });

  describe('withdrawTo', function () {
    beforeEach(async function () {
      await this.underlying.connect(this.owner).approve(this.token, tokenId);
      await this.token.connect(this.owner).depositFor(this.owner, [tokenId]);
    });

    it('works for an owner', async function () {
      await expect(this.token.connect(this.owner).withdrawTo(this.owner, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.owner.address, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner.address, ethers.ZeroAddress, tokenId);
    });

    it('works for an approved', async function () {
      await this.token.connect(this.owner).approve(this.approved, tokenId);

      await expect(this.token.connect(this.approved).withdrawTo(this.owner, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.owner.address, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner.address, ethers.ZeroAddress, tokenId);
    });

    it('works for an approved for all', async function () {
      await this.token.connect(this.owner).setApprovalForAll(this.approved, true);

      await expect(this.token.connect(this.approved).withdrawTo(this.owner, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.owner.address, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner.address, ethers.ZeroAddress, tokenId);
    });

    it("doesn't work for a non-owner nor approved", async function () {
      await expect(this.token.connect(this.other).withdrawTo(this.owner, [tokenId]))
        .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
        .withArgs(this.other.address, tokenId);
    });

    it('works with multiple tokens', async function () {
      await this.underlying.connect(this.owner).approve(this.token, otherTokenId);
      await this.token.connect(this.owner).depositFor(this.owner, [otherTokenId]);

      await expect(this.token.connect(this.owner).withdrawTo(this.owner, [tokenId, otherTokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.owner.address, tokenId)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.owner.address, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner.address, ethers.ZeroAddress, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner.address, ethers.ZeroAddress, tokenId);
    });

    it('works to another account', async function () {
      await expect(this.token.connect(this.owner).withdrawTo(this.other, [tokenId]))
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.token.target, this.other.address, tokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner.address, ethers.ZeroAddress, tokenId);
    });
  });

  describe('onERC721Received', function () {
    it('only allows calls from underlying', async function () {
      await expect(
        this.token.connect(this.other).onERC721Received(
          this.owner,
          this.token,
          tokenId,
          this.other.address, // Correct data
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC721UnsupportedToken')
        .withArgs(this.other.address);
    });

    it('mints a token to from', async function () {
      await expect(this.underlying.connect(this.owner).safeTransferFrom(this.owner, this.token, tokenId))
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.owner.address, tokenId);
    });
  });

  describe('_recover', function () {
    it('works if there is something to recover', async function () {
      // Should use `transferFrom` to avoid `onERC721Received` minting
      await this.underlying.connect(this.owner).transferFrom(this.owner, this.token, tokenId);

      await expect(this.token.$_recover(this.other, tokenId))
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.other.address, tokenId);
    });

    it('reverts if there is nothing to recover', async function () {
      const holder = await this.underlying.ownerOf(tokenId);

      await expect(this.token.$_recover(holder, tokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721IncorrectOwner')
        .withArgs(this.token.target, tokenId, holder);
    });
  });

  describe('ERC712 behavior', function () {
    shouldBehaveLikeERC721();
  });
});
