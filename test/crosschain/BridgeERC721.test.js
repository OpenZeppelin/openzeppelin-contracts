const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { impersonate } = require('../helpers/account');
const { getLocalChain } = require('../helpers/chains');

const { shouldBehaveLikeBridgeERC721 } = require('./BridgeERC721.behavior');

async function fixture() {
  const chain = await getLocalChain();
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await impersonate(gateway);

  // Chain A: legacy ERC721 with bridge
  const tokenA = await ethers.deployContract('$ERC721', ['Token1', 'T1']);
  const bridgeA = await ethers.deployContract('$BridgeERC721', [[], tokenA]);

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

describe('CrosschainBridgeERC721', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('token getters', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
  });

  shouldBehaveLikeBridgeERC721({ chainAIsCustodial: true });

  it('direct crosschain transfer using a safeTransferFrom to the bridge', async function () {
    const tokenId = 17n;
    const [alice, bruce] = this.accounts;
    await this.tokenA.$_mint(alice, tokenId);

    await expect(
      this.tokenA
        .connect(alice)
        .safeTransferFrom(alice, this.bridgeA, tokenId, ethers.Typed.bytes(this.chain.toErc7930(bruce))),
    )
      // bridge takes custody of the token
      .to.emit(this.tokenA, 'Transfer')
      .withArgs(alice, this.bridgeA, tokenId)
      // crosschain transfer sent
      .to.emit(this.bridgeA, 'CrosschainERC721TransferSent')
      .withArgs(anyValue, alice, this.chain.toErc7930(bruce), tokenId)
      // ERC-7786 event
      .to.emit(this.gateway, 'MessageSent')
      // crosschain transfer received
      .to.emit(this.tokenB, 'CrosschainERC721TransferReceived')
      .withArgs(anyValue, this.chain.toErc7930(alice), bruce, tokenId)
      // bridge on destination chain mints the token
      .to.emit(this.tokenB, 'Transfer')
      .withArgs(ethers.ZeroAddress, bruce, tokenId);
  });
});
