const { balance, ether, expectEvent, expectRevert, send } = require('@openzeppelin/test-helpers');
const { computeCreate2Address } = require('../helpers/create2');
const { expect } = require('chai');

const Create2 = artifacts.require('$Create2');
const VestingWallet = artifacts.require('VestingWallet');
const ERC1820Implementer = artifacts.require('$ERC1820Implementer');

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
    it('deploys a ERC1820Implementer from inline assembly code', async function () {
      const offChainComputed = computeCreate2Address(saltHex, ERC1820Implementer.bytecode, this.factory.address);

      expectEvent(await this.factory.$deploy(0, saltHex, ERC1820Implementer.bytecode), 'return$deploy', {
        addr: offChainComputed,
      });

      expect(ERC1820Implementer.bytecode).to.include((await web3.eth.getCode(offChainComputed)).slice(2));
    });

    it('deploys a contract with constructor arguments', async function () {
      const offChainComputed = computeCreate2Address(saltHex, constructorByteCode, this.factory.address);

      expectEvent(await this.factory.$deploy(0, saltHex, constructorByteCode), 'return$deploy', {
        addr: offChainComputed,
      });

      expect(await VestingWallet.at(offChainComputed).then(instance => instance.beneficiary())).to.be.equal(other);
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

      await expectRevert(this.factory.$deploy(0, saltHex, constructorByteCode), 'Create2: Failed on deploy');
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expectRevert(this.factory.$deploy(0, saltHex, '0x'), 'Create2: bytecode length is zero');
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expectRevert(this.factory.$deploy(1, saltHex, constructorByteCode), 'Create2: insufficient balance');
    });
  });
});
