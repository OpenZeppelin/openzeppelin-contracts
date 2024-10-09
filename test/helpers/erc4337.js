const { setCode } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');

const CANONICAL_ENTRYPOINT = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
const SIG_VALIDATION_SUCCESS = 0;
const SIG_VALIDATION_FAILURE = 1;

function toAuthorizer(sigValidatonSuccess) {
  return `0x000000000000000000000000000000000000000${sigValidatonSuccess}`;
}

function pack(left, right) {
  return ethers.solidityPacked(['uint128', 'uint128'], [left, right]);
}

function packValidationData(validAfter, validUntil, authorizer) {
  return ethers.solidityPacked(['uint48', 'uint48', 'address'], [validAfter, validUntil, authorizer]);
}

function packPaymasterData(paymaster, verificationGasLimit, postOpGasLimit) {
  return ethers.solidityPacked(['address', 'uint128', 'uint128'], [paymaster, verificationGasLimit, postOpGasLimit]);
}

/// Global ERC-4337 environment helper.
class ERC4337Helper {
  constructor(account, params = {}) {
    this.entrypointAsPromise = ethers.deployContract('EntryPoint');
    this.factoryAsPromise = ethers.deployContract('$Create2');
    this.accountContractAsPromise = ethers.getContractFactory(account);
    this.chainIdAsPromise = ethers.provider.getNetwork().then(({ chainId }) => chainId);
    this.senderCreatorAsPromise = ethers.deployContract('SenderCreator');
    this.params = params;
  }

  async wait() {
    const entrypoint = await this.entrypointAsPromise;
    await entrypoint.getDeployedCode().then(code => setCode(CANONICAL_ENTRYPOINT, code));
    this.entrypoint = entrypoint.attach(CANONICAL_ENTRYPOINT);
    this.entrypointAsPromise = Promise.resolve(this.entrypoint);

    this.factory = await this.factoryAsPromise;
    this.accountContract = await this.accountContractAsPromise;
    this.chainId = await this.chainIdAsPromise;
    this.senderCreator = await this.senderCreatorAsPromise;
    return this;
  }

  async newAccount(extraArgs = [], salt = ethers.randomBytes(32)) {
    await this.wait();
    const initCode = await this.accountContract
      .getDeployTransaction(...extraArgs)
      .then(tx => this.factory.interface.encodeFunctionData('$deploy', [0, salt, tx.data]))
      .then(deployCode => ethers.concat([this.factory.target, deployCode]));
    const instance = await this.senderCreator.createSender
      .staticCall(initCode)
      .then(address => this.accountContract.attach(address));
    return new SmartAccount(instance, initCode, this);
  }
}

/// Represent one ERC-4337 account contract.
class SmartAccount extends ethers.BaseContract {
  constructor(instance, initCode, context) {
    super(instance.target, instance.interface, instance.runner, instance.deployTx);
    this.address = instance.target;
    this.initCode = initCode;
    this.context = context;
  }

  async deploy(account = this.runner) {
    this.deployTx = await account.sendTransaction({
      to: '0x' + this.initCode.replace(/0x/, '').slice(0, 40),
      data: '0x' + this.initCode.replace(/0x/, '').slice(40),
    });
    return this;
  }

  async createOp(args = {}) {
    const params = Object.assign({ sender: this }, args);
    // fetch nonce
    if (!params.nonce) {
      params.nonce = await this.context.entrypointAsPromise.then(entrypoint => entrypoint.getNonce(this, 0));
    }
    // prepare paymaster and data
    if (ethers.isAddressable(params.paymaster)) {
      params.paymaster = await ethers.resolveAddress(params.paymaster);
      params.paymasterVerificationGasLimit ??= 100_000n;
      params.paymasterPostOpGasLimit ??= 100_000n;
      params.paymasterAndData = ethers.solidityPacked(
        ['address', 'uint128', 'uint128'],
        [params.paymaster, params.paymasterVerificationGasLimit, params.paymasterPostOpGasLimit],
      );
    }
    return new UserOperation(params);
  }
}

/// Represent one user operation
class UserOperation {
  constructor(params) {
    this.sender = params.sender;
    this.nonce = params.nonce;
    this.initCode = params.initCode ?? '0x';
    this.callData = params.callData ?? '0x';
    this.verificationGas = params.verificationGas ?? 10_000_000n;
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
    return this.toHash(this.sender.context.entrypoint.target, this.sender.context.chainId);
  }

  toHash(entrypoint, chainId) {
    const p = this.packed;
    const h = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
        [
          p.sender.target || p.sender.address || p.sender.target,
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
      ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'address', 'uint256'], [h, entrypoint, chainId]),
    );
  }

  addInitCode() {
    this.initCode = this.sender.initCode;
    return this;
  }

  async sign(domain, signer) {
    this.signature = await signer.signPersonal(domain, this.hash);
    return this;
  }
}

module.exports = {
  ERC4337Helper,
  SmartAccount,
  UserOperation,
  CANONICAL_ENTRYPOINT,
  SIG_VALIDATION_SUCCESS,
  SIG_VALIDATION_FAILURE,
  toAuthorizer,
  packValidationData,
  packPaymasterData,
};
