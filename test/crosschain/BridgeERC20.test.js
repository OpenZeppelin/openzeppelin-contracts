import { network } from 'hardhat';
import { expect } from 'chai';
import { ERC7786Bridge } from '../helpers/erc7786';
import { shouldBehaveLikeBridgeERC20 } from './BridgeERC20.behavior';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

async function fixture() {
  const accountsA = await chainA.ethers.getSigners();
  const accountsB = await chainB.ethers.getSigners();

  // Chain A: legacy ERC20 with bridge
  const gatewayA = bridge.gateway(chainA);
  const tokenA = await chainA.ethers.deployContract('$ERC20', ['Token1', 'T1']);
  const bridgeA = await chainA.ethers.deployContract('$BridgeERC20', [[], tokenA]);

  // Chain B: ERC7802 with bridge (preconfigured link to bridgeA, on chain A)
  const gatewayB = bridge.gateway(chainB);
  const tokenB = await chainB.ethers.deployContract('$ERC20BridgeableMock', [
    'Token2',
    'T2',
    chainB.ethers.ZeroAddress,
  ]);
  const bridgeB = await chainB.ethers.deployContract('$BridgeERC7802', [
    [[gatewayB, chainA.helpers.chain.toErc7930(bridgeA)]],
    tokenB,
  ]);

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gatewayA, chainB.helpers.chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gatewayA, chainB.helpers.chain.toErc7930(bridgeB));
  await tokenB.$_setBridge(bridgeB);

  return { accountsA, accountsB, tokenA, tokenB, bridgeA, bridgeB };
}

describe('CrosschainBridgeERC20', function () {
  beforeEach(async function () {
    Object.assign(this, { chainA, chainB, bridge }, await bridge.loadFixture(fixture));
  });

  it('token getters', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
    await expect(this.bridgeB.token()).to.eventually.equal(this.tokenB);
  });

  shouldBehaveLikeBridgeERC20({ chainAIsCustodial: true });
});
