const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC721 } = require('../ERC721.behavior');

async function fixture() {
  const [owner, newOwner, approved, anotherApproved, operator, other] = await ethers.getSigners();

  const name = 'My Token';
  const symbol = 'MTKN';
  const firstTokenId = 1n;
  const secondTokenId = 2n;

  const underlying = await ethers.deployContract('$ERC721', [name, symbol]);
  const token = await ethers.deployContract('$ERC721Wrapper', [`Wrapped ${name}`, `W${symbol}`, underlying]);

  await underlying.$_safeMint(owner, firstTokenId);
  await underlying.$_safeMint(owner, secondTokenId);

  return {
    owner,
    newOwner,
    approved,
    anotherApproved,
    operator,
    other,
    underlying,
    token,
    name,
    symbol,
    firstTokenId,
    secondTokenId,
  };
}

describe.only('ERC721Wrapper', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.equal(`Wrapped ${this.name}`);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.equal(`W${this.symbol}`);
  });

  it('has underlying', async function () {
    expect(await this.token.underlying()).to.be.equal(this.underlying.target);
  });

  describe('depositFor', function () {
    beforeEach(function () {
      this.deposits = async (receiver, tokenIds) => {
        const tx = await this.token.connect(this.owner).depositFor(receiver, tokenIds);
        await expect(tx).to.changeTokenBalances(
          this.underlying,
          [this.owner, this.token],
          [-tokenIds.length, tokenIds.length],
        );
        await expect(tx).to.changeTokenBalance(this.token, receiver, tokenIds.length);
        for (const tokenId of tokenIds) {
          await expect(tx)
            .to.emit(this.underlying, 'Transfer')
            .withArgs(this.owner.address, this.token.target, tokenId)
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, receiver.address, tokenId);
        }
      };
    });

    it('works with token approval', async function () {
      await this.underlying.connect(this.owner).approve(this.token, this.firstTokenId);
      await this.deposits(this.owner, [this.firstTokenId]);
    });

    it('works with approval for all', async function () {
      await this.underlying.connect(this.owner).setApprovalForAll(this.token, true);
      await this.deposits(this.owner, [this.firstTokenId]);
    });

    it('works sending to another account', async function () {
      await this.underlying.connect(this.owner).approve(this.token, this.firstTokenId);
      await this.deposits(this.newOwner, [this.firstTokenId]);
    });

    it('works with multiple tokens', async function () {
      await this.underlying.connect(this.owner).approve(this.token, this.firstTokenId);
      await this.underlying.connect(this.owner).approve(this.token, this.secondTokenId);
      await this.deposits(this.owner, [this.firstTokenId, this.secondTokenId]);
    });

    it('reverts without approval', async function () {
      await expect(this.token.connect(this.owner).depositFor(this.owner, [this.firstTokenId]))
        .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
        .withArgs(this.token.target, this.firstTokenId);
    });
  });

  describe('withdrawTo', function () {
    beforeEach(async function () {
      await this.underlying.connect(this.owner).approve(this.token, this.firstTokenId);
      await this.token.connect(this.owner).depositFor(this.owner, [this.firstTokenId]);

      this.witdraw = async (operator, receiver, tokenIds) => {
        const tx = this.token.connect(operator).withdrawTo(receiver, tokenIds);
        await expect(tx).to.changeTokenBalances(
          this.underlying,
          [this.token, receiver],
          [-tokenIds.length, tokenIds.length],
        );
        await expect(tx).to.changeTokenBalance(this.token, this.owner, -tokenIds.length);
        for (const tokenId of tokenIds) {
          await expect(tx)
            .to.emit(this.underlying, 'Transfer')
            .withArgs(this.token.target, receiver.address, tokenId)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.owner.address, ethers.ZeroAddress, tokenId);
        }
      };
    });

    it('works for an owner', async function () {
      await this.witdraw(this.owner, this.owner, [this.firstTokenId]);
    });

    it('works for an approved', async function () {
      await this.token.connect(this.owner).approve(this.approved, this.firstTokenId);
      await this.witdraw(this.approved, this.owner, [this.firstTokenId]);
    });

    it('works for an approved for all', async function () {
      await this.token.connect(this.owner).setApprovalForAll(this.approved, true);
      await this.witdraw(this.approved, this.owner, [this.firstTokenId]);
    });

    it('works with multiple tokens', async function () {
      await this.underlying.connect(this.owner).approve(this.token, this.secondTokenId);
      await this.token.connect(this.owner).depositFor(this.owner, [this.secondTokenId]);
      await this.witdraw(this.owner, this.owner, [this.firstTokenId, this.secondTokenId]);
    });

    it('works to another account', async function () {
      await this.witdraw(this.owner, this.newOwner, [this.firstTokenId]);
    });

    it("doesn't work for a non-owner nor approved", async function () {
      await expect(this.token.connect(this.other).withdrawTo(this.other, [this.firstTokenId]))
        .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
        .withArgs(this.other.address, this.firstTokenId);
    });
  });

  describe('onERC721Received', function () {
    it('only allows calls from underlying', async function () {
      await expect(this.token.connect(this.other).onERC721Received(this.owner, this.token, this.firstTokenId, '0x'))
        .to.be.revertedWithCustomError(this.token, 'ERC721UnsupportedToken')
        .withArgs(this.other.address);
    });

    it('mints a token to from', async function () {
      const tx = await this.underlying.connect(this.owner).safeTransferFrom(this.owner, this.token, this.firstTokenId);
      await expect(tx).to.changeTokenBalances(this.underlying, [this.owner, this.token], [-1, 1]);
      await expect(tx).to.changeTokenBalance(this.token, this.owner, 1);
      await expect(tx)
        .to.emit(this.underlying, 'Transfer')
        .withArgs(this.owner.address, this.token.target, this.firstTokenId)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.owner.address, this.firstTokenId);
    });
  });

  describe('_recover', function () {
    it('works if there is something to recover', async function () {
      // Should use `transferFrom` to avoid `onERC721Received` minting
      await this.underlying.connect(this.owner).transferFrom(this.owner, this.token, this.firstTokenId);

      await expect(this.token.$_recover(this.newOwner, this.firstTokenId))
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.newOwner.address, this.firstTokenId);
    });

    it('reverts if there is nothing to recover', async function () {
      await expect(this.token.$_recover(this.newOwner, this.firstTokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721IncorrectOwner')
        .withArgs(this.token.target, this.firstTokenId, this.owner.address);
    });
  });

  describe('ERC712 behavior', function () {
    shouldBehaveLikeERC721();
  });
});
