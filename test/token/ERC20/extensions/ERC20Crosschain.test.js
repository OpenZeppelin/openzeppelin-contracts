const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../../helpers/account');
const { getLocalChain } = require('../../../helpers/chains');

const { shouldBehaveLikeBridgeERC20 } = require('../../../crosschain/BridgeERC20.behavior');

async function fixture() {
  const chain = await getLocalChain();
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await impersonate(gateway);

  // Chain A: legacy ERC20 with bridge
  const tokenA = await ethers.deployContract('$ERC20Crosschain', ['Token1', 'T1', []]);
  const bridgeA = tokenA; // self bridge

  // Chain B: ERC7802 with bridge
  const tokenB = await ethers.deployContract('$ERC20BridgeableMock', ['Token2', 'T2', ethers.ZeroAddress]);
  const bridgeB = await ethers.deployContract('$BridgeERC7802', [[[gateway, chain.toErc7930(bridgeA)]], tokenB]);

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gateway, chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gateway, chain.toErc7930(bridgeB));
  await tokenB.$_setBridge(bridgeB);

  return { chain, accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB };
}

describe('ERC20Crosschain', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeBridgeERC20();

  describe('crosschainTransferFrom', function () {
    it('with allowance: success', async function () {
      const [alice, bruce, chris] = this.accounts;
      const amount = 100n;

      await this.tokenA.$_mint(alice, amount);
      await this.tokenA.connect(alice).approve(chris, ethers.MaxUint256);

      // Alice sends tokens from chain A to Bruce on chain B.
      await expect(this.tokenA.connect(chris).crosschainTransferFrom(alice, this.chain.toErc7930(bruce), amount))
        // bridge on chain A takes custody of the funds
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(alice, ethers.ZeroAddress, amount)
        // crosschain transfer sent
        .to.emit(this.tokenA, 'CrosschainERC20TransferSent')
        .withArgs(anyValue, alice, this.chain.toErc7930(bruce), amount)
        // ERC-7786 event
        .to.emit(this.gateway, 'MessageSent')
        // crosschain transfer received
        .to.emit(this.bridgeB, 'CrosschainERC20TransferReceived')
        .withArgs(anyValue, this.chain.toErc7930(alice), bruce, amount)
        // crosschain mint event
        .to.emit(this.tokenB, 'CrosschainMint')
        .withArgs(bruce, amount, this.bridgeB)
        // tokens are minted on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(ethers.ZeroAddress, bruce, amount);
    });

    it('without allowance: revert', async function () {
      const [alice, bruce, chris] = this.accounts;
      const amount = 100n;

      await this.tokenA.$_mint(alice, amount);

      await expect(this.tokenA.connect(chris).crosschainTransferFrom(alice, this.chain.toErc7930(bruce), amount))
        .to.be.revertedWithCustomError(this.tokenA, 'ERC20InsufficientAllowance')
        .withArgs(chris, 0n, amount);
    });
  });
});
