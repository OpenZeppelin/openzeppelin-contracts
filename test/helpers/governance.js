const { time } = require('@openzeppelin/test-helpers');

function zip (...args) {
  return Array(Math.max(...args.map(array => array.length)))
    .fill()
    .map((_, i) => args.map(array => array[i]));
}

function concatHex (...args) {
  return web3.utils.bytesToHex([].concat(...args.map(h => web3.utils.hexToBytes(h || '0x'))));
}

function concatOpts (args, opts = null) {
  return opts ? args.concat(opts) : args;
}

class GovernorHelper {
  reset () {
    Object.getOwnPropertyNames(this).forEach(property => delete this[property]);
  }

  setup (governor) {
    this.governor = governor;
  }

  delegate (delegation = {}, opts = null) {
    return Promise.all([
      delegation.token.delegate(delegation.to, { from: delegation.to }),
      delegation.value &&
        delegation.token.transfer(...concatOpts([ delegation.to, delegation.value ]), opts),
      delegation.tokenId &&
        delegation.token.ownerOf(delegation.tokenId).then(owner =>
          delegation.token.transferFrom(...concatOpts([ owner, delegation.to, delegation.tokenId ], opts)),
        ),
    ]);
  }

  propose (opts = null, proposal = undefined) {
    const details = this.setProposal(proposal);

    return this.governor.methods[
      details.useCompatibilityInterface
        ? 'propose(address[],uint256[],string[],bytes[],string)'
        : 'propose(address[],uint256[],bytes[],string)'
    ](...concatOpts(details.proposal, opts));
  }

  queue (opts = null, proposal = undefined) {
    const details = this.setProposal(proposal);

    return details.useCompatibilityInterface
      ? this.governor.methods['queue(uint256)'](...concatOpts(
        [ details.id ],
        opts,
      ))
      : this.governor.methods['queue(address[],uint256[],bytes[],bytes32)'](...concatOpts(
        details.shortProposal,
        opts,
      ));
  }

  execute (opts = null, proposal = undefined) {
    const details = this.setProposal(proposal);

    return details.useCompatibilityInterface
      ? this.governor.methods['execute(uint256)'](...concatOpts(
        [ details.id ],
        opts,
      ))
      : this.governor.methods['execute(address[],uint256[],bytes[],bytes32)'](...concatOpts(
        details.shortProposal,
        opts,
      ));
  }

  cancel (opts = null, proposal = undefined) {
    const details = this.setProposal(proposal);

    return details.useCompatibilityInterface
      ? this.governor.methods['cancel(uint256)'](...concatOpts(
        [ details.id ],
        opts,
      ))
      : this.governor.methods['cancel(address[],uint256[],bytes[],bytes32)'](...concatOpts(
        details.shortProposal,
        opts,
      ));
  }

  vote (vote = {}, opts = null, proposal = undefined) {
    const details = this.setProposal(proposal);

    return vote.signature
      ? vote.signature({ proposalId: details.id, support: vote.support })
        .then(({ v, r, s }) => this.governor.castVoteBySig(...concatOpts(
          [ details.id, vote.support, v, r, s ],
          opts,
        )))
      : vote.reason
        ? this.governor.castVoteWithReason(...concatOpts(
          [ details.id, vote.support, vote.reason ],
          opts,
        ))
        : this.governor.castVote(...concatOpts(
          [ details.id, vote.support ],
          opts,
        ));
  }

  waitForSnapshot (offset = 0, proposal = undefined) {
    const details = this.setProposal(proposal);
    return this.governor.proposalSnapshot(details.id)
      .then(blockNumber => time.advanceBlockTo(blockNumber.addn(offset)));
  }

  waitForDeadline (offset = 0, proposal = undefined) {
    const details = this.setProposal(proposal);
    return this.governor.proposalDeadline(details.id)
      .then(blockNumber => time.advanceBlockTo(blockNumber.addn(offset)));
  }

  waitForEta (offset = 0, proposal = undefined) {
    const details = this.setProposal(proposal);
    return this.governor.proposalEta(details.id)
      .then(timestamp => time.increaseTo(timestamp.addn(offset)));
  }

  setProposal (proposal) {
    if (proposal) {
      const useCompatibilityInterface = proposal.length === 5;
      const description = proposal[proposal.length - 1];
      const shortProposal = [
        // targets
        proposal[0],
        // values
        proposal[1],
        // calldata (prefix selector if necessary)
        useCompatibilityInterface
          ? zip(
            proposal[2].map(selector => selector && web3.eth.abi.encodeFunctionSignature(selector)),
            proposal[3],
          ).map(hexs => concatHex(...hexs))
          : proposal[2],
        // descriptionHash
        web3.utils.keccak256(description),
      ];
      const id = web3.utils.toBN(web3.utils.keccak256(web3.eth.abi.encodeParameters(
        [ 'address[]', 'uint256[]', 'bytes[]', 'bytes32' ],
        shortProposal,
      )));

      this.lastProposalDetails = {
        id,
        proposal,
        shortProposal,
        description,
        useCompatibilityInterface,
      };
    }
    return this.lastProposalDetails;
  }
}

module.exports = new GovernorHelper();
