import { network } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeBridgeERC1155 } from '../../../crosschain/BridgeERC1155.behavior';

const connection = await network.create();
const { ethers, helpers, networkHelpers } = connection;

async function fixture() {
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await helpers.impersonate(gateway);

  // Chain A: ERC1155 with native bridge integration
  const tokenA = await ethers.deployContract('$ERC1155Crosschain', ['https://token-cdn-domain/{id}.json', []]);
  const bridgeA = tokenA; // self bridge

  // Chain B: ERC1155 with native bridge integration
  const tokenB = await ethers.deployContract('$ERC1155Crosschain', [
    'https://token-cdn-domain/{id}.json',
    [[gateway, helpers.chain.toErc7930(bridgeA)]],
  ]);
  const bridgeB = tokenB; // self bridge

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gateway, helpers.chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gateway, helpers.chain.toErc7930(bridgeB));

  return { accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB };
}

describe('ERC1155Crosschain', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await networkHelpers.loadFixture(fixture));
  });

  shouldBehaveLikeBridgeERC1155();
});
