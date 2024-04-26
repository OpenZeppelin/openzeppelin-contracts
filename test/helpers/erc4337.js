const { ethers } = require('hardhat');

function pack(left, right) {
  return ethers.toBeHex((left << 128n) | right, 32);
}

class ERC4337Context {
  constructor() {
    this.entrypointAsPromise = ethers.deployContract('EntryPoint');
    this.factoryAsPromise = ethers.deployContract('$Create2');
    this.accountAsPromise = ethers.getContractFactory('SimpleAccount');
    this.chainIdAsPromise = ethers.provider.getNetwork().then(({ chainId }) => chainId);
  }

  async wait() {
    this.entrypoint = await this.entrypointAsPromise;
    this.factory = await this.factoryAsPromise;
    this.account = await this.accountAsPromise;
    this.chainId = await this.chainIdAsPromise;
    return this;
  }

  async newAccount(user, salt = ethers.randomBytes(32)) {
    await this.wait();
    const initCode = await this.account
      .getDeployTransaction(this.entrypoint, user)
      .then(tx => this.factory.interface.encodeFunctionData('$deploy', [0, salt, tx.data]))
      .then(deployCode => ethers.concat([this.factory.target, deployCode]));
    const instance = await this.entrypoint.getSenderAddress
      .staticCall(initCode)
      .then(address => this.account.attach(address));
    return new AbstractAccount(instance, initCode, this);
  }
}

class AbstractAccount extends ethers.BaseContract {
  constructor(instance, initCode, context) {
    super(instance.target, instance.interface, instance.runner, instance.deployTx);
    this.address = instance.target;
    this.initCode = initCode;
    this.context = context;
  }

  createOp(params = {}, withInit = false) {
    return new UserOperation({
      ...params,
      sender: this,
      initCode: withInit ? this.initCode : '0x',
    });
  }
}

class UserOperation {
  constructor(params) {
    this.sender = params.sender;
    this.nonce = params.nonce ?? 0n;
    this.initCode = params.initCode ?? '0x';
    this.callData = params.callData ?? '0x';
    this.verificationGas = params.verificationGas ?? 2_000_000n;
    this.callGas = params.callGas ?? 100_000n;
    this.preVerificationGas = params.preVerificationGas ?? 100_000n;
    this.maxPriorityFee = params.maxPriorityFee ?? 100_000n;
    this.maxFeePerGas = params.maxFeePerGas ?? 100_000n;
    this.paymasterAndData = params.paymasterAndData ?? '0x';
    this.signature = params.signature ?? '0x';
  }

  get packed() {
    return {
      sender: this.sender,
      nonce: this.nonce,
      initCode: this.initCode,
      callData: this.callData,
      accountGasLimits: pack(this.verificationGas, this.callGas),
      preVerificationGas: this.preVerificationGas,
      gasFees: pack(this.maxPriorityFee, this.maxFeePerGas),
      paymasterAndData: this.paymasterAndData,
      signature: this.signature,
    };
  }

  get hash() {
    const p = this.packed;
    const h = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
        [
          p.sender.target,
          p.nonce,
          ethers.keccak256(p.initCode),
          ethers.keccak256(p.callData),
          p.accountGasLimits,
          p.preVerificationGas,
          p.gasFees,
          ethers.keccak256(p.paymasterAndData),
        ],
      ),
    );
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'uint256'],
        [h, this.sender.context.entrypoint.target, this.sender.context.chainId],
      ),
    );
  }
}

module.exports = {
  ERC4337Context,
  AbstractAccount,
  UserOperation,
};
