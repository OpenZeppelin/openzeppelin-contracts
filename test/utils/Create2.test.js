const { balance, ether, expectEvent, expectRevert, send } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { computeCreate2Address } = require('../helpers/create');
const { expectRevertCustomError } = require('../helpers/customError');

const Create2 = artifacts.require('$Create2');
const VestingWallet = artifacts.require('VestingWallet');
// This should be a contract that:
// - has no constructor arguments
// - has no immutable variable populated during construction
const ConstructorLessContract = Create2;

contract('Create2', function (accounts) {
  const [deployerAccount, other] = accounts;

  const salt = 'salt message';
  const saltHex = web3.utils.soliditySha3(salt);

  const encodedParams = web3.eth.abi.encodeParameters(['address', 'uint64', 'uint64'], [other, 0, 0]).slice(2);

  const constructorByteCode = `${VestingWallet.bytecode}${encodedParams}`;

  beforeEach(async function () {
    this.factory = await Create2.new();
  });
  describe('computeAddress', function () {
    it('computes the correct contract address', async function () {
      const onChainComputed = await this.factory.$computeAddress(saltHex, web3.utils.keccak256(constructorByteCode));
      const offChainComputed = computeCreate2Address(saltHex, constructorByteCode, this.factory.address);
      expect(onChainComputed).to.equal(offChainComputed);
    });

    it('computes the correct contract address with deployer', async function () {
      const onChainComputed = await this.factory.$computeAddress(
        saltHex,
        web3.utils.keccak256(constructorByteCode),
        deployerAccount,
      );
      const offChainComputed = computeCreate2Address(saltHex, constructorByteCode, deployerAccount);
      expect(onChainComputed).to.equal(offChainComputed);
    });
  });

  describe('deploy', function () {
    it('deploys a contract without constructor', async function () {
      const offChainComputed = computeCreate2Address(saltHex, ConstructorLessContract.bytecode, this.factory.address);

      expectEvent(await this.factory.$deploy(0, saltHex, ConstructorLessContract.bytecode), 'return$deploy', {
        addr: offChainComputed,
      });

      expect(ConstructorLessContract.bytecode).to.include((await web3.eth.getCode(offChainComputed)).slice(2));
    });

    it('deploys a contract with constructor arguments', async function () {
      const offChainComputed = computeCreate2Address(saltHex, constructorByteCode, this.factory.address);

      expectEvent(await this.factory.$deploy(0, saltHex, constructorByteCode), 'return$deploy', {
        addr: offChainComputed,
      });

      const instance = await VestingWallet.at(offChainComputed);

      expect(await instance.owner()).to.be.equal(other);
    });

    it('deploys a contract with funds deposited in the factory', async function () {
      const deposit = ether('2');
      await send.ether(deployerAccount, this.factory.address, deposit);
      expect(await balance.current(this.factory.address)).to.be.bignumber.equal(deposit);

      const offChainComputed = computeCreate2Address(saltHex, constructorByteCode, this.factory.address);

      expectEvent(await this.factory.$deploy(deposit, saltHex, constructorByteCode), 'return$deploy', {
        addr: offChainComputed,
      });

      expect(await balance.current(offChainComputed)).to.be.bignumber.equal(deposit);
    });

    it('fails deploying a contract in an existent address', async function () {
      expectEvent(await this.factory.$deploy(0, saltHex, constructorByteCode), 'return$deploy');

      // TODO: Make sure it actually throws "Create2FailedDeployment".
      // For some unknown reason, the revert reason sometimes return:
      // `revert with unrecognized return data or custom error`
      await expectRevert.unspecified(this.factory.$deploy(0, saltHex, constructorByteCode));
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expectRevertCustomError(this.factory.$deploy(0, saltHex, '0x'), 'Create2EmptyBytecode', []);
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expectRevertCustomError(
        this.factory.$deploy(1, saltHex, constructorByteCode),
        'Create2InsufficientBalance',
        [0, 1],
      );
    });
  });
});
