const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeClone = require('./Clones.behaviour');

async function fixture() {
  const [deployer] = await ethers.getSigners();

  const factory = await ethers.deployContract('$Clones');
  const implementation = await ethers.deployContract('DummyImplementation');

  const newClone =
    args =>
    async (opts = {}) => {
      const clone = await factory.$clone.staticCall(implementation).then(address => implementation.attach(address));
      const tx = await (opts.deployValue
        ? args
          ? factory.$cloneWithImmutableArgs(implementation, args, ethers.Typed.uint256(opts.deployValue))
          : factory.$clone(implementation, ethers.Typed.uint256(opts.deployValue))
        : args
        ? factory.$cloneWithImmutableArgs(implementation, args)
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
      const clone = await factory.$cloneDeterministic
        .staticCall(implementation, salt)
        .then(address => implementation.attach(address));
      const tx = await (opts.deployValue
        ? args
          ? factory.$cloneWithImmutableArgsDeterministic(
              implementation,
              args,
              salt,
              ethers.Typed.uint256(opts.deployValue),
            )
          : factory.$cloneDeterministic(implementation, salt, ethers.Typed.uint256(opts.deployValue))
        : args
        ? factory.$cloneWithImmutableArgsDeterministic(implementation, args, salt)
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
          this.createClone = this.newCloneDeterministic(undefined);
        });

        shouldBehaveLikeClone();

        it('revert if address already used', async function () {
          const salt = ethers.randomBytes(32);

          const deployClone = () =>
            args
              ? this.factory.$cloneWithImmutableArgsDeterministic(this.implementation, args, salt)
              : this.factory.$cloneDeterministic(this.implementation, salt);

          // deploy once
          await expect(deployClone()).to.not.be.reverted;

          // deploy twice
          await expect(deployClone()).to.be.revertedWithCustomError(this.factory, 'FailedDeployment');
        });

        it('address prediction', async function () {
          const salt = ethers.randomBytes(32);

          if (args) {
            const expected = ethers.getCreate2Address(
              this.factory.target,
              salt,
              ethers.keccak256(
                ethers.concat([
                  '0x3d61',
                  ethers.toBeHex(0x2d + ethers.getBytes(args).length, 2),
                  '0x80600b3d3981f3363d3d373d3d3d363d73',
                  this.implementation.target,
                  '0x5af43d82803e903d91602b57fd5bf3',
                  args,
                ]),
              ),
            );

            const predicted = await this.factory.$predictWithImmutableArgsDeterministicAddress(
              this.implementation,
              args,
              salt,
            );
            expect(predicted).to.equal(expected);

            await expect(this.factory.$cloneWithImmutableArgsDeterministic(this.implementation, args, salt))
              .to.emit(this.factory, 'return$cloneWithImmutableArgsDeterministic_address_bytes_bytes32')
              .withArgs(predicted);
          } else {
            const expected = ethers.getCreate2Address(
              this.factory.target,
              salt,
              ethers.keccak256(
                ethers.concat([
                  '0x3d602d80600a3d3981f3363d3d373d3d3d363d73',
                  this.implementation.target,
                  '0x5af43d82803e903d91602b57fd5bf3',
                ]),
              ),
            );

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
});
