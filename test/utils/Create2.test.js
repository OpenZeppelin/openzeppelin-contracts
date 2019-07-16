const { BN, expectRevert } = require('openzeppelin-test-helpers');

const { buildCreate2Address } = require('../helpers/create2');

const Create2Impl = artifacts.require('Create2Impl');
const ERC20Mock = artifacts.require('ERC20Mock');

contract('Create2', function ([_, deployerAccount, notCreator]) {
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
      buildCreate2Address(saltHex, constructorByteCode, this.factory.address);
    onChainComputed.should.equal(offChainComputed);
  });

  it('should compute the correct contract address with deployer', async function () {
    const onChainComputed = await this.factory
      .computeAddress(saltHex, constructorByteCode, deployerAccount);
    const offChainComputed =
      buildCreate2Address(saltHex, constructorByteCode, deployerAccount);
    onChainComputed.should.equal(offChainComputed);
  });

  it('should deploy a ERC20Mock with correct balances', async function () {
    const offChainComputed =
      buildCreate2Address(saltHex, constructorByteCode, this.factory.address);
    await this.factory
      .deploy(saltHex, constructorByteCode, { from: deployerAccount });
    const erc20 = await ERC20Mock.at(offChainComputed);
    (await erc20.balanceOf(deployerAccount)).should.be.bignumber.equal(new BN(100));
  });

  it('should failed deploying a contract in an existent address', async function () {
    await this.factory.deploy(saltHex, constructorByteCode, { from: deployerAccount });
    await expectRevert.unspecified(
      this.factory.deploy(saltHex, constructorByteCode, { from: deployerAccount })
    );
  });
});
