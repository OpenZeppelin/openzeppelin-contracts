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
  const helper = new ERC4337Helper('AdvancedAccount', { withTypePrefix: true });
  const identity = new IdentityHelper();

  // environment
  const target = await ethers.deployContract('CallReceiverMock');

  // create 4337 account controlled by multiple signers
  const signers = await Promise.all([
    identity.newECDSASigner(), // secp256k1
    identity.newP256Signer(), // secp256r1
    identity.newP256Signer(), // secp256r1
    identity.newECDSASigner(), // secp256k1
  ]);
  const sender = await helper.newAccount(accounts.relayer, [signers, 2]); // 2-of-4

  return {
    accounts,
    target,
    helper,
    entrypoint: helper.entrypoint,
    factory: helper.factory,
    signers,
    sender,
  };
}

describe('AccountMultisig', function () {
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
          .then(op => op.sign(this.signers));

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.emit(this.entrypoint, 'AccountDeployed')
          .withArgs(operation.hash, this.sender, this.factory, ethers.ZeroAddress)
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.sender, 17);
      });
    });

    describe('account already deployed', function () {
      beforeEach(async function () {
        await this.sender.deploy();
      });

      it('success: 3 signers', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              encodeMode(),
              encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
            ]),
          })
          .then(op => op.sign(this.signers));

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.sender, 42);
      });

      it('success: 2 signers', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              encodeMode(),
              encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
            ]),
          })
          .then(op => op.sign([this.signers[0], this.signers[2]]));

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.sender, 42);
      });

      it('revert: not enough signers', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              encodeMode(),
              encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
            ]),
          })
          .then(op => op.sign([this.signers[2]]));

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.be.revertedWithCustomError(this.entrypoint, 'FailedOp')
          .withArgs(0, 'AA24 signature error');
      });

      it('revert: unauthorized signer', async function () {
        const operation = await this.sender
          .createOp({
            callData: this.sender.interface.encodeFunctionData('execute', [
              encodeMode(),
              encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
            ]),
          })
          .then(op => op.sign([this.accounts.relayer, this.signers[2]]));

        await expect(this.entrypoint.handleOps([operation.packed], this.accounts.beneficiary))
          .to.be.revertedWithCustomError(this.entrypoint, 'FailedOp')
          .withArgs(0, 'AA24 signature error');
      });
    });
  });
});
