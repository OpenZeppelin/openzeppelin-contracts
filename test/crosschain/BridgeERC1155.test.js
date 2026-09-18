import { network } from 'hardhat';
import { expect } from 'chai';
import { ERC7786Bridge } from '../helpers/erc7786';
import { shouldBehaveLikeBridgeERC1155 } from './BridgeERC1155.behavior';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

async function fixture() {
  const accountsA = await chainA.ethers.getSigners();
  const accountsB = await chainB.ethers.getSigners();

  // Chain A: legacy ERC1155 with bridge
  const gatewayA = bridge.gateway(chainA);
  const tokenA = await chainA.ethers.deployContract('$ERC1155', ['https://token-cdn-domain/{id}.json']);
  const bridgeA = await chainA.ethers.deployContract('$BridgeERC1155', [[], tokenA]);

  // Chain B: ERC1155 with native bridge integration (preconfigured link to bridgeA, on chain A)
  const gatewayB = bridge.gateway(chainB);
  const tokenB = await chainB.ethers.deployContract('$ERC1155Crosschain', [
    [[gatewayB, chainA.helpers.chain.toErc7930(bridgeA)]],
    'https://token-cdn-domain/{id}.json',
  ]);
  const bridgeB = tokenB; // self bridge

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gatewayA, chainB.helpers.chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gatewayA, chainB.helpers.chain.toErc7930(bridgeB));

  return { accountsA, accountsB, tokenA, tokenB, bridgeA, bridgeB };
}

describe('CrosschainBridgeERC1155', function () {
  beforeEach(async function () {
    Object.assign(this, { chainA, chainB, bridge }, await bridge.loadFixture(fixture));
  });

  it('token getters', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
  });

  shouldBehaveLikeBridgeERC1155({ chainAIsCustodial: true });

  describe('direct transfer to bridge should fail', function () {
    const ids = [17n, 42n];
    const values = [100n, 320n];

    it('single', async function () {
      const [alice] = this.accountsA;
      await this.tokenA.$_mintBatch(alice, ids, values, '0x');

      await expect(this.tokenA.connect(alice).safeTransferFrom(alice, this.bridgeA, ids[0], values[0], '0x'))
        .to.be.revertedWithCustomError(this.tokenA, 'ERC1155InvalidReceiver')
        .withArgs(this.bridgeA);
    });

    it('batch', async function () {
      const [alice] = this.accountsA;
      await this.tokenA.$_mintBatch(alice, ids, values, '0x');

      await expect(this.tokenA.connect(alice).safeBatchTransferFrom(alice, this.bridgeA, ids, values, '0x'))
        .to.be.revertedWithCustomError(this.tokenA, 'ERC1155InvalidReceiver')
        .withArgs(this.bridgeA);
    });
  });
});
