function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, i]));
}

module.exports = {
  Enum,
  ProposalState: Enum('Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'),
  VoteType: Enum('Against', 'For', 'Abstain'),
  Rounding: Enum('Floor', 'Ceil', 'Trunc', 'Expand'),
  OperationState: Enum('Unset', 'Waiting', 'Ready', 'Done'),
};
