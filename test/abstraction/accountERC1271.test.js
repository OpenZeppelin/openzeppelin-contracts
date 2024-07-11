const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { ERC4337Helper } = require('../helpers/erc4337');
const { P256Signer } = require('../helpers/p256');

async function fixture() {
  const accounts = await ethers.getSigners();
  accounts.user = accounts.shift();
  accounts.beneficiary = accounts.shift();

  // 4337 helper
  const helper = new ERC4337Helper('SimpleAccountERC1271');
  await helper.wait();

  // environment
  const target = await ethers.deployContract('CallReceiverMock');
  const identifyFactory = await ethers.deployContract('IdentityP256Factory');

  // create P256 key and identity contract
  const signer = P256Signer.random();
  signer.address = await identifyFactory.predict(signer.publicKey); // override address of the signer
  signer.sigParams.prefixAddress = true;
  await identifyFactory.create(signer.publicKey);
  const sender = await helper.newAccount(signer);

  return {
    accounts,
    target,
    helper,
    entrypoint: helper.entrypoint,
    factory: helper.factory,
    sender,
  };
}

describe('AccountERC1271', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('execute operation', function () {
    beforeEach('fund account', async function () {
      await this.accounts.user.sendTransaction({ to: this.sender, value: ethers.parseEther('1') });
    });

    describe('account not deployed yet', function () {
      it('success: deploy and call', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              this.target.target,
              17,
              this.target.interface.encodeFunctionData('mockFunctionExtra'),
            ]),
          })
          .then(op => op.addInitCode())
          .then(op => op.sign());

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.emit(this.entrypoint, 'AccountDeployed')
          .withArgs(operation.hash, this.sender, this.factory, ethers.ZeroAddress)
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.sender, 17);
      });
    });

    describe('account already deployed', function () {
      beforeEach(async function () {
        await this.sender.deploy(this.accounts.user);
      });

      it('success: call', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              this.target.target,
              42,
              this.target.interface.encodeFunctionData('mockFunctionExtra'),
            ]),
          })
          .then(op => op.sign());

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.sender, 42);
      });
    });
  });
});
