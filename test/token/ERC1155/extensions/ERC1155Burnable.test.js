const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const ids = [42n, 1137n];
const values = [3000n, 9902n];

async function fixture() {
  const [holder, operator, other] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC1155Burnable', ['https://token-cdn-domain/{id}.json']);
  await token.$_mint(holder, ids[0], values[0], '0x');
  await token.$_mint(holder, ids[1], values[1], '0x');

  return { token, holder, operator, other };
}

describe('ERC1155Burnable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('burn', function () {
    it('holder can burn their tokens', async function () {
      await this.token.connect(this.holder).burn(this.holder, ids[0], values[0] - 1n);

      expect(await this.token.balanceOf(this.holder, ids[0])).to.equal(1n);
    });

    it("approved operators can burn the holder's tokens", async function () {
      await this.token.connect(this.holder).setApprovalForAll(this.operator, true);
      await this.token.connect(this.operator).burn(this.holder, ids[0], values[0] - 1n);

      expect(await this.token.balanceOf(this.holder, ids[0])).to.equal(1n);
    });

    it("unapproved accounts cannot burn the holder's tokens", async function () {
      await expect(this.token.connect(this.other).burn(this.holder, ids[0], values[0] - 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC1155MissingApprovalForAll')
        .withArgs(this.other.address, this.holder.address);
    });
  });

  describe('burnBatch', function () {
    it('holder can burn their tokens', async function () {
      await this.token.connect(this.holder).burnBatch(this.holder, ids, [values[0] - 1n, values[1] - 2n]);

      expect(await this.token.balanceOf(this.holder, ids[0])).to.equal(1n);
      expect(await this.token.balanceOf(this.holder, ids[1])).to.equal(2n);
    });

    it("approved operators can burn the holder's tokens", async function () {
      await this.token.connect(this.holder).setApprovalForAll(this.operator, true);
      await this.token.connect(this.operator).burnBatch(this.holder, ids, [values[0] - 1n, values[1] - 2n]);

      expect(await this.token.balanceOf(this.holder, ids[0])).to.equal(1n);
      expect(await this.token.balanceOf(this.holder, ids[1])).to.equal(2n);
    });

    it("unapproved accounts cannot burn the holder's tokens", async function () {
      await expect(this.token.connect(this.other).burnBatch(this.holder, ids, [values[0] - 1n, values[1] - 2n]))
        .to.be.revertedWithCustomError(this.token, 'ERC1155MissingApprovalForAll')
        .withArgs(this.other.address, this.holder.address);
    });
  });
});
