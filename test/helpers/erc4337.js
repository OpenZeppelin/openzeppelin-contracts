const { ethers } = require('hardhat');

const SIG_VALIDATION_SUCCESS = '0x0000000000000000000000000000000000000000';
const SIG_VALIDATION_FAILURE = '0x0000000000000000000000000000000000000001';

function getAddress(account) {
  return account.target ?? account.address ?? account;
}

function pack(left, right) {
  return ethers.solidityPacked(['uint128', 'uint128'], [left, right]);
}

function packValidationData(validAfter, validUntil, authorizer) {
  return ethers.solidityPacked(
    ['uint48', 'uint48', 'address'],
    [
      validAfter,
      validUntil,
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

function packPaymasterAndData(paymaster, paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData) {
  return ethers.solidityPacked(
    ['address', 'uint128', 'uint128', 'bytes'],
    [getAddress(paymaster), paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData],
  );
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
          )
        : '0x',
      signature: this.signature,
    };
  }

  hash(entrypoint, chainId) {
    const p = this.packed;
    const h = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
        [
          p.sender,
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
      ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'address', 'uint256'], [h, getAddress(entrypoint), chainId]),
    );
  }
}

module.exports = {
  SIG_VALIDATION_SUCCESS,
  SIG_VALIDATION_FAILURE,
  packValidationData,
  packInitCode,
  packPaymasterAndData,
  UserOperation,
};
