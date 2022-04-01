const { BridgeHelper } = require('../helpers/crosschain');
const { expectRevertCustomError } = require('../helpers/customError');

function randomAddress () {
  return web3.utils.toChecksumAddress(web3.utils.randomHex(20));
}

const CrossChainEnabledAMBMock = artifacts.require('CrossChainEnabledAMBMock');
const CrossChainEnabledArbitrumL1Mock = artifacts.require('CrossChainEnabledArbitrumL1Mock');
const CrossChainEnabledArbitrumL2Mock = artifacts.require('CrossChainEnabledArbitrumL2Mock');
const CrossChainEnabledOptimismMock = artifacts.require('CrossChainEnabledOptimismMock');
const CrossChainEnabledPolygonChildMock = artifacts.require('CrossChainEnabledPolygonChildMock');

function shouldBehaveLikeReceiver (sender = randomAddress()) {
  it('should reject same-chain calls', async function () {
    await expectRevertCustomError(
      this.receiver.crossChainRestricted(),
      'NotCrossChainCall()',
    );
  });

  it('should restrict to cross-chain call from a invalid sender', async function () {
    await expectRevertCustomError(
      this.bridge.call(sender, this.receiver, 'crossChainOwnerRestricted()'),
      `InvalidCrossChainSender("${sender}", "${await this.receiver.owner()}")`,
    );
  });

  it('should grant access to cross-chain call from the owner', async function () {
    await this.bridge.call(
      await this.receiver.owner(),
      this.receiver,
      'crossChainOwnerRestricted()',
    );
  });
}

contract('CrossChainEnabled', function () {
  describe('AMB', function () {
    beforeEach(async function () {
      this.bridge = await BridgeHelper.deploy('AMB');
      this.receiver = await CrossChainEnabledAMBMock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum-L1', function () {
    beforeEach(async function () {
      this.bridge = await BridgeHelper.deploy('Arbitrum-L1');
      this.receiver = await CrossChainEnabledArbitrumL1Mock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum-L2', function () {
    beforeEach(async function () {
      this.bridge = await BridgeHelper.deploy('Arbitrum-L2');
      this.receiver = await CrossChainEnabledArbitrumL2Mock.new();
    });

    shouldBehaveLikeReceiver();
  });

  describe('Optimism', function () {
    beforeEach(async function () {
      this.bridge = await BridgeHelper.deploy('Optimism');
      this.receiver = await CrossChainEnabledOptimismMock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Polygon-Child', function () {
    beforeEach(async function () {
      this.bridge = await BridgeHelper.deploy('Polygon-Child');
      this.receiver = await CrossChainEnabledPolygonChildMock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });
});
