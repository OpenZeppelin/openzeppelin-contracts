module.exports = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'salt', type: 'bytes32' },
  ],
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
  Ballot: [
    { name: 'proposalId', type: 'uint256' },
    { name: 'support', type: 'uint8' },
    { name: 'voter', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
  ExtendedBallot: [
    { name: 'proposalId', type: 'uint256' },
    { name: 'support', type: 'uint8' },
    { name: 'voter', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'reason', type: 'string' },
    { name: 'params', type: 'bytes' },
  ],
  Delegation: [
    { name: 'delegatee', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
  ],
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint48' },
    { name: 'data', type: 'bytes' },
  ],
};
