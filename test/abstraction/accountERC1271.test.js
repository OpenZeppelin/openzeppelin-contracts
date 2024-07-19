const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { IdentityHelper } = require('../helpers/identity');
const { ERC4337Helper } = require('../helpers/erc4337');
const { encodeMode, encodeSingle } = require('../helpers/erc7579');

async function fixture() {
  const accounts = await ethers.getSigners();
  accounts.relayer = accounts.shift();
  accounts.beneficiary = accounts.shift();

  // 4337 helper
  const helper = new ERC4337Helper('SimpleAccountERC1271');
  const identity = new IdentityHelper();

  // environment
  const target = await ethers.deployContract('CallReceiverMock');

  // create 4337 account controlled by P256
  const signer = await identity.newP256Signer();
  const sender = await helper.newAccount(signer);

  return {
    accounts,
    target,
    helper,
    entrypoint: helper.entrypoint,
    factory: helper.factory,
    signer,
    sender,
  };
}

describe('AccountERC1271', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('execute operation', function () {
    beforeEach('fund account', async function () {
      await this.accounts.relayer.sendTransaction({ to: this.sender, value: ethers.parseEther('1') });
    });

    describe('account not deployed yet', function () {
      it('success: deploy and call', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              encodeMode(),
              encodeSingle(this.target, 17, this.target.interface.encodeFunctionData('mockFunctionExtra')),
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
        await this.sender.deploy(this.accounts.relayer);
      });

      it('success: call', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              encodeMode(),
              encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
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
