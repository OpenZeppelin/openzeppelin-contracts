const { expectRevert } = require('@openzeppelin/test-helpers');
const CrossChainHelper = require('../helpers/crosschain');

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
    await expectRevert.unspecified(
      this.receiver.crossChainRestricted(),
    ); // TODO: check custom error
  });

  it('should restrict to cross-chain call from a invalid sender', async function () {
    await expectRevert.unspecified(CrossChainHelper.call(
      sender,
      this.receiver,
      'crossChainOwnerRestricted()',
    )); // TODO: check custom error
  });

  it('should grant access to cross-chain call from a the owner', async function () {
    await CrossChainHelper.call(
      await this.receiver.owner(),
      this.receiver,
      'crossChainOwnerRestricted()',
    );
  });
}

contract('CrossChainEnabled', function () {
  describe('AMB', function () {
    CrossChainHelper.before('AMB');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledAMBMock.new(CrossChainHelper.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum-L1', function () {
    CrossChainHelper.before('Arbitrum-L1');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledArbitrumL1Mock.new(await CrossChainHelper.bridge.inbox());
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum-L2', function () {
    CrossChainHelper.before('Arbitrum-L2');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledArbitrumL2Mock.new(CrossChainHelper.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Optimism', function () {
    CrossChainHelper.before('Optimism');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledOptimismMock.new(CrossChainHelper.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Polygon-Child', function () {
    CrossChainHelper.before('Polygon-Child');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledPolygonChildMock.new(CrossChainHelper.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });
});
