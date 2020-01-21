const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const Create2Impl = contract.fromArtifact('Create2Impl');
const ERC20Mock = contract.fromArtifact('ERC20Mock');
const ERC20 = contract.fromArtifact('ERC20');

describe('Create2', function () {
  const [deployerAccount] = accounts;

  const salt = 'salt message';
  const saltHex = web3.utils.soliditySha3(salt);
  const constructorByteCode = `${ERC20Mock.bytecode}${web3.eth.abi
    .encodeParameters(['address', 'uint256'], [deployerAccount, 100]).slice(2)
  }`;

  beforeEach(async function () {
    this.factory = await Create2Impl.new();
  });

  it('should compute the correct contract address', async function () {
    const onChainComputed = await this.factory
      .computeAddress(saltHex, constructorByteCode);
    const offChainComputed =
      computeCreate2Address(saltHex, constructorByteCode, this.factory.address);
    expect(onChainComputed).to.equal(offChainComputed);
  });

  it('should compute the correct contract address with deployer', async function () {
    const onChainComputed = await this.factory
      .computeAddress(saltHex, constructorByteCode, deployerAccount);
    const offChainComputed =
      computeCreate2Address(saltHex, constructorByteCode, deployerAccount);
    expect(onChainComputed).to.equal(offChainComputed);
  });

  it('should deploy a ERC20 from inline assembly code', async function () {
    const offChainComputed =
      computeCreate2Address(saltHex, ERC20.bytecode, this.factory.address);
    await this.factory
      .deploy(saltHex, ERC20.bytecode, { from: deployerAccount });
    expect(ERC20.bytecode).to.include((await web3.eth.getCode(offChainComputed)).slice(2));
  });

  it('should deploy a ERC20Mock with correct balances', async function () {
    const offChainComputed =
      computeCreate2Address(saltHex, constructorByteCode, this.factory.address);
    await this.factory
      .deploy(saltHex, constructorByteCode, { from: deployerAccount });
    const erc20 = await ERC20Mock.at(offChainComputed);
    expect(await erc20.balanceOf(deployerAccount)).to.be.bignumber.equal(new BN(100));
  });

  it('should failed deploying a contract in an existent address', async function () {
    await this.factory.deploy(saltHex, constructorByteCode, { from: deployerAccount });
    await expectRevert(
      this.factory.deploy(saltHex, constructorByteCode, { from: deployerAccount }), 'Create2: Failed on deploy'
    );
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
