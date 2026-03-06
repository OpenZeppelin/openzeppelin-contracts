import { network } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeBridgeERC721 } from './BridgeERC721.behavior';

const connection = await network.connect();
const {
  ethers,
  helpers,
  networkHelpers: { loadFixture },
} = connection;

async function fixture() {
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await helpers.impersonate(gateway);

  // Chain A: legacy ERC721 with bridge
  const tokenA = await ethers.deployContract('$ERC721', ['Token1', 'T1']);
  const bridgeA = await ethers.deployContract('$BridgeERC721', [[], tokenA]);

  // Chain B: ERC721 with native bridge integration
  const tokenB = await ethers.deployContract('$ERC721Crosschain', [
    'Token2',
    'T2',
    [[gateway, helpers.chain.toErc7930(bridgeA)]],
  ]);
  const bridgeB = tokenB; // self bridge

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gateway, helpers.chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gateway, helpers.chain.toErc7930(bridgeB));

  return { accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB };
}

describe('CrosschainBridgeERC721', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));
  });

  it('token getters', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
  });

  shouldBehaveLikeBridgeERC721({ chainAIsCustodial: true });
});
