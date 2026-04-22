export const formatType = schema => Object.entries(schema).map(([name, type]) => ({ name, type }));

export const EIP712Domain = formatType({
  name: 'string',
  version: 'string',
  chainId: 'uint256',
  verifyingContract: 'address',
  salt: 'bytes32',
});
export const Permit = formatType({
  owner: 'address',
  spender: 'address',
  value: 'uint256',
  nonce: 'uint256',
  deadline: 'uint256',
});
export const Ballot = formatType({
  proposalId: 'uint256',
  support: 'uint8',
  voter: 'address',
  nonce: 'uint256',
});
export const ExtendedBallot = formatType({
  proposalId: 'uint256',
  support: 'uint8',
  voter: 'address',
  nonce: 'uint256',
  reason: 'string',
  params: 'bytes',
});
export const OverrideBallot = formatType({
  proposalId: 'uint256',
  support: 'uint8',
  voter: 'address',
  nonce: 'uint256',
  reason: 'string',
});
export const Delegation = formatType({
  delegatee: 'address',
  nonce: 'uint256',
  expiry: 'uint256',
});
export const ForwardRequest = formatType({
  from: 'address',
  to: 'address',
  value: 'uint256',
  gas: 'uint256',
  nonce: 'uint256',
  deadline: 'uint48',
  data: 'bytes',
});
export const PackedUserOperation = formatType({
  sender: 'address',
  nonce: 'uint256',
  initCode: 'bytes',
  callData: 'bytes',
  accountGasLimits: 'bytes32',
  preVerificationGas: 'uint256',
  gasFees: 'bytes32',
  paymasterAndData: 'bytes',
});
export const UserOperationRequest = formatType({
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
});
