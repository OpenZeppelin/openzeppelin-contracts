const { ethers } = require('hardhat');

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
      ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'address', 'uint256'], [h, entrypoint, chainId]),
    );
  }
}

module.exports = {
  SIG_VALIDATION_SUCCESS,
  SIG_VALIDATION_FAILURE,
  toAuthorizer,
  packValidationData,
  packPaymasterData,
  UserOperation,
};
