const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { generators } = require('../../helpers/random');
const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const fixture = async () => {
  const [admin, nonContractAddress] = await ethers.getSigners();

  const factory = await ethers.deployContract('$ERC1967Clones');
  const implementation = await ethers.deployContract('DummyImplementation');
  const erc1967 = await ethers.getContractFactory('$ERC1967Utils');

  return { admin, nonContractAddress, factory, erc1967, implementation };
};

describe('ERC1967Clones', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('non-deterministic deployment (create)', function () {
    before(function () {
      this.createProxy = async (implementation, initData, opts = {}) => {
        const predictedAddress = await ethers.provider
          .getTransactionCount(this.factory)
          .then(nonce => ethers.getCreateAddress({ from: this.factory.target, nonce }));
        const deploymentTx = await this.factory.$deploy(implementation);

        await expect(deploymentTx)
          .to.emit(this.factory, 'return$deploy_address')
          .withArgs(predictedAddress)
          .to.emit(this.erc1967.attach(predictedAddress), 'Upgraded')
          .withArgs(implementation);

        const instance = new ethers.Contract(predictedAddress, [], this.admin, deploymentTx);
        if (initData !== '0x' || opts.value > 0n) {
          await this.admin.sendTransaction({ to: instance.target, data: initData, ...opts });
        }

        return instance;
      };
    });

    shouldBehaveLikeProxy({ allowUninitialized: true, allowNonContractAddress: true });
  });

  describe('deterministic deployment (create2)', function () {
    before(function () {
      this.createProxy = async (implementation, initData, opts = {}) => {
        const salt = ethers.Typed.bytes32(opts.salt ?? generators.bytes32());
        const predictedAddress = await this.factory.$computeAddress(implementation, salt);
        const deploymentTx = await this.factory.$deploy(implementation, salt);

        await expect(deploymentTx)
          .to.emit(this.factory, 'return$deploy_address_bytes32')
          .withArgs(predictedAddress)
          .to.emit(this.erc1967.attach(predictedAddress), 'Upgraded')
          .withArgs(implementation);

        const instance = new ethers.Contract(predictedAddress, [], this.admin, deploymentTx);
        if (initData !== '0x' || opts.value > 0n) {
          await this.admin.sendTransaction({ to: instance.target, data: initData, ...opts });
        }

        return instance;
      };
    });

    shouldBehaveLikeProxy({ allowUninitialized: true, allowNonContractAddress: true });
  });
});
