const { expectRevert } = require('@openzeppelin/test-helpers');
const { withCrossChainMock } = require('./utils.web3js');

function randomAddress () {
  return web3.utils.toChecksumAddress(web3.utils.randomHex(20));
}

const CrossChainEnabledAMBMock = artifacts.require('CrossChainEnabledAMBMock');
const CrossChainEnabledArbitrumL1Mock = artifacts.require('CrossChainEnabledArbitrumL1Mock');
const CrossChainEnabledArbitrumL2Mock = artifacts.require('CrossChainEnabledArbitrumL2Mock');
const CrossChainEnabledOptimismMock = artifacts.require('CrossChainEnabledOptimismMock');

function shouldBehaveLikeReceiver (sender = randomAddress()) {
  it('should reject same-chain calls', async function () {
    await expectRevert.unspecified(
      this.receiver.crossChainRestricted(),
    ); // TODO: check custom error
  });

  it('should restrict to cross-chain call from a invalid sender', async function () {
    await expectRevert.unspecified(this.bridge.relayAs(
      this.receiver.address,
      this.receiver.contract.methods.crossChainOwnerRestricted().encodeABI(),
      sender,
    )); // TODO: check custom error
  });

  it('should grant access to cross-chain call from a the owner', async function () {
    await this.bridge.relayAs(
      this.receiver.address,
      this.receiver.contract.methods.crossChainOwnerRestricted().encodeABI(),
      await this.receiver.owner(),
    );
  });
}

contract('CrossChainEnabled', function () {
  describe('AMB', function () {
    withCrossChainMock('AMB');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledAMBMock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum-L1', function () {
    withCrossChainMock('Arbitrum-L1');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledArbitrumL1Mock.new(await this.bridge.inbox());
    });

    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum-L2', function () {
    withCrossChainMock('Arbitrum-L2');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledArbitrumL2Mock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });

  describe('Optimism', function () {
    withCrossChainMock('Optimism');

    beforeEach(async function () {
      this.receiver = await CrossChainEnabledOptimismMock.new(this.bridge.address);
    });

    shouldBehaveLikeReceiver();
  });
});
