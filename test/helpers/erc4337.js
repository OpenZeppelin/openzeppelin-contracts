const { ethers, config, predeploy } = require('hardhat');
const { ValidationRange } = require('./enums');

const SIG_VALIDATION_SUCCESS = '0x0000000000000000000000000000000000000000';
const SIG_VALIDATION_FAILURE = '0x0000000000000000000000000000000000000001';
const PAYMASTER_SIG_MAGIC = '0x22e325a297439656';

const BLOCK_RANGE_FLAG = 0x800000000000n;
const BLOCK_RANGE_MASK = 0x7fffffffffffn;

function getAddress(account) {
  return account.target ?? account.address ?? account;
}

function pack(left, right) {
  return ethers.solidityPacked(['uint128', 'uint128'], [left, right]);
}

function packValidationData(validAfter, validUntil, authorizer, range = undefined) {
  // if range is not specified, use the value as provided,
  // otherwise, clean the values (& BLOCK_RANGE_MASK) and set the flag if corresponding to the range.
  return ethers.solidityPacked(
    ['uint48', 'uint48', 'address'],
    [
      range === undefined
        ? BigInt(validAfter)
        : (BigInt(validAfter) & BLOCK_RANGE_MASK) | (range == ValidationRange.Block ? BLOCK_RANGE_FLAG : 0n),
      range === undefined
        ? BigInt(validUntil)
        : (BigInt(validUntil) & BLOCK_RANGE_MASK) | (range == ValidationRange.Block ? BLOCK_RANGE_FLAG : 0n),
      typeof authorizer == 'boolean'
        ? authorizer
          ? SIG_VALIDATION_SUCCESS
          : SIG_VALIDATION_FAILURE
        : getAddress(authorizer),
    ],
  );
}

function packInitCode(factory, factoryData) {
  return ethers.solidityPacked(['address', 'bytes'], [getAddress(factory), factoryData]);
}

function packPaymasterAndData(
  paymaster,
  paymasterVerificationGasLimit,
  paymasterPostOpGasLimit,
  paymasterData,
  signature = undefined,
) {
  return ethers.concat([
    ethers.solidityPacked(
      ['address', 'uint128', 'uint128', 'bytes'],
      [getAddress(paymaster), paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData],
    ),
    signature === undefined
      ? '0x'
      : ethers.solidityPacked(
          ['bytes', 'uint16', 'bytes8'],
          [signature, ethers.dataLength(signature), PAYMASTER_SIG_MAGIC],
        ),
  ]);
}

/// Represent one user operation
class UserOperation {
  constructor(params) {
    this.sender = getAddress(params.sender);
    this.nonce = params.nonce;
    this.factory = params.factory ?? undefined;
    this.factoryData = params.factoryData ?? '0x';
    this.callData = params.callData ?? '0x';
    this.verificationGas = params.verificationGas ?? 10_000_000n;
    this.callGas = params.callGas ?? 100_000n;
    this.preVerificationGas = params.preVerificationGas ?? 100_000n;
    this.maxPriorityFee = params.maxPriorityFee ?? 100_000n;
    this.maxFeePerGas = params.maxFeePerGas ?? 100_000n;
    this.paymaster = params.paymaster ?? undefined;
    this.paymasterVerificationGasLimit = params.paymasterVerificationGasLimit ?? 0n;
    this.paymasterPostOpGasLimit = params.paymasterPostOpGasLimit ?? 0n;
    this.paymasterData = params.paymasterData ?? '0x';
    this.paymasterSignature = params.paymasterSignature ?? undefined;
    this.signature = params.signature ?? '0x';
  }

  get packed() {
    return {
      sender: this.sender,
      nonce: this.nonce,
      initCode: this.factory ? packInitCode(this.factory, this.factoryData) : '0x',
      callData: this.callData,
      accountGasLimits: pack(this.verificationGas, this.callGas),
      preVerificationGas: this.preVerificationGas,
      gasFees: pack(this.maxPriorityFee, this.maxFeePerGas),
      paymasterAndData: this.paymaster
        ? packPaymasterAndData(
            this.paymaster,
            this.paymasterVerificationGasLimit,
            this.paymasterPostOpGasLimit,
            this.paymasterData,
            this.paymasterSignature,
          )
        : '0x',
      signature: this.signature,
    };
  }

  hash(entrypoint) {
    return entrypoint.getUserOpHash(this.packed);
  }
}

const parseInitCode = initCode => ({
  factory: '0x' + initCode.replace(/0x/, '').slice(0, 40),
  factoryData: '0x' + initCode.replace(/0x/, '').slice(40),
});

/// Global ERC-4337 environment helper.
class ERC4337Helper {
  constructor() {
    this.factoryAsPromise = ethers.deployContract('$Create2');
  }

  async wait() {
    this.factory = await this.factoryAsPromise;
    return this;
  }

  async newAccount(name, extraArgs = [], params = {}) {
    const env = {
      entrypoint: params.entrypoint ?? predeploy.entrypoint.v09,
      senderCreator: params.senderCreator ?? predeploy.senderCreator.v09,
    };

    const { factory } = await this.wait();

    const accountFactory = await ethers.getContractFactory(name);

    if (params.eip7702signer) {
      const delegate = await accountFactory.deploy(...extraArgs);
      const instance = await params.eip7702signer.getAddress().then(address => accountFactory.attach(address));
      const authorization = await params.eip7702signer.authorize({ address: delegate.target });
      return new EIP7702SmartAccount(instance, authorization, env);
    } else {
      const initCode = await accountFactory
        .getDeployTransaction(...extraArgs)
        .then(tx =>
          factory.interface.encodeFunctionData('$deploy', [0, params.salt ?? ethers.randomBytes(32), tx.data]),
        )
        .then(deployCode => ethers.concat([factory.target, deployCode]));

      const instance = await ethers.provider
        .call({
          from: env.entrypoint,
          to: env.senderCreator,
          data: env.senderCreator.interface.encodeFunctionData('createSender', [initCode]),
        })
        .then(result => ethers.getAddress(ethers.hexlify(ethers.getBytes(result).slice(-20))))
        .then(address => accountFactory.attach(address));

      return new SmartAccount(instance, initCode, env);
    }
  }
}

/// Represent one ERC-4337 account contract.
class SmartAccount extends ethers.BaseContract {
  constructor(instance, initCode, env) {
    super(instance.target, instance.interface, instance.runner, instance.deployTx);
    this.address = instance.target;
    this.initCode = initCode;
    this._env = env;
  }

  async deploy(account = this.runner) {
    const { factory: to, factoryData: data } = parseInitCode(this.initCode);
    this.deployTx = await account.sendTransaction({ to, data });
    return this;
  }

  async createUserOp(userOp = {}) {
    userOp.sender ??= this;
    userOp.nonce ??= await this._env.entrypoint.getNonce(userOp.sender, 0);
    if (ethers.isAddressable(userOp.paymaster)) {
      userOp.paymaster = await ethers.resolveAddress(userOp.paymaster);
      userOp.paymasterVerificationGasLimit ??= 100_000n;
      userOp.paymasterPostOpGasLimit ??= 100_000n;
    }
    return new UserOperationWithContext(userOp, this._env);
  }
}

class EIP7702SmartAccount extends SmartAccount {
  constructor(instance, authorization, env) {
    super(instance, undefined, env);
    this.authorization = authorization;
  }

  async deploy() {
    // hardhat signers from @nomicfoundation/hardhat-ethers do not support type 4 txs.
    // so we rebuild it using "native" ethers
    await ethers.Wallet.fromPhrase(config.networks.hardhat.accounts.mnemonic, ethers.provider).sendTransaction({
      to: ethers.ZeroAddress,
      authorizationList: [this.authorization],
      gasLimit: 46_000n, // 21,000 base + PER_EMPTY_ACCOUNT_COST
    });

    return this;
  }
}

class UserOperationWithContext extends UserOperation {
  constructor(userOp, env) {
    super(userOp);
    this._sender = userOp.sender;
    this._env = env;
  }

  addInitCode() {
    if (this._sender?.initCode) {
      return Object.assign(this, parseInitCode(this._sender.initCode));
    } else throw new Error('No init code available for the sender of this user operation');
  }

  getAuthorization() {
    if (this._sender?.authorization) {
      return this._sender.authorization;
    } else throw new Error('No EIP-7702 authorization available for the sender of this user operation');
  }

  hash() {
    return super.hash(this._env.entrypoint);
  }
}

module.exports = {
  SIG_VALIDATION_SUCCESS,
  SIG_VALIDATION_FAILURE,
  packValidationData,
  packInitCode,
  packPaymasterAndData,
  UserOperation,
  ERC4337Helper,
};
