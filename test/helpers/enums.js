const { BN } = require('@openzeppelin/test-helpers');

function Enum (...options) {
  return options.reduce((acc, key, i) => ({ ...acc, [key]: new BN(i) }), {});
}

module.exports = {
  Enum,
  ProposalState: Enum(
    'Pending',
    'Active',
    'Canceled',
    'Defeated',
    'Succeeded',
    'Queued',
    'Expired',
    'Executed',
  ),
  VoteType: Enum(
    'Against',
    'For',
    'Abstain',
  ),
};
