const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../helpers/account');
const { getLocalChain } = require('../helpers/chains');

const { shouldBehaveLikeBridgeERC1155 } = require('./BridgeERC1155.behavior');

async function fixture() {
  const chain = await getLocalChain();
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await impersonate(gateway);

  // Chain A: legacy ERC1155 with bridge
  const tokenA = await ethers.deployContract('$ERC1155', ['https://token-cdn-domain/{id}.json']);
  const bridgeA = await ethers.deployContract('$BridgeERC1155', [[], tokenA]);

  // Chain B: ERC1155 with native bridge integration
  const tokenB = await ethers.deployContract('$ERC1155Crosschain', [
    'https://token-cdn-domain/{id}.json',
    [[gateway, chain.toErc7930(bridgeA)]],
  ]);
  const bridgeB = tokenB; // self bridge

  // deployment check + counterpart setup
  await expect(bridgeA.$_setLink(gateway, chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'LinkRegistered')
    .withArgs(gateway, chain.toErc7930(bridgeB));

  return { chain, accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB };
}

describe('CrosschainBridgeERC1155', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('token getters', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
  });

  shouldBehaveLikeBridgeERC1155({ chainAIsCustodial: true });

  describe('direct transfer to bridge should fail', function () {
    const ids = [17n, 42n];
    const values = [100n, 320n];

    it('single', async function () {
      const [alice] = this.accounts;
      await this.tokenA.$_mintBatch(alice, ids, values, '0x');

      await expect(this.tokenA.connect(alice).safeTransferFrom(alice, this.bridgeA, ids[0], values[0], '0x'))
        .to.be.revertedWithCustomError(this.tokenA, 'ERC1155InvalidReceiver')
        .withArgs(this.bridgeA);
    });

    it('batch', async function () {
      const [alice] = this.accounts;
      await this.tokenA.$_mintBatch(alice, ids, values, '0x');

      await expect(this.tokenA.connect(alice).safeBatchTransferFrom(alice, this.bridgeA, ids, values, '0x'))
        .to.be.revertedWithCustomError(this.tokenA, 'ERC1155InvalidReceiver')
        .withArgs(this.bridgeA);
    });
  });
});
