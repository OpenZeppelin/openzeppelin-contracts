const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const accounts = await ethers.getSigners();
  const entrypoint = await ethers.deployContract('EntryPoint');
  const factory = await ethers.deployContract('$Create2');

  const makeAA = (user, salt = ethers.randomBytes(32)) =>
    ethers.getContractFactory('SimpleAccount').then(accountFactory =>
      accountFactory
        .getDeployTransaction(entrypoint, user)
        .then(tx => factory.interface.encodeFunctionData('$deploy', [0, salt, tx.data]))
        .then(deployCode => ethers.concat([factory.target, deployCode]))
        .then(initCode =>
          entrypoint.getSenderAddress
            .staticCall(initCode)
            .then(sender => Object.assign(accountFactory.attach(sender), { initCode, salt })),
        ),
    );

  return {
    accounts,
    entrypoint,
    factory,
    makeAA,
  };
}

describe('EntryPoint', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('', async function () {
    const user = this.accounts[0];
    const beneficiary = this.accounts[1];
    const sender = await this.makeAA(user);

    expect(await ethers.provider.getCode(sender)).to.equal('0x');

    await user.sendTransaction({ to: sender, value: ethers.parseEther('1') });
    await expect(
      this.entrypoint.handleOps(
        [
          {
            sender,
            nonce: 0n,
            initCode: sender.initCode,
            callData: '0x',
            accountGasLimits: ethers.toBeHex((2000000n << 128n) | 100000n, 32), // concatenation of verificationGas (16 bytes) and callGas (16 bytes)
            preVerificationGas: 100000n,
            gasFees: ethers.toBeHex((100000n << 128n) | 100000n, 32), // concatenation of maxPriorityFee (16 bytes) and maxFeePerGas (16 bytes)
            paymasterAndData: '0x', // concatenation of paymaster fields (or empty)
            signature: '0x',
          },
        ],
        beneficiary,
      ),
    )
      .to.emit(sender, 'OwnershipTransferred')
      .withArgs(ethers.ZeroAddress, user)
      .to.emit(this.factory, 'return$deploy')
      .withArgs(sender)
      .to.emit(this.entrypoint, 'AccountDeployed')
      .to.emit(this.entrypoint, 'Transfer') // Deposit
      .to.emit(this.entrypoint, 'BeforeExecution')
      .to.emit(this.entrypoint, 'UserOperationEvent');

    expect(await ethers.provider.getCode(sender)).to.not.equal('0x');
  });
});
