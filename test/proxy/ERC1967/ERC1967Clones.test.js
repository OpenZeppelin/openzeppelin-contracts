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
        const deploymentTx = await this.factory.$clone(implementation);

        await expect(deploymentTx)
          .to.emit(this.factory, 'return$clone_address')
          .withArgs(predictedAddress)
          .to.emit(this.erc1967.attach(predictedAddress), 'Upgraded')
          .withArgs(implementation);

        if (initData !== '0x' || opts.value > 0n) {
          await this.admin.sendTransaction({ to: predictedAddress, data: initData, ...opts });
        }

        return new ethers.Contract(predictedAddress, [], this.admin, deploymentTx);
      };
    });

    shouldBehaveLikeProxy({ allowUninitialized: true, allowNonContractAddress: true });

    it('forwards value to the new clone', async function () {
      const value = ethers.parseEther('1');
      await this.admin.sendTransaction({ to: this.factory, value });

      const predictedAddress = await ethers.provider
        .getTransactionCount(this.factory)
        .then(nonce => ethers.getCreateAddress({ from: this.factory.target, nonce }));

      await expect(this.factory.$clone(this.implementation, ethers.Typed.uint256(value))).to.changeEtherBalances(
        [this.factory, predictedAddress],
        [-value, value],
      );
    });

    it('reverts when factory balance is below value', async function () {
      const value = ethers.parseEther('1');
      await expect(this.factory.$clone(this.implementation, ethers.Typed.uint256(value)))
        .to.be.revertedWithCustomError(this.factory, 'InsufficientBalance')
        .withArgs(0n, value);
    });
  });

  describe('deterministic deployment (create2)', function () {
    before(function () {
      this.createProxy = async (implementation, initData, opts = {}) => {
        const salt = ethers.Typed.bytes32(opts.salt ?? generators.bytes32());
        const predictedAddress = await this.factory.$predictDeterministicAddress(implementation, salt);
        const deploymentTx = await this.factory.$cloneDeterministic(implementation, salt);

        await expect(deploymentTx)
          .to.emit(this.factory, 'return$cloneDeterministic_address_bytes32')
          .withArgs(predictedAddress)
          .to.emit(this.erc1967.attach(predictedAddress), 'Upgraded')
          .withArgs(implementation);

        if (initData !== '0x' || opts.value > 0n) {
          await this.admin.sendTransaction({ to: predictedAddress, data: initData, ...opts });
        }

        return new ethers.Contract(predictedAddress, [], this.admin, deploymentTx);
      };
    });

    shouldBehaveLikeProxy({ allowUninitialized: true, allowNonContractAddress: true });

    it('reverts when the same implementation and salt are reused', async function () {
      const salt = generators.bytes32();
      await expect(this.factory.$cloneDeterministic(this.implementation, salt)).to.not.be.reverted;
      await expect(this.factory.$cloneDeterministic(this.implementation, salt)).to.be.revertedWithCustomError(
        this.factory,
        'FailedDeployment',
      );
    });

    it('predicts addresses for an arbitrary deployer', async function () {
      const salt = generators.bytes32();
      const deployer = generators.address();

      const predicted = await this.factory.$predictDeterministicAddress(
        this.implementation,
        ethers.Typed.bytes32(salt),
        ethers.Typed.address(deployer),
      );

      // address predicted for a deployer that is not the factory doesn't match the one predicted for the factory
      await expect(
        this.factory.$predictDeterministicAddress(this.implementation, ethers.Typed.bytes32(salt)),
      ).to.eventually.not.equal(predicted);

      // address predicted for a deployer that is not the factory can be predicted onchain by explicitly providing the deployer
      await expect(
        this.factory.$predictDeterministicAddress(
          this.implementation,
          ethers.Typed.bytes32(salt),
          ethers.Typed.address(deployer),
        ),
      ).to.eventually.equal(predicted);
    });

    it('forwards value to the new clone', async function () {
      const value = ethers.parseEther('1');
      await this.admin.sendTransaction({ to: this.factory, value });

      const salt = generators.bytes32();
      const predictedAddress = await this.factory.$predictDeterministicAddress(
        this.implementation,
        ethers.Typed.bytes32(salt),
      );

      await expect(
        this.factory.$cloneDeterministic(this.implementation, ethers.Typed.bytes32(salt), ethers.Typed.uint256(value)),
      ).to.changeEtherBalances([this.factory, predictedAddress], [-value, value]);
    });

    it('reverts when factory balance is below value', async function () {
      const value = ethers.parseEther('1');
      const salt = generators.bytes32();
      await expect(
        this.factory.$cloneDeterministic(this.implementation, ethers.Typed.bytes32(salt), ethers.Typed.uint256(value)),
      )
        .to.be.revertedWithCustomError(this.factory, 'InsufficientBalance')
        .withArgs(0n, value);
    });
  });
});
