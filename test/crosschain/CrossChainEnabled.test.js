const { ethers      } = require('hardhat');
const { expect, use } = require('chai');
const { solidity    } = require('ethereum-waffle');
use(solidity);

async function getFactory(name, opts = {}) {
  return ethers.getContractFactory(name).then(contract => contract.connect(opts.signer || contract.signer));
}

function attach(name, address, opts = {}) {
  return getFactory(name, opts).then(factory => factory.attach(address));
}

function deploy(name, args = [], opts = {}) {
  if (!Array.isArray(args)) { opts = args; args = []; }
  return getFactory(name, opts).then(factory => factory.deploy(...args)).then(contract => contract.deployed());
}

function randomAddress() {
  return ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
}

function shouldBehaveLikeReceiver (sender = randomAddress()) {
  it('should revert on same-chain call', async function () {
    await expect(this.receiver.restricted())
    .to.be.reverted; // TODO: check custom error
  });

  it('should retreive sender on cross-chain call', async function () {
    expect(await this.bridge._sender()).to.be.equal(ethers.constants.AddressZero);

    await expect(this.bridge.relayAs(
      this.receiver.address,
      this.receiver.interface.encodeFunctionData('restricted()'),
      sender
    ))
    .to.emit(this.receiver, 'CrossChainCall').withArgs(sender);

    expect(await this.bridge._sender()).to.be.equal(ethers.constants.AddressZero);
  });
}

contract('CrossChainEnabled', function () {
  describe('AMB', function () {
    beforeEach(async function () {
      this.bridge = await deploy('BridgeAMBMock');
      this.receiver = await deploy('CrossChainEnabledAMBMock', [ this.bridge.address ]);
    });
    shouldBehaveLikeReceiver();
  });

  describe('Arbitrum', function () {
    describe('L1', function () {
      beforeEach(async function () {
        this.bridge = await deploy('BridgeArbitrumL1Mock');
        this.receiver = await deploy('CrossChainEnabledArbitrumL1Mock', [ await this.bridge.inbox() ]);
      });
      shouldBehaveLikeReceiver();
    });

    describe('L2', function () {
      beforeEach(async function () {
        const instance = await deploy('BridgeArbitrumL2Mock');

        await ethers.provider.getCode(instance.address)
          .then(code => ethers.provider.send("hardhat_setCode", [
            "0x0000000000000000000000000000000000000064",
            code
          ]));

        this.bridge = await attach('BridgeArbitrumL2Mock', '0x0000000000000000000000000000000000000064');
        this.receiver = await deploy('CrossChainEnabledArbitrumL2Mock');
      });
      shouldBehaveLikeReceiver();
    });
  });

  describe('Optimism', function () {
    beforeEach(async function () {
      this.bridge = await deploy('BridgeOptimismMock');
      this.receiver = await deploy('CrossChainEnabledOptimismMock', [ this.bridge.address ]);
    });
    shouldBehaveLikeReceiver();
  });
});
