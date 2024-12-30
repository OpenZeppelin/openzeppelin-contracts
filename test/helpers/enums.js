function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, BigInt(i)]));
}

module.exports = {
  Enum,
  ProposalState: Enum('Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'),
  VoteType: Object.assign(Enum('Against', 'For', 'Abstain'), { Parameters: 255n }),
  Rounding: Enum('Floor', 'Ceil'),
  OperationState: Enum('Unset', 'Waiting', 'Ready', 'Done'),
  RevertType: Enum('None', 'RevertWithoutMessage', 'RevertWithMessage', 'RevertWithCustomError', 'Panic'),
};
