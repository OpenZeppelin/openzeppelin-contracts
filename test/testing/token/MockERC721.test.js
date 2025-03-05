const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('MockERC721', function () {
  const name = 'Mock NFT';
  const symbol = 'MNFT';
  const tokenId = 1;
  const nonExistentTokenId = 999;
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  async function fixture() {
    const [deployer, recipient, other] = await ethers.getSigners();
    const token = await ethers.deployContract('MockERC721', [name, symbol]);

    return { token, deployer, recipient, other };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('has the correct name', async function () {
    expect(await this.token.name()).to.equal(name);
  });

  it('has the correct symbol', async function () {
    expect(await this.token.symbol()).to.equal(symbol);
  });

  describe('mint', function () {
    it('allows minting a token to an address', async function () {
      await this.token.mint(this.recipient.address, tokenId);

      expect(await this.token.ownerOf(tokenId)).to.equal(this.recipient.address);
      expect(await this.token.balanceOf(this.recipient.address)).to.equal(1);
    });

    it('emits a Transfer event', async function () {
      await expect(this.token.mint(this.recipient.address, tokenId))
        .to.emit(this.token, 'Transfer')
        .withArgs(ZERO_ADDRESS, this.recipient.address, tokenId);
    });

    it('reverts when minting a token that already exists', async function () {
      await this.token.mint(this.recipient.address, tokenId);

      await expect(this.token.mint(this.recipient.address, tokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721InvalidSender')
        .withArgs(ZERO_ADDRESS);
    });
  });

  describe('safeMint', function () {
    it('allows safe minting a token to an address', async function () {
      await this.token.safeMint(this.recipient.address, tokenId);

      expect(await this.token.ownerOf(tokenId)).to.equal(this.recipient.address);
      expect(await this.token.balanceOf(this.recipient.address)).to.equal(1);
    });

    it('allows safe minting with data', async function () {
      const tokenId2 = 2;
      await this.token['safeMint(address,uint256,bytes)'](
        this.recipient.address,
        tokenId2,
        '0x64617461', // hex for "data"
      );

      expect(await this.token.ownerOf(tokenId2)).to.equal(this.recipient.address);
    });
  });

  describe('burn', function () {
    beforeEach(async function () {
      await this.token.mint(this.recipient.address, tokenId);
    });

    it('allows burning a token', async function () {
      await this.token.burn(tokenId);

      expect(await this.token.balanceOf(this.recipient.address)).to.equal(0);
      await expect(this.token.ownerOf(tokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
        .withArgs(tokenId);
    });

    it('emits a Transfer event', async function () {
      await expect(this.token.burn(tokenId))
        .to.emit(this.token, 'Transfer')
        .withArgs(this.recipient.address, ZERO_ADDRESS, tokenId);
    });

    it('reverts when burning a nonexistent token', async function () {
      await expect(this.token.burn(nonExistentTokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
        .withArgs(nonExistentTokenId);
    });
  });
});
