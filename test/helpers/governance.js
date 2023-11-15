const { web3 } = require('hardhat');
const { forward } = require('../helpers/time');
const { ProposalState } = require('./enums');

function zip(...args) {
  return Array(Math.max(...args.map(array => array.length)))
    .fill()
    .map((_, i) => args.map(array => array[i]));
}

function concatHex(...args) {
  return web3.utils.bytesToHex([].concat(...args.map(h => web3.utils.hexToBytes(h || '0x'))));
}

function concatOpts(args, opts = null) {
  return opts ? args.concat(opts) : args;
}

const timelockSalt = (address, descriptionHash) =>
  '0x' + web3.utils.toBN(address).shln(96).xor(web3.utils.toBN(descriptionHash)).toString(16, 64);

class GovernorHelper {
  constructor(governor, mode = 'blocknumber') {
    this.governor = governor;
    this.mode = mode;
  }

  delegate(delegation = {}, opts = null) {
    return Promise.all([
      delegation.token.delegate(delegation.to, { from: delegation.to }),
      delegation.value && delegation.token.transfer(...concatOpts([delegation.to, delegation.value]), opts),
      delegation.tokenId &&
        delegation.token
          .ownerOf(delegation.tokenId)
          .then(owner =>
            delegation.token.transferFrom(...concatOpts([owner, delegation.to, delegation.tokenId], opts)),
          ),
    ]);
  }

  propose(opts = null) {
    const proposal = this.currentProposal;

    return this.governor.methods[
      proposal.useCompatibilityInterface
        ? 'propose(address[],uint256[],string[],bytes[],string)'
        : 'propose(address[],uint256[],bytes[],string)'
    ](...concatOpts(proposal.fullProposal, opts));
  }

  queue(opts = null) {
    const proposal = this.currentProposal;

    return proposal.useCompatibilityInterface
      ? this.governor.methods['queue(uint256)'](...concatOpts([proposal.id], opts))
      : this.governor.methods['queue(address[],uint256[],bytes[],bytes32)'](
          ...concatOpts(proposal.shortProposal, opts),
        );
  }

  execute(opts = null) {
    const proposal = this.currentProposal;

    return proposal.useCompatibilityInterface
      ? this.governor.methods['execute(uint256)'](...concatOpts([proposal.id], opts))
      : this.governor.methods['execute(address[],uint256[],bytes[],bytes32)'](
          ...concatOpts(proposal.shortProposal, opts),
        );
  }

  cancel(visibility = 'external', opts = null) {
    const proposal = this.currentProposal;

    switch (visibility) {
      case 'external':
        if (proposal.useCompatibilityInterface) {
          return this.governor.methods['cancel(uint256)'](...concatOpts([proposal.id], opts));
        } else {
          return this.governor.methods['cancel(address[],uint256[],bytes[],bytes32)'](
            ...concatOpts(proposal.shortProposal, opts),
          );
        }
      case 'internal':
        return this.governor.methods['$_cancel(address[],uint256[],bytes[],bytes32)'](
          ...concatOpts(proposal.shortProposal, opts),
        );
      default:
        throw new Error(`unsupported visibility "${visibility}"`);
    }
  }

  vote(vote = {}, opts = null) {
    const proposal = this.currentProposal;

    return vote.signature
      ? // if signature, and either params or reason →
        vote.params || vote.reason
        ? this.sign(vote).then(signature =>
            this.governor.castVoteWithReasonAndParamsBySig(
              ...concatOpts(
                [proposal.id, vote.support, vote.voter, vote.reason || '', vote.params || '', signature],
                opts,
              ),
            ),
          )
        : this.sign(vote).then(signature =>
            this.governor.castVoteBySig(...concatOpts([proposal.id, vote.support, vote.voter, signature], opts)),
          )
      : vote.params
      ? // otherwise if params
        this.governor.castVoteWithReasonAndParams(
          ...concatOpts([proposal.id, vote.support, vote.reason || '', vote.params], opts),
        )
      : vote.reason
      ? // otherwise if reason
        this.governor.castVoteWithReason(...concatOpts([proposal.id, vote.support, vote.reason], opts))
      : this.governor.castVote(...concatOpts([proposal.id, vote.support], opts));
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

  async waitForSnapshot(offset = 0) {
    const proposal = this.currentProposal;
    const timepoint = await this.governor.proposalSnapshot(proposal.id);
    return forward[this.mode](timepoint.addn(offset));
  }

  async waitForDeadline(offset = 0) {
    const proposal = this.currentProposal;
    const timepoint = await this.governor.proposalDeadline(proposal.id);
    return forward[this.mode](timepoint.addn(offset));
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
    const id = web3.utils.toBN(
      web3.utils.keccak256(
        web3.eth.abi.encodeParameters(['address[]', 'uint256[]', 'bytes[]', 'bytes32'], shortProposal),
      ),
    );

    this.currentProposal = {
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

    return this.currentProposal;
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

  const uniqueProposalStates = new Set(proposalStates.map(bn => bn.toNumber())); // Remove duplicates
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
