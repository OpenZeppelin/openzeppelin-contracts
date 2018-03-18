pragma solidity ^0.4.18;

import "../voting/Proposable.sol";


contract ProposableMock is Proposable {

  function getClout(address) view internal returns (uint clout) {
    clout = 1;
  }

  function tallyVotes(uint tallyFor, uint tallyAgainst) view internal returns (Actions action) {
    action = Actions.Pend;

    if (tallyFor > 1) {
      action = Actions.Accept;
    } else if (tallyAgainst > 1) {
      action = Actions.Reject;
    }
  }

  function closeProposal(bytes32 hash) internal {
    Proposal storage proposal = proposals[hash];
    require(proposal.status == Status.Open);

    proposal.status = Status.Closed;
    ProposalClosed(hash);
  }

  function executeProposal(bytes32 hash) internal {
    Proposal storage proposal = proposals[hash];
    require(proposal.status == Status.Accepted);

    proposal.status = Status.Executed;
    ProposalExecuted(hash);
  }
}
