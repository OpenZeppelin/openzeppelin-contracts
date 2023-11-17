const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeClone = require('./Clones.behaviour');

describe('Clones', function () {
  describe('clone', function () {
    const fixture = async () => {
      const [deployer] = await ethers.getSigners();

      const implementation = await ethers.deployContract('DummyImplementation');

      const createClone = async (initData, opts = {}) => {
        const factory = await ethers.deployContract('$Clones');
        const address = await factory.$clone.staticCall(implementation);
        await factory.$clone(implementation);
        await deployer.sendTransaction({ to: address, value: opts.value, data: initData });

        return address;
      };

      return { deployer, implementation, createClone };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeClone();
  });

  describe('cloneDeterministic', function () {
    const fixture = async () => {
      const [deployer] = await ethers.getSigners();

      const implementation = await ethers.deployContract('DummyImplementation');

      const createClone = async (initData, opts = {}) => {
        const salt = ethers.hexlify(ethers.randomBytes(32));
        const factory = await ethers.deployContract('$Clones');
        const address = await factory.$cloneDeterministic.staticCall(implementation, salt);
        await factory.$cloneDeterministic(implementation, salt);
        await deployer.sendTransaction({ to: address, value: opts.value, data: initData });
        return address;
      };

      return { deployer, implementation, createClone };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeClone();

    it('address already used', async function () {
      const implementation = ethers.Wallet.createRandom().address;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const factory = await ethers.deployContract('$Clones');
      // deploy once
      await expect(factory.$cloneDeterministic(implementation, salt)).to.emit(factory, 'return$cloneDeterministic');
      // deploy twice
      await expect(factory.$cloneDeterministic(implementation, salt)).to.be.revertedWithCustomError(
        factory,
        'ERC1167FailedCreateClone',
      );
    });

    it('address prediction', async function () {
      const implementation = ethers.Wallet.createRandom().address;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const factory = await ethers.deployContract('$Clones');
      const predicted = await factory.$predictDeterministicAddress(implementation, salt);

      const creationCode = ethers.getBytes(
        ethers.concat([
          '0x3d602d80600a3d3981f3363d3d373d3d3d363d73',
          implementation,
          '0x5af43d82803e903d91602b57fd5bf3',
        ]),
      );

      expect(ethers.getCreate2Address(factory.target, salt, ethers.keccak256(creationCode))).to.be.equal(predicted);

      await expect(factory.$cloneDeterministic(implementation, salt))
        .to.emit(factory, 'return$cloneDeterministic')
        .withArgs(predicted);
    });
  });
});
