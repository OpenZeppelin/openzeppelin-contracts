const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../helpers/account');
const { getLocalChain } = require('../helpers/chains');

const { shouldBehaveLikeBridgeERC20 } = require('./BridgeERC20.behavior');

async function fixture() {
  const chain = await getLocalChain();
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await impersonate(gateway);

  // Chain A: legacy ERC20 with bridge
  const tokenA = await ethers.deployContract('$ERC20', ['Token1', 'T1']);
  const bridgeA = await ethers.deployContract('$BridgeERC20Custodial', [[], tokenA]);

  // Chain B: ERC7802 with bridge
  const tokenB = await ethers.deployContract('$ERC20BridgeableMock', ['Token2', 'T2', ethers.ZeroAddress]);
  const bridgeB = await ethers.deployContract('$BridgeERC7802', [[], tokenB]);

  // deployment check + remote setup
  await expect(bridgeA.$_setLink(gateway, chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'RemoteRegistered')
    .withArgs(gateway, chain.toErc7930(bridgeB));
  await expect(bridgeB.$_setLink(gateway, chain.toErc7930(bridgeA), false))
    .to.emit(bridgeB, 'RemoteRegistered')
    .withArgs(gateway, chain.toErc7930(bridgeA));
  await tokenB.$_setBridge(bridgeB);

  return { chain, accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB };
}

describe('CrosschainBridgeERC20', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('token getters', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
    await expect(this.bridgeB.token()).to.eventually.equal(this.tokenB);
  });

  shouldBehaveLikeBridgeERC20({ chainAIsCustodial: true });
});
