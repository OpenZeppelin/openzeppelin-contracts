const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [holder] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC1155Supply', ['https://token-cdn-domain/{id}.json']);
  return { token, holder };
}

describe('ERC1155Supply', function () {
  const firstTokenId = 37n;
  const firstTokenValue = 42n;
  const secondTokenId = 19842n;
  const secondTokenValue = 23n;

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('before mint', function () {
    it('exist', async function () {
      expect(await this.token.exists(firstTokenId)).to.be.false;
    });

    it('totalSupply', async function () {
      expect(await this.token.totalSupply(ethers.Typed.uint256(firstTokenId))).to.equal(0n);
      expect(await this.token.totalSupply()).to.equal(0n);
    });
  });

  describe('after mint', function () {
    describe('single', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, firstTokenId, firstTokenValue, '0x');
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.true;
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(ethers.Typed.uint256(firstTokenId))).to.equal(firstTokenValue);
        expect(await this.token.totalSupply()).to.equal(firstTokenValue);
      });
    });

    describe('batch', function () {
      beforeEach(async function () {
        await this.token.$_mintBatch(
          this.holder,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        );
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.true;
        expect(await this.token.exists(secondTokenId)).to.be.true;
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(ethers.Typed.uint256(firstTokenId))).to.equal(firstTokenValue);
        expect(await this.token.totalSupply(ethers.Typed.uint256(secondTokenId))).to.equal(secondTokenValue);
        expect(await this.token.totalSupply()).to.equal(firstTokenValue + secondTokenValue);
      });
    });
  });

  describe('after burn', function () {
    describe('single', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, firstTokenId, firstTokenValue, '0x');
        await this.token.$_burn(this.holder, firstTokenId, firstTokenValue);
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.false;
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(ethers.Typed.uint256(firstTokenId))).to.equal(0n);
        expect(await this.token.totalSupply()).to.equal(0n);
      });
    });

    describe('batch', function () {
      beforeEach(async function () {
        await this.token.$_mintBatch(
          this.holder,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        );
        await this.token.$_burnBatch(this.holder, [firstTokenId, secondTokenId], [firstTokenValue, secondTokenValue]);
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.false;
        expect(await this.token.exists(secondTokenId)).to.be.false;
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(ethers.Typed.uint256(firstTokenId))).to.equal(0n);
        expect(await this.token.totalSupply(ethers.Typed.uint256(secondTokenId))).to.equal(0n);
        expect(await this.token.totalSupply()).to.equal(0n);
      });
    });
  });

  describe('other', function () {
    it('supply unaffected by no-op', async function () {
      await this.token.$_update(ethers.ZeroAddress, ethers.ZeroAddress, [firstTokenId], [firstTokenValue]);
      expect(await this.token.totalSupply(ethers.Typed.uint256(firstTokenId))).to.equal(0n);
      expect(await this.token.totalSupply()).to.equal(0n);
    });
  });
});
