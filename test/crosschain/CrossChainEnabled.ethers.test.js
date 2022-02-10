const { ethers } = require('hardhat');
const { expect } = require('chai');
const { deploy, withCrossChainMock } = require('./utils.ethers');

function randomAddress () {
  return ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
}

function shouldBehaveLikeReceiver (sender = randomAddress()) {
  it('should reject same-chain calls', async function () {
    await expect(this.receiver.crossChainRestricted())
      .to.be.revertedWith('NotCrossChainCall()');
  });

  it('should restrict to cross-chain call from a invalid sender', async function () {
    const owner = await this.receiver.owner();

    await expect(this.bridge.relayAs(
      this.receiver.address,
      this.receiver.interface.encodeFunctionData('crossChainOwnerRestricted()'),
      sender,
    ))
      .to.be.revertedWith(`InvalidCrossChainSender("${sender}", "${owner}")`);
  });

  it('should grant access to cross-chain call from a the owner', async function () {
    const owner = await this.receiver.owner();

    await expect(this.bridge.relayAs(
      this.receiver.address,
      this.receiver.interface.encodeFunctionData('crossChainOwnerRestricted()'),
      owner,
    ))
      .to.be.not.reverted;
  });
}

contract('CrossChainEnabled', function () {
  describe('AMB', function () {
    withCrossChainMock('AMB');

    beforeEach(async function () {
      this.receiver = await deploy('CrossChainEnabledAMBMock', [ this.bridge.address ]);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum', function () {
    describe('L1', function () {
      withCrossChainMock('Arbitrum-L1');

      beforeEach(async function () {
        this.receiver = await deploy('CrossChainEnabledArbitrumL1Mock', [ await this.bridge.inbox() ]);
      });

      shouldBehaveLikeReceiver();
    });

    describe('L2', function () {
      withCrossChainMock('Arbitrum-L2');

      beforeEach(async function () {
        this.receiver = await deploy('CrossChainEnabledArbitrumL2Mock');
      });

      shouldBehaveLikeReceiver();
    });
  });

  describe('Optimism', function () {
    withCrossChainMock('Optimism');

    beforeEach(async function () {
      this.receiver = await deploy('CrossChainEnabledOptimismMock', [ this.bridge.address ]);
    });

    shouldBehaveLikeReceiver();
  });
});
