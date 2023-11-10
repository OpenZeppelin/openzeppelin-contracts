const { web3 } = require('hardhat');
const { forward } = require('../helpers/time');
const { ProposalState } = require('./enums');
const { ethers } = require('ethers');

function zip(...args) {
  return Array(Math.max(...args.map(array => array.length)))
    .fill()
    .map((_, i) => args.map(array => array[i]));
}

function concatHex(...args) {
  return web3.utils.bytesToHex([].concat(...args.map(h => web3.utils.hexToBytes(h || '0x'))));
}

const timelockSalt = (address, descriptionHash) =>
  '0x' + web3.utils.toBN(address).shln(96).xor(web3.utils.toBN(descriptionHash)).toString(16, 64);

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
   * 1) an array of objects [{ target, value, data, signature? }]
   * 2) an object of arrays { targets: [], values: [], data: [], signatures?: [] }
   */
  setProposal(actions, description) {
    let targets, values, signatures, data, useCompatibilityInterface;

    if (Array.isArray(actions)) {
      useCompatibilityInterface = actions.some(a => 'signature' in a);
      targets = actions.map(a => a.target);
      values = actions.map(a => a.value || '0');
      signatures = actions.map(a => a.signature || '');
      data = actions.map(a => a.data || '0x');
    } else {
      useCompatibilityInterface = Array.isArray(actions.signatures);
      ({ targets, values, signatures = [], data } = actions);
    }

    const fulldata = zip(
      signatures.map(s => s && web3.eth.abi.encodeFunctionSignature(s)),
      data,
    ).map(hexs => concatHex(...hexs));

    const descriptionHash = web3.utils.keccak256(description);

    // condensed version for queueing end executing
    const shortProposal = [targets, values, fulldata, descriptionHash];

    // full version for proposing
    const fullProposal = [targets, values, ...(useCompatibilityInterface ? [signatures] : []), data, description];

    // proposal id
    const id = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(['address[]', 'uint256[]', 'bytes[]', 'bytes32'], shortProposal),
    );

    const currentProposal = {
      id,
      targets,
      values,
      signatures,
      data,
      fulldata,
      description,
      descriptionHash,
      shortProposal,
      fullProposal,
      useCompatibilityInterface,
    };

    return new GovernorHelper(this.governor, this.mode, currentProposal);
  }
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

  const hex = web3.utils.numberToHex(result);
  return web3.utils.padLeft(hex, 64);
}

module.exports = {
  GovernorHelper,
  proposalStatesToBitMap,
  timelockSalt,
};
