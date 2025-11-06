const { ethers } = require('hardhat');
const { expect } = require('chai');
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

describe('ERC20Crosschain', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeBridgeERC20();
});
