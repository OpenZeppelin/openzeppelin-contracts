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
          entrypoint
            .getSenderAddress(initCode)
            .catch(err => err.message.match(/SenderAddressResult\("(?<addr>0x[0-9a-zA-Z]{40})"\)/)?.groups?.addr)
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
            accountGasLimits: ethers.toBeHex((1000000n << 128n) | 1000000n, 32), // concatenation of verificationGas (16 bytes) and callGas (16 bytes)
            preVerificationGas: 1000000n,
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
      .to.emit(this.entrypoint, 'Deposited')
      .to.emit(this.entrypoint, 'BeforeExecution')
      .to.emit(this.entrypoint, 'UserOperationEvent');

    expect(await ethers.provider.getCode(sender)).to.not.equal('0x');
  });

  //   describe('base64', function () {
  //     for (const { title, input, expected } of [
  //       { title: 'converts to base64 encoded string with double padding', input: 'test', expected: 'dGVzdA==' },
  //       { title: 'converts to base64 encoded string with single padding', input: 'test1', expected: 'dGVzdDE=' },
  //       { title: 'converts to base64 encoded string without padding', input: 'test12', expected: 'dGVzdDEy' },
  //       { title: 'converts to base64 encoded string (/ case)', input: 'où', expected: 'b/k=' },
  //       { title: 'converts to base64 encoded string (+ case)', input: 'zs~1t8', expected: 'enN+MXQ4' },
  //       { title: 'empty bytes', input: '', expected: '' },
  //     ])
  //       it(title, async function () {
  //         const buffer = Buffer.from(input, 'ascii');
  //         expect(await this.mock.$encode(buffer)).to.equal(ethers.encodeBase64(buffer));
  //         expect(await this.mock.$encode(buffer)).to.equal(expected);
  //       });
  //   });

  //   describe('base64url', function () {
  //     for (const { title, input, expected } of [
  //       { title: 'converts to base64url encoded string with double padding', input: 'test', expected: 'dGVzdA' },
  //       { title: 'converts to base64url encoded string with single padding', input: 'test1', expected: 'dGVzdDE' },
  //       { title: 'converts to base64url encoded string without padding', input: 'test12', expected: 'dGVzdDEy' },
  //       { title: 'converts to base64url encoded string (_ case)', input: 'où', expected: 'b_k' },
  //       { title: 'converts to base64url encoded string (- case)', input: 'zs~1t8', expected: 'enN-MXQ4' },
  //       { title: 'empty bytes', input: '', expected: '' },
  //     ])
  //       it(title, async function () {
  //         const buffer = Buffer.from(input, 'ascii');
  //         expect(await this.mock.$encodeURL(buffer)).to.equal(base64toBase64Url(ethers.encodeBase64(buffer)));
  //         expect(await this.mock.$encodeURL(buffer)).to.equal(expected);
  //       });
  //   });

  //   it('Encode reads beyond the input buffer into dirty memory', async function () {
  //     const mock = await ethers.deployContract('Base64Dirty');
  //     const buffer32 = ethers.id('example');
  //     const buffer31 = buffer32.slice(0, -2);

  //     expect(await mock.encode(buffer31)).to.equal(ethers.encodeBase64(buffer31));
  //     expect(await mock.encode(buffer32)).to.equal(ethers.encodeBase64(buffer32));
  //   });
});
