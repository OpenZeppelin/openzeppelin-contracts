const { ethers } = require('ethers');

const Enum = (...options) => Object.fromEntries(options.map((key, i) => [key, BigInt(i)]));
const EnumTyped = (...options) => Object.fromEntries(options.map((key, i) => [key, ethers.Typed.uint8(i)]));

module.exports = {
  Enum,
  EnumTyped,
  ProposalState: Enum('Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'),
  VoteType: Object.assign(Enum('Against', 'For', 'Abstain'), { Parameters: 255n }),
  Rounding: EnumTyped('Floor', 'Ceil', 'Trunc', 'Expand'),
  OperationState: Enum('Unset', 'Waiting', 'Ready', 'Done'),
  RevertType: EnumTyped('None', 'RevertWithoutMessage', 'RevertWithMessage', 'RevertWithCustomError', 'Panic'),
  ValidationRange: Enum('Timestamp', 'Block'),
};
