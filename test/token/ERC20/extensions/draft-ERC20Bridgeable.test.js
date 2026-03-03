const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior.js');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const name = 'My Token';
const symbol = 'MTKN';
const initialSupply = 100n;

async function fixture() {
  const [other, bridge, ...accounts] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC20BridgeableMock', [name, symbol, bridge]);
  await token.$_mint(accounts[0], initialSupply);

  return { bridge, other, accounts, token };
}

describe('ERC20Bridgeable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('onlyTokenBridgeFn', function () {
    it('reverts when called by non-bridge', async function () {
      await expect(this.token.onlyTokenBridgeFn()).to.be.revertedWithCustomError(this.token, 'OnlyTokenBridge');
    });

    it('does not revert when called by bridge', async function () {
      await expect(this.token.connect(this.bridge).onlyTokenBridgeFn())
        .to.emit(this.token, 'OnlyTokenBridgeFnCalled')
        .withArgs(this.bridge);
    });
  });

  describe('crosschainMint', function () {
    it('reverts when called by non-bridge', async function () {
      await expect(this.token.crosschainMint(this.other, 100n)).to.be.revertedWithCustomError(
        this.token,
        'OnlyTokenBridge',
      );
    });

    it('mints amount provided by the bridge when calling crosschainMint', async function () {
      const amount = 100n;
      await expect(this.token.connect(this.bridge).crosschainMint(this.other, amount))
        .to.emit(this.token, 'CrosschainMint')
        .withArgs(this.other, amount, this.bridge)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.other, amount);

      await expect(this.token.balanceOf(this.other)).to.eventually.equal(amount);
    });
  });

  describe('crosschainBurn', function () {
    it('reverts when called by non-bridge', async function () {
      await expect(this.token.crosschainBurn(this.other, 100n)).to.be.revertedWithCustomError(
        this.token,
        'OnlyTokenBridge',
      );
    });

    it('burns amount provided by the bridge when calling crosschainBurn', async function () {
      const amount = 100n;
      await this.token.$_mint(this.other, amount);

      await expect(this.token.connect(this.bridge).crosschainBurn(this.other, amount))
        .to.emit(this.token, 'CrosschainBurn')
        .withArgs(this.other, amount, this.bridge)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.other, ethers.ZeroAddress, amount);

      await expect(this.token.balanceOf(this.other)).to.eventually.equal(0);
    });
  });

  describe('ERC165', function () {
    shouldSupportInterfaces({
      ERC7802: ['crosschainMint(address,uint256)', 'crosschainBurn(address,uint256)'],
    });
  });

  describe('ERC20 behavior', function () {
    shouldBehaveLikeERC20(initialSupply);
  });
});
