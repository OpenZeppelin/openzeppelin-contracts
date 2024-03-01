const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeClone = require('./Clones.behaviour');

async function fixture() {
  const [deployer] = await ethers.getSigners();

  const factory = await ethers.deployContract('$Clones');
  const implementation = await ethers.deployContract('DummyImplementation');

  const newClone = async (opts = {}) => {
    const clone = await factory.$clone.staticCall(implementation).then(address => implementation.attach(address));
    const tx = await (opts.deployValue
      ? factory.$clone(implementation, ethers.Typed.uint256(opts.deployValue))
      : factory.$clone(implementation));
    if (opts.initData || opts.initValue) {
      await deployer.sendTransaction({ to: clone, value: opts.initValue ?? 0n, data: opts.initData ?? '0x' });
    }
    return Object.assign(clone, { deploymentTransaction: () => tx });
  };

  const newCloneDeterministic = async (opts = {}) => {
    const salt = opts.salt ?? ethers.randomBytes(32);
    const clone = await factory.$cloneDeterministic
      .staticCall(implementation, salt)
      .then(address => implementation.attach(address));
    const tx = await (opts.deployValue
      ? factory.$cloneDeterministic(implementation, salt, ethers.Typed.uint256(opts.deployValue))
      : factory.$cloneDeterministic(implementation, salt));
    if (opts.initData || opts.initValue) {
      await deployer.sendTransaction({ to: clone, value: opts.initValue ?? 0n, data: opts.initData ?? '0x' });
    }
    return Object.assign(clone, { deploymentTransaction: () => tx });
  };

  return { deployer, factory, implementation, newClone, newCloneDeterministic };
}

describe('Clones', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('clone', function () {
    beforeEach(async function () {
      this.createClone = this.newClone;
    });

    shouldBehaveLikeClone();
  });

  describe('cloneDeterministic', function () {
    beforeEach(async function () {
      this.createClone = this.newCloneDeterministic;
    });

    shouldBehaveLikeClone();

    it('revert if address already used', async function () {
      const salt = ethers.randomBytes(32);

      // deploy once
      await expect(this.factory.$cloneDeterministic(this.implementation, salt)).to.emit(
        this.factory,
        'return$cloneDeterministic_address_bytes32',
      );

      // deploy twice
      await expect(this.factory.$cloneDeterministic(this.implementation, salt)).to.be.revertedWithCustomError(
        this.factory,
        'FailedDeployment',
      );
    });

    it('address prediction', async function () {
      const salt = ethers.randomBytes(32);

      const creationCode = ethers.concat([
        '0x3d602d80600a3d3981f3363d3d373d3d3d363d73',
        this.implementation.target,
        '0x5af43d82803e903d91602b57fd5bf3',
      ]);

      const predicted = await this.factory.$predictDeterministicAddress(this.implementation, salt);
      const expected = ethers.getCreate2Address(this.factory.target, salt, ethers.keccak256(creationCode));
      expect(predicted).to.equal(expected);

      await expect(this.factory.$cloneDeterministic(this.implementation, salt))
        .to.emit(this.factory, 'return$cloneDeterministic_address_bytes32')
        .withArgs(predicted);
    });
  });
});
