const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, takeSnapshot } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const { RevertType } = require('../helpers/enums');

const PROXY_INITCODE_HASH = '0xd61bbde0460e6c48ddd99fb8b7e1ad36529d2ec79cbac1db0300b3d26ddcdc2a';
const getCreate3Address = (deployer, salt) =>
  ethers.getCreateAddress({ from: ethers.getCreate2Address(deployer, salt, PROXY_INITCODE_HASH), nonce: 1 });

async function fixture() {
  const [deployer, other] = await ethers.getSigners();

  const factory = await ethers.deployContract('$Create3');

  // Bytecode for deploying a contract that includes a constructor.
  // We use a vesting wallet, with 3 constructor arguments.
  const constructorByteCode = await ethers
    .getContractFactory('VestingWallet')
    .then(factory => ethers.concat([factory.bytecode, factory.interface.encodeDeploy([other.address, 0n, 0n])]));

  // Bytecode for deploying a contract that has no constructor logic.
  // Here we use the Create2 helper factory.
  const constructorLessBytecode = await ethers
    .getContractFactory('$Create2')
    .then(factory => ethers.concat([factory.bytecode, factory.interface.encodeDeploy([])]));

  const mockFactory = await ethers.getContractFactory('ConstructorMock');

  return { deployer, other, factory, constructorByteCode, constructorLessBytecode, mockFactory };
}

describe('Create3', function () {
  const salt = 'salt message';
  const saltHex = ethers.id(salt);

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('computeAddress', function () {
    it('computes the correct contract address', async function () {
      await expect(this.factory.$computeAddress(saltHex)).to.eventually.equal(
        getCreate3Address(this.factory.target, saltHex),
      );
    });

    it('computes the correct contract address with deployer', async function () {
      await expect(this.factory.$computeAddress(saltHex, ethers.Typed.address(this.deployer))).to.eventually.equal(
        getCreate3Address(this.deployer.address, saltHex),
      );
    });
  });

  describe('deploy', function () {
    it('deploys a contract without constructor', async function () {
      const offChainComputed = getCreate3Address(this.factory.target, saltHex);

      await expect(this.factory.$deploy(0n, saltHex, this.constructorLessBytecode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      expect(this.constructorLessBytecode).to.include((await ethers.provider.getCode(offChainComputed)).slice(2));
    });

    it('deploys a contract with constructor arguments', async function () {
      const offChainComputed = getCreate3Address(this.factory.target, saltHex);

      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      const instance = await ethers.getContractAt('VestingWallet', offChainComputed);

      await expect(instance.owner()).to.eventually.equal(this.other);
    });

    it('deploys a contract with funds deposited in the factory', async function () {
      const value = 10n;

      await this.deployer.sendTransaction({ to: this.factory, value });

      const offChainComputed = getCreate3Address(this.factory.target, saltHex);

      await expect(ethers.provider.getBalance(this.factory)).to.eventually.equal(value);
      await expect(ethers.provider.getBalance(offChainComputed)).to.eventually.equal(0n);

      await expect(this.factory.$deploy(value, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      await expect(ethers.provider.getBalance(this.factory)).to.eventually.equal(0n);
      await expect(ethers.provider.getBalance(offChainComputed)).to.eventually.equal(value);
    });

    it('produces the same address regardless of the deployed bytecode', async function () {
      const offChainComputed = getCreate3Address(this.factory.target, saltHex);
      const snapshot = await takeSnapshot();

      await expect(this.factory.$deploy(0n, saltHex, this.constructorLessBytecode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      await snapshot.restore();

      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);
    });

    it('fails deploying a contract in an existent address', async function () {
      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode)).to.emit(this.factory, 'return$deploy');

      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode)).to.be.revertedWithCustomError(
        this.factory,
        'FailedDeployment',
      );
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expect(this.factory.$deploy(0n, saltHex, '0x')).to.be.revertedWithCustomError(
        this.factory,
        'Create3EmptyBytecode',
      );
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expect(this.factory.$deploy(1n, saltHex, this.constructorByteCode))
        .to.be.revertedWithCustomError(this.factory, 'InsufficientBalance')
        .withArgs(0n, 1n);
    });

    describe('reverts error thrown during contract creation', function () {
      it('bubbles up without message', async function () {
        await expect(
          this.factory.$deploy(
            0n,
            saltHex,
            ethers.concat([
              this.mockFactory.bytecode,
              this.mockFactory.interface.encodeDeploy([RevertType.RevertWithoutMessage]),
            ]),
          ),
        ).to.be.revertedWithCustomError(this.factory, 'FailedDeployment');
      });

      it('bubbles up message', async function () {
        await expect(
          this.factory.$deploy(
            0n,
            saltHex,
            ethers.concat([
              this.mockFactory.bytecode,
              this.mockFactory.interface.encodeDeploy([RevertType.RevertWithMessage]),
            ]),
          ),
        ).to.be.revertedWith('ConstructorMock: reverting');
      });

      it('bubbles up custom error', async function () {
        await expect(
          this.factory.$deploy(
            0n,
            saltHex,
            ethers.concat([
              this.mockFactory.bytecode,
              this.mockFactory.interface.encodeDeploy([RevertType.RevertWithCustomError]),
            ]),
          ),
        ).to.be.revertedWithCustomError({ interface: this.mockFactory.interface }, 'CustomError');
      });

      it('bubbles up panic', async function () {
        await expect(
          this.factory.$deploy(
            0n,
            saltHex,
            ethers.concat([this.mockFactory.bytecode, this.mockFactory.interface.encodeDeploy([RevertType.Panic])]),
          ),
        ).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
      });
    });
  });
});
