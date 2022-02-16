const { ethers } = require('hardhat');
const { expect } = require('chai');
const { CrossChainHelper, deploy } = require('./helper.ethers');

function randomAddress () {
  return ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
}

function shouldBehaveLikeReceiver (crosschain, sender = randomAddress()) {
  it('should reject same-chain calls', async function () {
    await expect(this.receiver.crossChainRestricted())
      .to.be.revertedWith('NotCrossChainCall()');
  });

  it('should restrict to cross-chain call from a invalid sender', async function () {
    const owner = await this.receiver.owner();

    await expect(crosschain.call(
      sender,
      this.receiver,
      'crossChainOwnerRestricted()',
    ))
      .to.be.revertedWith(`InvalidCrossChainSender("${sender}", "${owner}")`);
  });

  it('should grant access to cross-chain call from a the owner', async function () {
    const owner = await this.receiver.owner();

    await expect(crosschain.call(
      owner,
      this.receiver,
      'crossChainOwnerRestricted()',
    ))
      .to.be.not.reverted;
  });
}

contract('CrossChainEnabled', function () {
  const crosschain = new CrossChainHelper();

  describe('AMB', function () {
    crosschain.before('AMB');

    beforeEach(async function () {
      this.receiver = await deploy('CrossChainEnabledAMBMock', [ crosschain.bridge.address ]);
    });

    shouldBehaveLikeReceiver(crosschain);
  });

  describe('Arbitrum', function () {
    describe('L1', function () {
      crosschain.before('Arbitrum-L1');

      beforeEach(async function () {
        this.receiver = await deploy('CrossChainEnabledArbitrumL1Mock', [ await crosschain.bridge.inbox() ]);
      });

      shouldBehaveLikeReceiver(crosschain);
    });

    describe('L2', function () {
      crosschain.before('Arbitrum-L2');

      beforeEach(async function () {
        this.receiver = await deploy('CrossChainEnabledArbitrumL2Mock');
      });

      shouldBehaveLikeReceiver(crosschain);
    });
  });

  describe('Optimism', function () {
    crosschain.before('Optimism');

    beforeEach(async function () {
      this.receiver = await deploy('CrossChainEnabledOptimismMock', [ crosschain.bridge.address ]);
    });

    shouldBehaveLikeReceiver(crosschain);
  });

  describe('Polygon-Child', function () {
    crosschain.before('Polygon-Child');

    beforeEach(async function () {
      this.receiver = await deploy('CrossChainEnabledPolygonChildMock', [ crosschain.bridge.address ]);
    });

    shouldBehaveLikeReceiver(crosschain);
  });
});
