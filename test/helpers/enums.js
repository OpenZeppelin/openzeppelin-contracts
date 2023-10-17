function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, web3.utils.toBN(i)]));
}

function Enum2(...options) {
  return Object.fromEntries(options.map((key, i) => [key, BigInt(i)]));
}

module.exports = {
  Enum,
  Enum2,
  ProposalState: Enum('Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'),
  VoteType: Enum('Against', 'For', 'Abstain'),
  Rounding: Enum('Floor', 'Ceil', 'Trunc', 'Expand'),
  OperationState: Enum('Unset', 'Waiting', 'Ready', 'Done'),
};
