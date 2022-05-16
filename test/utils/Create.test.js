const { balance, BN, ether, send } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../helpers/customError');

const { expect } = require('chai');
const { Address } = require('ethereumjs-util');
const { web3 } = require('hardhat');

const CreateImpl = artifacts.require('CreateImpl');
const ERC20Mock = artifacts.require('ERC20Mock');
const ERC1820Implementer = artifacts.require('ERC1820Implementer');

async function setNonce (address, nonce) {
  // eslint-disable-next-line no-undef
  await network.provider.send('hardhat_setNonce', [address, nonce]);
}

contract('Create', function (accounts) {
  const [deployerAccount] = accounts;

  const encodedParams = web3.eth.abi.encodeParameters(
    ['string', 'string', 'address', 'uint256'],
    ['MyToken', 'MTKN', deployerAccount, 100],
  ).slice(2);

  const constructorByteCode = `${ERC20Mock.bytecode}${encodedParams}`;

  beforeEach(async function () {
    this.factory = await CreateImpl.new();
  });

  describe('computeAddress', function () {
    it('computes the correct contract address - case 1: nonce 0x00', async function () {
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      expect(onChainComputed).to.equal(web3.utils.toChecksumAddress(offChainComputed));
    });

    it('computes the correct contract address - case 2: nonce 0x7f', async function () {
      setNonce(this.factory.address, '0x7f');
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      expect(onChainComputed).to.equal(web3.utils.toChecksumAddress(offChainComputed));
    });

    it('computes the correct contract address - case 3: nonce 0xff', async function () {
      setNonce(this.factory.address, '0xff');
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      expect(onChainComputed).to.equal(web3.utils.toChecksumAddress(offChainComputed));
    });

    it('computes the correct contract address - case 4: nonce 0xffff', async function () {
      setNonce(this.factory.address, '0xffff');
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      expect(onChainComputed).to.equal(web3.utils.toChecksumAddress(offChainComputed));
    });

    it('computes the correct contract address - case 5: nonce 0xffffff', async function () {
      setNonce(this.factory.address, '0xffffff');
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      expect(onChainComputed).to.equal(web3.utils.toChecksumAddress(offChainComputed));
    });

    it('computes the correct contract address - case 6: nonce 0xffffffa', async function () {
      setNonce(this.factory.address, '0xffffffa');
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      expect(onChainComputed).to.equal(web3.utils.toChecksumAddress(offChainComputed));
    });
  });

  describe('deploy', function () {
    it('deploys an ERC1820Implementer from inline assembly code', async function () {
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      await this.factory.deployERC1820Implementer(0);
      expect(ERC1820Implementer.bytecode).to
        .include((await web3.eth.getCode(offChainComputed)).slice(2));
    });

    it('deploys an ERC20Mock with correct balances', async function () {
      const from = Address.fromString(this.factory.address);
      const offChainComputed =
        Address.generate(from, new BN(await web3.eth.getTransactionCount(from.toString()))).toString();
      await this.factory.deploy(0, constructorByteCode);
      const erc20 = await ERC20Mock.at(offChainComputed);
      expect(await erc20.balanceOf(deployerAccount)).to.be.bignumber.equal(new BN(100));
    });

    it('deploys a contract with funds deposited in the factory', async function () {
      const deposit = ether('2');
      await send.ether(deployerAccount, this.factory.address, deposit);
      expect(await balance.current(this.factory.address)).to.be.bignumber.equal(deposit);
      const onChainComputed = await this.factory
        .computeAddress(this.factory.address, await web3.eth.getTransactionCount(this.factory.address));
      await this.factory.deploy(deposit, constructorByteCode);
      expect(await balance.current(onChainComputed)).to.be.bignumber.equal(deposit);
    });

    it('fails deploying a contract with invalid constructor bytecode', async function () {
      await expectRevertCustomError(
        this.factory.deploy(0, 0x1), `Failed("${this.factory.address}")`,
      );
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expectRevertCustomError(
        this.factory.deploy(0, '0x'), `ZeroBytecodeLength("${this.factory.address}")`,
      );
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expectRevertCustomError(
        this.factory.deploy(1, constructorByteCode), `InsufficientBalance("${this.factory.address}")`,
      );
    });
  });
});
