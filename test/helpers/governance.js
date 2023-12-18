const { ethers } = require('hardhat');
const { forward } = require('./time');
const { ProposalState } = require('./enums');
const { unique } = require('./iterate');

const timelockSalt = (address, descriptionHash) =>
  ethers.toBeHex((ethers.toBigInt(address) << 96n) ^ ethers.toBigInt(descriptionHash), 32);

class GovernorHelper {
  constructor(governor, mode = 'blocknumber') {
    this.governor = governor;
    this.mode = mode;
  }

  connect(account) {
    this.governor = this.governor.connect(account);
    return this;
  }

  delegate(delegation) {
    return Promise.all([
      delegation.token.connect(delegation.to).delegate(delegation.to),
      delegation.value === undefined ||
        delegation.token.connect(this.governor.runner).transfer(delegation.to, delegation.value),
      delegation.tokenId === undefined ||
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

    return this.governor.queue(...proposal.shortProposal);
  }

  execute() {
    const proposal = this.currentProposal;

    return this.governor.execute(...proposal.shortProposal);
  }

  cancel(visibility = 'external') {
    const proposal = this.currentProposal;

    switch (visibility) {
      case 'external':
        return this.governor.cancel(...proposal.shortProposal);

      case 'internal':
        return this.governor.$_cancel(...proposal.shortProposal);

      default:
        throw new Error(`unsupported visibility "${visibility}"`);
    }
  }

  async vote(vote = {}) {
    let method = 'castVote'; // default
    let args = [this.currentProposal.id, vote.support]; // base

    if (vote.signature) {
      const sign = await vote.signature(this.governor, this.forgeMessage(vote));
      if (vote.params || vote.reason) {
        method = 'castVoteWithReasonAndParamsBySig';
        args.push(vote.voter, vote.reason || '', vote.params || '', sign);
      } else {
        method = 'castVoteBySig';
        args.push(vote.voter, sign);
      }
    } else if (vote.params) {
      method = 'castVoteWithReasonAndParams';
      args.push(vote.reason || '', vote.params);
    } else if (vote.reason) {
      method = 'castVoteWithReason';
      args.push(vote.reason);
    }

    return await this.governor[method](...args);
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

  async waitForEta(offset = 0n) {
    const proposal = this.currentProposal;
    const timestamp = await this.governor.proposalEta(proposal.id);
    return forward.timestamp(timestamp + offset);
  }

  /**
   * Specify a proposal either as
   * 1) an array of objects [{ target, value, data }]
   * 2) an object of arrays { targets: [], values: [], data: [] }
   */
  setProposal(actions, description) {
    let targets, values, data;

    if (Array.isArray(actions)) {
      targets = actions.map(a => a.target);
      values = actions.map(a => a.value || 0n);
      data = actions.map(a => a.data || '0x');
    } else {
      ({ targets, values, data } = actions);
    }

    const fulldata = data.map(d => ethers.concat(['0x', d]));

    const descriptionHash = ethers.id(description);

    // condensed version for queueing end executing
    const shortProposal = [targets, values, data, descriptionHash];

    // full version for proposing
    const fullProposal = [targets, values, ...[], data, description];

    // proposal id
    const id = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(['address[]', 'uint256[]', 'bytes[]', 'bytes32'], shortProposal),
    );

    this.currentProposal = {
      id,
      targets,
      values,
      signatures: [''], // Backwards compatibility with ProposalCreated event
      data,
      fulldata,
      description,
      descriptionHash,
      shortProposal,
      fullProposal,
    };

    return this.currentProposal;
  }

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
  static proposalStatesToBitMap(proposalStates, options = {}) {
    if (!Array.isArray(proposalStates)) {
      proposalStates = [proposalStates];
    }
    const statesCount = BigInt(Object.keys(ProposalState).length);
    let result = 0n;

    for (const state of unique(...proposalStates)) {
      if (state < 0n || state >= statesCount) {
        expect.fail(`ProposalState ${state} out of possible states (0...${statesCount}-1)`);
      } else {
        result |= 1n << state;
      }
    }

    if (options.inverted) {
      const mask = 2n ** statesCount - 1n;
      result = result ^ mask;
    }

    return ethers.toBeHex(result, 32);
  }
}

module.exports = {
  GovernorHelper,
  timelockSalt,
};
