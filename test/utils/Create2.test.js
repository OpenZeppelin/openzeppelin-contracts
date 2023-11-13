const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const Create2 = '$Create2';
const VestingWallet = 'VestingWallet';
// This should be a contract that:
// - has no constructor arguments
// - has no immutable variable populated during construction
const ConstructorLessBytecode = Create2;

async function fixture() {
  const [deployerAccount, other] = await ethers.getSigners();

  const factory = await ethers.deployContract(Create2);
  const encodedParams = ethers.AbiCoder.defaultAbiCoder()
    .encode(['address', 'uint64', 'uint64'], [other.address, 0, 0])
    .slice(2);

  const VestingWalletFactory = await ethers.getContractFactory(VestingWallet);
  const constructorByteCode = `${VestingWalletFactory.bytecode}${encodedParams}`;
  const { bytecode: constructorLessBytecode } = await ethers.getContractFactory(ConstructorLessBytecode);

  return { deployerAccount, other, factory, encodedParams, constructorByteCode, constructorLessBytecode };
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
        ethers.Typed.address(this.deployerAccount),
      );
      const offChainComputed = ethers.getCreate2Address(
        this.deployerAccount.address,
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

      await expect(this.factory.$deploy(0, saltHex, this.constructorLessBytecode))
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

      await expect(this.factory.$deploy(0, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      const instance = await ethers.getContractAt(VestingWallet, offChainComputed);

      expect(await instance.owner()).to.be.equal(this.other.address);
    });

    it('deploys a contract with funds deposited in the factory', async function () {
      const deposit = ethers.parseEther('2');
      await this.deployerAccount.sendTransaction({ to: this.factory, value: deposit });
      expect(await ethers.provider.getBalance(this.factory)).to.be.equal(deposit);

      const offChainComputed = ethers.getCreate2Address(
        this.factory.target,
        saltHex,
        ethers.keccak256(this.constructorByteCode),
      );

      await expect(this.factory.$deploy(deposit, saltHex, this.constructorByteCode))
        .to.emit(this.factory, 'return$deploy')
        .withArgs(offChainComputed);

      expect(await ethers.provider.getBalance(offChainComputed)).to.be.equal(deposit);
    });

    it('fails deploying a contract in an existent address', async function () {
      await expect(this.factory.$deploy(0, saltHex, this.constructorByteCode)).to.emit(this.factory, 'return$deploy');

      await expect(this.factory.$deploy(0, saltHex, this.constructorByteCode)).to.be.revertedWithCustomError(
        this.factory,
        'Create2FailedDeployment',
      );
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expect(this.factory.$deploy(0, saltHex, '0x')).to.be.revertedWithCustomError(
        this.factory,
        'Create2EmptyBytecode',
      );
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expect(this.factory.$deploy(1, saltHex, this.constructorByteCode))
        .to.be.revertedWithCustomError(this.factory, 'Create2InsufficientBalance')
        .withArgs(0, 1);
    });
  });
});
