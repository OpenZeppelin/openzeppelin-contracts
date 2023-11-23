const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [deployer, other] = await ethers.getSigners();

  const factory = await ethers.deployContract('$Create2');

  // Bytecode for deploying a contract that includes a constructor.
  // We use a vesting wallet, with 3 constructor arguments.
  const constructorByteCode = await ethers
    .getContractFactory('VestingWallet')
    .then(({ bytecode, interface }) => ethers.concat([bytecode, interface.encodeDeploy([other.address, 0n, 0n])]));

  // Bytecode for deploying a contract that has no constructor log.
  // Here we use the Create2 helper factory.
  const constructorLessBytecode = await ethers
    .getContractFactory('$Create2')
    .then(({ bytecode, interface }) => ethers.concat([bytecode, interface.encodeDeploy([])]));

  return { deployer, other, factory, constructorByteCode, constructorLessBytecode };
}

describe('Create2', function () {
  const salt = 'salt message';
  const saltHex = ethers.id(salt);

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('computeAddress', function () {
    it('computes the correct contract address', async function () {
      const onChainComputed = await this.factory.$computeAddress(saltHex, ethers.keccak256(this.constructorByteCode));
      const offChainComputed = ethers.getCreate2Address(
        this.factory.target,
        saltHex,
        ethers.keccak256(this.constructorByteCode),
      );
      expect(onChainComputed).to.equal(offChainComputed);
    });

    it('computes the correct contract address with deployer', async function () {
      const onChainComputed = await this.factory.$computeAddress(
        saltHex,
        ethers.keccak256(this.constructorByteCode),
        ethers.Typed.address(this.deployer),
      );
      const offChainComputed = ethers.getCreate2Address(
        this.deployer.address,
        saltHex,
        ethers.keccak256(this.constructorByteCode),
      );
      expect(onChainComputed).to.equal(offChainComputed);
    });
  });

  describe('deploy', function () {
    it('deploys a contract without constructor', async function () {
      const offChainComputed = ethers.getCreate2Address(
        this.factory.target,
        saltHex,
        ethers.keccak256(this.constructorLessBytecode),
      );

      await expect(this.factory.$deploy(0n, saltHex, this.constructorLessBytecode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      expect(this.constructorLessBytecode).to.include((await web3.eth.getCode(offChainComputed)).slice(2));
    });

    it('deploys a contract with constructor arguments', async function () {
      const offChainComputed = ethers.getCreate2Address(
        this.factory.target,
        saltHex,
        ethers.keccak256(this.constructorByteCode),
      );

      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      const instance = await ethers.getContractAt('VestingWallet', offChainComputed);

      expect(await instance.owner()).to.equal(this.other.address);
    });

    it('deploys a contract with funds deposited in the factory', async function () {
      const value = 10n;

      await this.deployer.sendTransaction({ to: this.factory, value });

      const offChainComputed = ethers.getCreate2Address(
        this.factory.target,
        saltHex,
        ethers.keccak256(this.constructorByteCode),
      );

      expect(await ethers.provider.getBalance(this.factory)).to.equal(value);
      expect(await ethers.provider.getBalance(offChainComputed)).to.equal(0n);

      await expect(this.factory.$deploy(value, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      expect(await ethers.provider.getBalance(this.factory)).to.equal(0n);
      expect(await ethers.provider.getBalance(offChainComputed)).to.equal(value);
    });

    it('fails deploying a contract in an existent address', async function () {
      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode)).to.emit(this.factory, 'return$deploy');

      await expect(this.factory.$deploy(0n, saltHex, this.constructorByteCode)).to.be.revertedWithCustomError(
        this.factory,
        'Create2FailedDeployment',
      );
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expect(this.factory.$deploy(0n, saltHex, '0x')).to.be.revertedWithCustomError(
        this.factory,
        'Create2EmptyBytecode',
      );
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expect(this.factory.$deploy(1n, saltHex, this.constructorByteCode))
        .to.be.revertedWithCustomError(this.factory, 'Create2InsufficientBalance')
        .withArgs(0n, 1n);
    });
  });
});
