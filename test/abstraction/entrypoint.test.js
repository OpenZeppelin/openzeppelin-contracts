const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { ERC4337Context } = require('../helpers/erc4337');

async function fixture() {
  const accounts = await ethers.getSigners();
  const context = new ERC4337Context();
  await context.wait();

  return {
    accounts,
    context,
    entrypoint: context.entrypoint,
    factory: context.factory,
  };
}

describe('EntryPoint', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('', async function () {
    const user = this.accounts[0];
    const beneficiary = this.accounts[1];
    const sender = await this.context.newAccount(user);

    expect(await ethers.provider.getCode(sender)).to.equal('0x');

    await user.sendTransaction({ to: sender, value: ethers.parseEther('1') });

    const operation = sender.createOp({}, true);
    await expect(this.entrypoint.handleOps([operation.packed], beneficiary))
      .to.emit(sender, 'OwnershipTransferred')
      .withArgs(ethers.ZeroAddress, user)
      .to.emit(this.factory, 'return$deploy')
      .withArgs(sender)
      .to.emit(this.entrypoint, 'AccountDeployed')
      .withArgs(operation.hash, sender, this.context.factory, ethers.ZeroAddress)
      .to.emit(this.entrypoint, 'Transfer')
      .withArgs(ethers.ZeroAddress, sender, anyValue)
      .to.emit(this.entrypoint, 'BeforeExecution')
      // BeforeExecution has no args
      .to.emit(this.entrypoint, 'UserOperationEvent')
      .withArgs(operation.hash, sender, ethers.ZeroAddress, operation.nonce, true, anyValue, anyValue);

    expect(await ethers.provider.getCode(sender)).to.not.equal('0x');
  });
});
