const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { ERC4337Helper } = require('../helpers/erc4337');

async function fixture() {
  const accounts = await ethers.getSigners();
  const helper = new ERC4337Helper();
  await helper.wait();

  return {
    accounts,
    helper,
    entrypoint: helper.entrypoint,
    factory: helper.factory,
  };
}

describe('EntryPoint', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));

    this.user = this.accounts.shift();
    this.beneficiary = this.accounts.shift();
    this.sender = await this.helper.newAccount(this.user);
  });

  describe('deploy wallet contract', function () {
    it('success: counterfactual funding', async function () {
      await this.user.sendTransaction({ to: this.sender, value: ethers.parseEther('1') });

      expect(await ethers.provider.getCode(this.sender)).to.equal('0x');

      const operation = await this.sender.createOp({}, true);
      await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary))
        .to.emit(this.sender, 'OwnershipTransferred')
        .withArgs(ethers.ZeroAddress, this.user)
        .to.emit(this.factory, 'return$deploy')
        .withArgs(this.sender)
        .to.emit(this.entrypoint, 'AccountDeployed')
        .withArgs(operation.hash, this.sender, this.factory, ethers.ZeroAddress)
        .to.emit(this.entrypoint, 'Transfer')
        .withArgs(ethers.ZeroAddress, this.sender, anyValue)
        .to.emit(this.entrypoint, 'BeforeExecution')
        // BeforeExecution has no args
        .to.emit(this.entrypoint, 'UserOperationEvent')
        .withArgs(operation.hash, this.sender, ethers.ZeroAddress, operation.nonce, true, anyValue, anyValue);

      expect(await ethers.provider.getCode(this.sender)).to.not.equal('0x');
    });

    it.skip('[TODO] success: paymaster funding', async function () {
      // TODO: deploy paymaster
      // TODO: fund paymaster's account in entrypoint

      expect(await ethers.provider.getCode(this.sender)).to.equal('0x');

      // const operation = await this.sender.createOp({ paymaster: this.user }, true);
      // await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary))
      //   .to.emit(this.sender, 'OwnershipTransferred')
      //   .withArgs(ethers.ZeroAddress, this.user)
      //   .to.emit(this.factory, 'return$deploy')
      //   .withArgs(this.sender)
      //   .to.emit(this.entrypoint, 'AccountDeployed')
      //   .withArgs(operation.hash, this.sender, this.factory, ethers.ZeroAddress)
      //   .to.emit(this.entrypoint, 'Transfer')
      //   .withArgs(ethers.ZeroAddress, this.sender, anyValue)
      //   .to.emit(this.entrypoint, 'BeforeExecution')
      //   // BeforeExecution has no args
      //   .to.emit(this.entrypoint, 'UserOperationEvent')
      //   .withArgs(operation.hash, this.sender, ethers.ZeroAddress, operation.nonce, true, anyValue, anyValue);

      expect(await ethers.provider.getCode(this.sender)).to.not.equal('0x');
    });

    it("error: AA21 didn't pay prefund", async function () {
      expect(await ethers.provider.getCode(this.sender)).to.equal('0x');

      const operation = await this.sender.createOp({}, true);
      await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary))
        .to.be.revertedWithCustomError(this.entrypoint, 'FailedOp')
        .withArgs(0, "AA21 didn't pay prefund");

      expect(await ethers.provider.getCode(this.sender)).to.equal('0x');
    });

    it('error: AA25 invalid account nonce', async function () {
      await this.user.sendTransaction({ to: this.sender, value: ethers.parseEther('1') });

      expect(await ethers.provider.getCode(this.sender)).to.equal('0x');

      const operation = await this.sender.createOp({ nonce: 1n }, true);
      await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary))
        .to.be.revertedWithCustomError(this.entrypoint, 'FailedOp')
        .withArgs(0, 'AA25 invalid account nonce');

      expect(await ethers.provider.getCode(this.sender)).to.equal('0x');
    });
  });
});
