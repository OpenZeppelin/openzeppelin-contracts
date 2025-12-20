const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
} = require('../ERC20.behavior.js');

const name = 'My Token';
const symbol = 'MTKN';
const value = 1000n;

async function fixture() {
  // this.accounts is used by shouldBehaveLikeERC20
  const accounts = await ethers.getSigners();
  const [holder, other] = accounts;

  const token = await ethers.deployContract('$ERC7246', [name, symbol]);

  await token.$_mint(holder, value);

  return {
    accounts,
    holder,
    other,
    token,
  };
}

describe.only('ERC7246', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe.only('encumber', function () {
    beforeEach(async function () {
      await this.token.connect(this.holder).encumber(this.other, 400n);
    });

    it('should reduce available balance', async function () {
      await expect(this.token.availableBalanceOf(this.holder)).to.eventually.equal(value - 400n);
    });

    it('should restrict transfer to available balance', async function () {
      await expect(this.token.connect(this.holder).transfer(this.other, value))
        .to.be.revertedWithCustomError(this.token, 'ERC7246InsufficientAvailableBalance')
        .withArgs(value - 400n, value);
    });

    it('should allow transfer within available balance', async function () {
      await expect(this.token.connect(this.holder).transfer(this.other, value - 400n))
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.other.address, value - 400n);
    });
  });

  shouldBehaveLikeERC20(value);
});
