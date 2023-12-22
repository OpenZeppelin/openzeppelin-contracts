function Enum(...options) {
  return Object.fromEntries(options.map((key, i) => [key, web3.utils.toBN(i)]));
}

function EnumBigInt(...options) {
  return Object.fromEntries(options.map((key, i) => [key, BigInt(i)]));
}

// TODO: remove web3, simplify code
function createExport(Enum) {
  return {
    Enum,
    ProposalState: Enum('Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'),
    VoteType: Enum('Against', 'For', 'Abstain'),
    Rounding: Enum('Floor', 'Ceil', 'Trunc', 'Expand'),
    OperationState: Enum('Unset', 'Waiting', 'Ready', 'Done'),
    RevertType: Enum('None', 'RevertWithoutMessage', 'RevertWithMessage', 'RevertWithCustomError', 'Panic'),
  };
}

module.exports = createExport(Enum);
module.exports.bigint = createExport(EnumBigInt);
