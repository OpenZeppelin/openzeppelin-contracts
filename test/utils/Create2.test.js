const { balance, BN, ether, expectRevert, send } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const Create2Impl = artifacts.require('Create2Impl');
const ERC20Mock = artifacts.require('ERC20Mock');
const ERC1820Implementer = artifacts.require('ERC1820Implementer');

contract('Create2', function (accounts) {
  const [deployerAccount] = accounts;

  const salt = 'salt message';
  const saltHex = web3.utils.soliditySha3(salt);

  const encodedParams = web3.eth.abi.encodeParameters(
    ['string', 'string', 'address', 'uint256'],
    ['MyToken', 'MTKN', deployerAccount, 100],
  ).slice(2);

  const constructorByteCode = `${ERC20Mock.bytecode}${encodedParams}`;

  beforeEach(async function () {
    this.factory = await Create2Impl.new();
  });
  describe('computeAddress', function () {
    it('computes the correct contract address', async function () {
      const onChainComputed = await this.factory
        .computeAddress(saltHex, web3.utils.keccak256(constructorByteCode));
      const offChainComputed =
        computeCreate2Address(saltHex, constructorByteCode, this.factory.address);
      expect(onChainComputed).to.equal(offChainComputed);
    });

    it('computes the correct contract address with deployer', async function () {
      const onChainComputed = await this.factory
        .computeAddressWithDeployer(saltHex, web3.utils.keccak256(constructorByteCode), deployerAccount);
      const offChainComputed =
        computeCreate2Address(saltHex, constructorByteCode, deployerAccount);
      expect(onChainComputed).to.equal(offChainComputed);
    });
  });

  describe('deploy', function () {
    it('deploys a ERC1820Implementer from inline assembly code', async function () {
      const offChainComputed =
        computeCreate2Address(saltHex, ERC1820Implementer.bytecode, this.factory.address);
      await this.factory.deployERC1820Implementer(0, saltHex);
      expect(ERC1820Implementer.bytecode).to.include((await web3.eth.getCode(offChainComputed)).slice(2));
    });

    it('deploys a ERC20Mock with correct balances', async function () {
      const offChainComputed = computeCreate2Address(saltHex, constructorByteCode, this.factory.address);

      await this.factory.deploy(0, saltHex, constructorByteCode);

      const erc20 = await ERC20Mock.at(offChainComputed);
      expect(await erc20.balanceOf(deployerAccount)).to.be.bignumber.equal(new BN(100));
    });

    it('deploys a contract with funds deposited in the factory', async function () {
      const deposit = ether('2');
      await send.ether(deployerAccount, this.factory.address, deposit);
      expect(await balance.current(this.factory.address)).to.be.bignumber.equal(deposit);

      const onChainComputed = await this.factory
        .computeAddressWithDeployer(saltHex, web3.utils.keccak256(constructorByteCode), this.factory.address);

      await this.factory.deploy(deposit, saltHex, constructorByteCode);
      expect(await balance.current(onChainComputed)).to.be.bignumber.equal(deposit);
    });

    it('fails deploying a contract in an existent address', async function () {
      await this.factory.deploy(0, saltHex, constructorByteCode, { from: deployerAccount });
      await expectRevert(
        this.factory.deploy(0, saltHex, constructorByteCode, { from: deployerAccount }), 'Create2: Failed on deploy',
      );
    });

    it('fails deploying a contract if the bytecode length is zero', async function () {
      await expectRevert(
        this.factory.deploy(0, saltHex, '0x', { from: deployerAccount }), 'Create2: bytecode length is zero',
      );
    });

    it('fails deploying a contract if factory contract does not have sufficient balance', async function () {
      await expectRevert(
        this.factory.deploy(1, saltHex, constructorByteCode, { from: deployerAccount }),
        'Create2: insufficient balance',
      );
    });
  });
});

function computeCreate2Address (saltHex, bytecode, deployer) {
  return web3.utils.toChecksumAddress(`0x${web3.utils.sha3(`0x${[
    'ff',
    deployer,
    saltHex,
    web3.utils.soliditySha3(bytecode),
  ].map(x => x.replace(/0x/, '')).join('')}`).slice(-40)}`);
}
