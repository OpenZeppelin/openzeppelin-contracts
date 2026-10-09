import { network } from 'hardhat';
import { expect } from 'chai';
import { ERC7786Bridge } from '../../../helpers/erc7786';
import { shouldBehaveLikeBridgeERC721 } from '../../../crosschain/BridgeERC721.behavior';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

async function fixture() {
  const accountsA = await chainA.ethers.getSigners();
  const accountsB = await chainB.ethers.getSigners();

  // Chain A: ERC721 with native bridge integration
  const gatewayA = bridge.gateway(chainA);
  const tokenA = await chainA.ethers.deployContract('$ERC721Crosschain', [[], 'Token1', 'T1']);
  const bridgeA = tokenA; // self bridge

  // Chain B: ERC721 with native bridge integration (preconfigured link to bridgeA, on chain A)
  const gatewayB = bridge.gateway(chainB);
  const tokenB = await chainB.ethers.deployContract('$ERC721Crosschain', [
    [[gatewayB, chainA.helpers.chain.toErc7930(bridgeA)]],
    'Token2',
    'T2',
  ]);
  const bridgeB = tokenB; // self bridge

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gatewayA, chainB.helpers.chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gatewayA, chainB.helpers.chain.toErc7930(bridgeB));

  return { accountsA, accountsB, tokenA, tokenB, bridgeA, bridgeB };
}

describe('ERC721Crosschain', function () {
  beforeEach(async function () {
    Object.assign(this, { chainA, chainB, bridge }, await bridge.loadFixture(fixture));
  });

  shouldBehaveLikeBridgeERC721();
});
