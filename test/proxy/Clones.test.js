const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeClone = require('./Clones.behaviour');

async function fixture() {
  const [deployer] = await ethers.getSigners();

  const factory = await ethers.deployContract('$Clones');
  const implementation = await ethers.deployContract('DummyImplementation');

  const newClone = async (initData, opts = {}) => {
    const clone = await factory.$clone.staticCall(implementation).then(address => implementation.attach(address));
    await factory.$clone(implementation);
    await deployer.sendTransaction({ to: clone, value: opts.value ?? 0n, data: initData ?? '0x' });
    return clone;
  };

  const newCloneDeterministic = async (initData, opts = {}) => {
    const salt = opts.salt ?? ethers.randomBytes(32);
    const clone = await factory.$cloneDeterministic
      .staticCall(implementation, salt)
      .then(address => implementation.attach(address));
    await factory.$cloneDeterministic(implementation, salt);
    await deployer.sendTransaction({ to: clone, value: opts.value ?? 0n, data: initData ?? '0x' });
    return clone;
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
        'return$cloneDeterministic',
      );

      // deploy twice
      await expect(this.factory.$cloneDeterministic(this.implementation, salt)).to.be.revertedWithCustomError(
        this.factory,
        'ERC1167FailedCreateClone',
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
        .to.emit(this.factory, 'return$cloneDeterministic')
        .withArgs(predicted);
    });
  });
});
