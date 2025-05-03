const { mapValues } = require('./iterate');

const formatType = schema => Object.entries(schema).map(([name, type]) => ({ name, type }));

module.exports = mapValues(
  {
    EIP712Domain: {
      name: 'string',
      version: 'string',
      chainId: 'uint256',
      verifyingContract: 'address',
      salt: 'bytes32',
    },
    Permit: { owner: 'address', spender: 'address', value: 'uint256', nonce: 'uint256', deadline: 'uint256' },
    Ballot: { proposalId: 'uint256', support: 'uint8', voter: 'address', nonce: 'uint256' },
    ExtendedBallot: {
      proposalId: 'uint256',
      support: 'uint8',
      voter: 'address',
      nonce: 'uint256',
      reason: 'string',
      params: 'bytes',
    },
    OverrideBallot: { proposalId: 'uint256', support: 'uint8', voter: 'address', nonce: 'uint256', reason: 'string' },
    Delegation: { delegatee: 'address', nonce: 'uint256', expiry: 'uint256' },
    ForwardRequest: {
      from: 'address',
      to: 'address',
      value: 'uint256',
      gas: 'uint256',
      nonce: 'uint256',
      deadline: 'uint48',
      data: 'bytes',
    },
    PackedUserOperation: {
      sender: 'address',
      nonce: 'uint256',
      initCode: 'bytes',
      callData: 'bytes',
      accountGasLimits: 'bytes32',
      preVerificationGas: 'uint256',
      gasFees: 'bytes32',
      paymasterAndData: 'bytes',
    },
    UserOperationRequest: {
      sender: 'address',
      nonce: 'uint256',
      initCode: 'bytes',
      callData: 'bytes',
      accountGasLimits: 'bytes32',
      preVerificationGas: 'uint256',
      gasFees: 'bytes32',
      paymasterVerificationGasLimit: 'uint256',
      paymasterPostOpGasLimit: 'uint256',
      validAfter: 'uint48',
      validUntil: 'uint48',
    },
  },
  formatType,
);
module.exports.formatType = formatType;
