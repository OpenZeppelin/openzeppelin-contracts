const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { impersonate } = require('../../../helpers/account');
const { getLocalChain } = require('../../../helpers/chains');

const { shouldBehaveLikeBridgeERC721 } = require('../../../crosschain/BridgeERC721.behavior');

async function fixture() {
  const chain = await getLocalChain();
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await impersonate(gateway);

  // Chain A: legacy ERC721 with bridge
  const tokenA = await ethers.deployContract('$ERC721Crosschain', ['Token1', 'T1', []]);
  const bridgeA = tokenA; // self bridge

  // Chain B: ERC721 with native bridge integration
  const tokenB = await ethers.deployContract('$ERC721Crosschain', [
    'Token2',
    'T2',
    [[gateway, chain.toErc7930(bridgeA)]],
  ]);
  const bridgeB = tokenB; // self bridge

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gateway, chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gateway, chain.toErc7930(bridgeB));

  return { chain, accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB };
}

describe('CrosschainBridgeERC20', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeBridgeERC721();

  describe('crosschainTransferFrom', function () {
    it('with allowance: success', async function () {
      const [alice, bruce, chris] = this.accounts;
      const tokenId = 17n;

      await this.tokenA.$_mint(alice, tokenId);
      await this.tokenA.connect(alice).setApprovalForAll(chris, true);

      await expect(this.tokenA.connect(chris).crosschainTransferFrom(alice, this.chain.toErc7930(bruce), tokenId))
        // tokens are burned on non custodial chains
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(alice, ethers.ZeroAddress, tokenId)
        // crosschain transfer sent
        .to.emit(this.tokenA, 'CrosschainERC721TransferSent')
        .withArgs(anyValue, alice, this.chain.toErc7930(bruce), tokenId)
        // ERC-7786 event
        .to.emit(this.gateway, 'MessageSent')
        // crosschain transfer received
        .to.emit(this.tokenB, 'CrosschainERC721TransferReceived')
        .withArgs(anyValue, this.chain.toErc7930(alice), bruce, tokenId)
        // bridge on custodial chain releases mints the token
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(ethers.ZeroAddress, bruce, tokenId);
    });

    it('without allowance: revert', async function () {
      const [alice, bruce, chris] = this.accounts;
      const tokenId = 17n;

      await this.tokenA.$_mint(alice, tokenId);

      await expect(this.tokenA.connect(chris).crosschainTransferFrom(alice, this.chain.toErc7930(bruce), tokenId))
        .to.be.revertedWithCustomError(this.tokenA, 'ERC721InsufficientApproval')
        .withArgs(chris, tokenId);
    });
  });
});
