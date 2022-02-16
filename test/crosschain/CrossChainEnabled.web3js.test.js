const { expectRevert } = require('@openzeppelin/test-helpers');
const { CrossChainHelper } = require('./helper.web3js');

function randomAddress () {
  return web3.utils.toChecksumAddress(web3.utils.randomHex(20));
}

const CrossChainEnabledAMBMock = artifacts.require('CrossChainEnabledAMBMock');
const CrossChainEnabledArbitrumL1Mock = artifacts.require('CrossChainEnabledArbitrumL1Mock');
const CrossChainEnabledArbitrumL2Mock = artifacts.require('CrossChainEnabledArbitrumL2Mock');
const CrossChainEnabledOptimismMock = artifacts.require('CrossChainEnabledOptimismMock');
const CrossChainEnabledPolygonChildMock = artifacts.require('CrossChainEnabledPolygonChildMock');

function shouldBehaveLikeReceiver (crosschain, sender = randomAddress()) {
  it('should reject same-chain calls', async function () {
    await expectRevert.unspecified(
      this.receiver.crossChainRestricted(),
    ); // TODO: check custom error
  });

  it('should restrict to cross-chain call from a invalid sender', async function () {
    await expectRevert.unspecified(crosschain.call(
      sender,
      this.receiver,
      'crossChainOwnerRestricted()',
    )); // TODO: check custom error
  });

  it('should grant access to cross-chain call from a the owner', async function () {
    await crosschain.call(
      await this.receiver.owner(),
      this.receiver,
      'crossChainOwnerRestricted()',
    );
  });
}

contract('CrossChainEnabled', function () {
  const crosschain = new CrossChainHelper();

  describe('AMB', function () {
    crosschain.before('AMB');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledAMBMock.new(crosschain.bridge.address);
    });

    shouldBehaveLikeReceiver(crosschain);
  });

  describe('Arbitrum-L1', function () {
    crosschain.before('Arbitrum-L1');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledArbitrumL1Mock.new(await crosschain.bridge.inbox());
    });

    shouldBehaveLikeReceiver(crosschain);
  });

  describe('Arbitrum-L2', function () {
    crosschain.before('Arbitrum-L2');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledArbitrumL2Mock.new(crosschain.bridge.address);
    });

    shouldBehaveLikeReceiver(crosschain);
  });

  describe('Optimism', function () {
    crosschain.before('Optimism');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledOptimismMock.new(crosschain.bridge.address);
    });

    shouldBehaveLikeReceiver(crosschain);
  });

  describe('Polygon-Child', function () {
    crosschain.before('Polygon-Child');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledPolygonChildMock.new(crosschain.bridge.address);
    });

    shouldBehaveLikeReceiver(crosschain);
  });
});
