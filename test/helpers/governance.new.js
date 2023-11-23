const { ethers } = require('hardhat');
const { forward } = require('../helpers/time');
const { ProposalState } = require('./enums');

const timelockSalt = (address, descriptionHash) =>
  ethers.toBeHex((BigInt(address) << 96n) ^ BigInt(descriptionHash), 32);

/**
 * Encodes a list ProposalStates into a bytes32 representation where each bit enabled corresponds to
 * the underlying position in the `ProposalState` enum. For example:
 *
 * 0x000...10000
 *   ^^^^^^------ ...
 *         ^----- Succeeded
 *          ^---- Defeated
 *           ^--- Canceled
 *            ^-- Active
 *             ^- Pending
 */
function proposalStatesToBitMap(proposalStates, options = {}) {
  if (!Array.isArray(proposalStates)) {
    proposalStates = [proposalStates];
  }
  const statesCount = Object.keys(ProposalState).length;
  let result = 0;

  const uniqueProposalStates = new Set(proposalStates); // Remove duplicates
  for (const state of uniqueProposalStates) {
    if (state < 0 || state >= statesCount) {
      expect.fail(`ProposalState ${state} out of possible states (0...${statesCount}-1)`);
    } else {
      result |= 1 << state;
    }
  }

  if (options.inverted) {
    const mask = 2 ** statesCount - 1;
    result = result ^ mask;
  }

  return ethers.toBeHex(result, 32);
}

class GovernorHelper {
  constructor(governor, mode = 'blocknumber', proposal = undefined) {
    this.governor = governor;
    this.mode = mode;
    this.currentProposal = proposal;
  }

  connect(account) {
    return new GovernorHelper(this.governor.connect(account), this.mode, this.currentProposal);
  }

  delegate(delegation) {
    return Promise.all([
      delegation.token.connect(delegation.to).delegate(delegation.to),
      delegation.value && delegation.token.connect(this.governor.runner).transfer(delegation.to, delegation.value),
      delegation.tokenId &&
        delegation.token
          .ownerOf(delegation.tokenId)
          .then(owner =>
            delegation.token.connect(this.governor.runner).transferFrom(owner, delegation.to, delegation.tokenId),
          ),
    ]);
  }

  propose() {
    const proposal = this.currentProposal;

    return this.governor.propose(...proposal.fullProposal);
  }

  queue() {
    const proposal = this.currentProposal;

    return proposal.useCompatibilityInterface
      ? this.governor.queue(proposal.id)
      : this.governor.queue(...proposal.shortProposal);
  }

  execute() {
    const proposal = this.currentProposal;

    return proposal.useCompatibilityInterface
      ? this.governor.execute(proposal.id)
      : this.governor.execute(...proposal.shortProposal);
  }

  cancel(visibility = 'external') {
    const proposal = this.currentProposal;

    switch (visibility) {
      case 'external':
        return proposal.useCompatibilityInterface
          ? this.governor.cancel(proposal.id)
          : this.governor.cancel(...proposal.shortProposal);

      case 'internal':
        return this.governor.$_cancel(...proposal.shortProposal);

      default:
        throw new Error(`unsupported visibility "${visibility}"`);
    }
  }

  vote(vote = {}) {
    const proposal = this.currentProposal;

    return vote.signature
      ? // if signature, and either params or reason →
        vote.params || vote.reason
        ? this.sign(vote).then(signature =>
            this.governor.castVoteWithReasonAndParamsBySig(
              proposal.id,
              vote.support,
              vote.voter,
              vote.reason || '',
              vote.params || '',
              signature,
            ),
          )
        : this.sign(vote).then(signature =>
            this.governor.castVoteBySig(proposal.id, vote.support, vote.voter, signature),
          )
      : vote.params
      ? // otherwise if params
        this.governor.castVoteWithReasonAndParams(proposal.id, vote.support, vote.reason || '', vote.params)
      : vote.reason
      ? // otherwise if reason
        this.governor.castVoteWithReason(proposal.id, vote.support, vote.reason)
      : this.governor.castVote(proposal.id, vote.support);
  }

  sign(vote = {}) {
    return vote.signature(this.governor, this.forgeMessage(vote));
  }

  forgeMessage(vote = {}) {
    const proposal = this.currentProposal;

    const message = { proposalId: proposal.id, support: vote.support, voter: vote.voter, nonce: vote.nonce };

    if (vote.params || vote.reason) {
      message.reason = vote.reason || '';
      message.params = vote.params || '';
    }

    return message;
  }

  async waitForSnapshot(offset = 0n) {
    const proposal = this.currentProposal;
    const timepoint = await this.governor.proposalSnapshot(proposal.id);
    return forward[this.mode](timepoint + offset);
  }

  async waitForDeadline(offset = 0n) {
    const proposal = this.currentProposal;
    const timepoint = await this.governor.proposalDeadline(proposal.id);
    return forward[this.mode](timepoint + offset);
  }

  async waitForEta(offset = 0) {
    const proposal = this.currentProposal;
    const timestamp = await this.governor.proposalEta(proposal.id);
    return forward.timestamp(timestamp.addn(offset));
  }

  /**
   * Specify a proposal either as
   * 1) an array of objects [{ target, value, data }]
   * 2) an object of arrays { targets: [], values: [], data: [] }
   */
  setProposal(actions, description) {
    let targets, values, data, useCompatibilityInterface;

    if (Array.isArray(actions)) {
      useCompatibilityInterface = actions.some(a => 'signature' in a);
      targets = actions.map(a => a.target);
      values = actions.map(a => a.value || '0');
      data = actions.map(a => a.data || '0x');
    } else {
      ({ targets, values, data } = actions);
    }

    const descriptionHash = ethers.id(description);

    // condensed version for queueing end executing
    const shortProposal = [targets, values, data, descriptionHash];

    // full version for proposing
    const fullProposal = [targets, values, data, description];

    // proposal id
    const id = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(['address[]', 'uint256[]', 'bytes[]', 'bytes32'], shortProposal),
    );

    const currentProposal = {
      id,
      targets,
      values,
      signatures: [''],
      data,
      description,
      descriptionHash,
      shortProposal,
      fullProposal,
      useCompatibilityInterface,
    };

    return new GovernorHelper(this.governor, this.mode, currentProposal);
  }
}

module.exports = {
  GovernorHelper,
  proposalStatesToBitMap,
  timelockSalt,
};
