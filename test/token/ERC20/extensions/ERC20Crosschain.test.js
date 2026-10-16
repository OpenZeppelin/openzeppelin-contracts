import { network } from 'hardhat';
import { ethers } from 'ethers';
import { expect } from 'chai';
import { anyValue } from '@nomicfoundation/hardhat-ethers-chai-matchers/withArgs';
import { ERC7786Bridge } from '../../../helpers/erc7786';
import { shouldBehaveLikeBridgeERC20 } from '../../../crosschain/BridgeERC20.behavior';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

async function fixture() {
  const accountsA = await chainA.ethers.getSigners();
  const accountsB = await chainB.ethers.getSigners();

  // Chain A: ERC20 that embeds its own bridge
  const gatewayA = bridge.gateway(chainA);
  const tokenA = await chainA.ethers.deployContract('$ERC20Crosschain', ['Token1', 'T1', []]);
  const bridgeA = tokenA; // self bridge

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

describe('ERC20Crosschain', function () {
  beforeEach(async function () {
    Object.assign(this, { chainA, chainB, bridge }, await bridge.loadFixture(fixture));
  });

  shouldBehaveLikeBridgeERC20();

  describe('crosschainTransferFrom', function () {
    it('with allowance: success', async function () {
      const [alice, , chris] = this.accountsA;
      const [, bruce] = this.accountsB;
      const amount = 100n;

      await this.tokenA.$_mint(alice, amount);
      await this.tokenA.connect(alice).approve(chris, ethers.MaxUint256);

      // Alice sends tokens from chain A to Bruce on chain B.
      await expect(
        this.tokenA.connect(chris).crosschainTransferFrom(alice, chainB.helpers.chain.toErc7930(bruce), amount),
      )
        // bridge on chain A takes custody of the funds
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(alice, ethers.ZeroAddress, amount)
        // crosschain transfer sent
        .to.emit(this.tokenA, 'CrosschainFungibleTransferSent')
        .withArgs(anyValue, alice, chainB.helpers.chain.toErc7930(bruce), amount)
        // ERC-7786 event
        .to.emit(bridge.gateway(chainA), 'MessageSent');

      // The bridge delivers the message on chain B.
      await expect(this.bridge.relay().then(([tx]) => tx))
        // crosschain transfer received
        .to.emit(this.bridgeB, 'CrosschainFungibleTransferReceived')
        .withArgs(anyValue, chainA.helpers.chain.toErc7930(alice), bruce, amount)
        // crosschain mint event
        .to.emit(this.tokenB, 'CrosschainMint')
        .withArgs(bruce, amount, this.bridgeB)
        // tokens are minted on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(ethers.ZeroAddress, bruce, amount);
    });

    it('without allowance: revert', async function () {
      const [alice, , chris] = this.accountsA;
      const [, bruce] = this.accountsB;
      const amount = 100n;

      await this.tokenA.$_mint(alice, amount);

      await expect(
        this.tokenA.connect(chris).crosschainTransferFrom(alice, chainB.helpers.chain.toErc7930(bruce), amount),
      )
        .to.be.revertedWithCustomError(this.tokenA, 'ERC20InsufficientAllowance')
        .withArgs(chris, 0n, amount);
    });
  });
});
