const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { generators } = require('../helpers/random');

const shouldBehaveLikeClone = require('./Clones.behaviour');

const cloneInitCode = (instance, args = undefined) =>
  args
    ? ethers.concat([
        '0x61',
        ethers.toBeHex(0x2d + ethers.getBytes(args).length, 2),
        '0x3d81600a3d39f3363d3d373d3d3d363d73',
        instance.target ?? instance.address ?? instance,
        '0x5af43d82803e903d91602b57fd5bf3',
        args,
      ])
    : ethers.concat([
        '0x3d602d80600a3d3981f3363d3d373d3d3d363d73',
        instance.target ?? instance.address ?? instance,
        '0x5af43d82803e903d91602b57fd5bf3',
      ]);

async function fixture() {
  const [deployer] = await ethers.getSigners();

  const factory = await ethers.deployContract('$Clones');
  const implementation = await ethers.deployContract('DummyImplementation');

  const newClone =
    args =>
    async (opts = {}) => {
      const clone = await (
        args
          ? factory.$cloneWithImmutableArgs.staticCall(implementation, args)
          : factory.$clone.staticCall(implementation)
      ).then(address => implementation.attach(address));
      const tx = await (args
        ? opts.deployValue
          ? factory.$cloneWithImmutableArgs(implementation, args, ethers.Typed.uint256(opts.deployValue))
          : factory.$cloneWithImmutableArgs(implementation, args)
        : opts.deployValue
          ? factory.$clone(implementation, ethers.Typed.uint256(opts.deployValue))
          : factory.$clone(implementation));
      if (opts.initData || opts.initValue) {
        await deployer.sendTransaction({ to: clone, value: opts.initValue ?? 0n, data: opts.initData ?? '0x' });
      }
      return Object.assign(clone, { deploymentTransaction: () => tx });
    };

  const newCloneDeterministic =
    args =>
    async (opts = {}) => {
      const salt = opts.salt ?? ethers.randomBytes(32);
      const clone = await (
        args
          ? factory.$cloneDeterministicWithImmutableArgs.staticCall(implementation, args, salt)
          : factory.$cloneDeterministic.staticCall(implementation, salt)
      ).then(address => implementation.attach(address));
      const tx = await (args
        ? opts.deployValue
          ? factory.$cloneDeterministicWithImmutableArgs(
              implementation,
              args,
              salt,
              ethers.Typed.uint256(opts.deployValue),
            )
          : factory.$cloneDeterministicWithImmutableArgs(implementation, args, salt)
        : opts.deployValue
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

  for (const args of [undefined, '0x', '0x11223344']) {
    describe(args ? `with immutable args: ${args}` : 'without immutable args', function () {
      describe('clone', function () {
        beforeEach(async function () {
          this.createClone = this.newClone(args);
        });

        shouldBehaveLikeClone();

        it('get immutable arguments', async function () {
          const instance = await this.createClone();
          expect(await this.factory.$fetchCloneArgs(instance)).to.equal(args ?? '0x');
        });
      });

      describe('cloneDeterministic', function () {
        beforeEach(async function () {
          this.createClone = this.newCloneDeterministic(args);
        });

        shouldBehaveLikeClone();

        it('get immutable arguments', async function () {
          const instance = await this.createClone();
          expect(await this.factory.$fetchCloneArgs(instance)).to.equal(args ?? '0x');
        });

        it('revert if address already used', async function () {
          const salt = ethers.randomBytes(32);

          const deployClone = () =>
            args
              ? this.factory.$cloneDeterministicWithImmutableArgs(this.implementation, args, salt)
              : this.factory.$cloneDeterministic(this.implementation, salt);

          // deploy once
          await expect(deployClone()).to.not.be.reverted;

          // deploy twice
          await expect(deployClone()).to.be.revertedWithCustomError(this.factory, 'FailedDeployment');
        });

        it('address prediction', async function () {
          const salt = ethers.randomBytes(32);

          const expected = ethers.getCreate2Address(
            this.factory.target,
            salt,
            ethers.keccak256(cloneInitCode(this.implementation, args)),
          );

          if (args) {
            const predicted = await this.factory.$predictDeterministicAddressWithImmutableArgs(
              this.implementation,
              args,
              salt,
            );
            expect(predicted).to.equal(expected);

            await expect(this.factory.$cloneDeterministicWithImmutableArgs(this.implementation, args, salt))
              .to.emit(this.factory, 'return$cloneDeterministicWithImmutableArgs_address_bytes_bytes32')
              .withArgs(predicted);
          } else {
            const predicted = await this.factory.$predictDeterministicAddress(this.implementation, salt);
            expect(predicted).to.equal(expected);

            await expect(this.factory.$cloneDeterministic(this.implementation, salt))
              .to.emit(this.factory, 'return$cloneDeterministic_address_bytes32')
              .withArgs(predicted);
          }
        });
      });
    });
  }

  it('EIP-170 limit on immutable args', async function () {
    // EIP-170 limits the contract code size to 0x6000
    // This limits the length of immutable args to 0x5fd3
    const args = generators.hexBytes(0x5fd4);
    const salt = ethers.randomBytes(32);

    await expect(
      this.factory.$predictDeterministicAddressWithImmutableArgs(this.implementation, args, salt),
    ).to.be.revertedWithCustomError(this.factory, 'CloneArgumentsTooLong');

    await expect(this.factory.$cloneWithImmutableArgs(this.implementation, args)).to.be.revertedWithCustomError(
      this.factory,
      'CloneArgumentsTooLong',
    );
  });
});
