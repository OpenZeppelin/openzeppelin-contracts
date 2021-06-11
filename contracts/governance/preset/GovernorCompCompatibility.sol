// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/Counters.sol";
import "../../utils/math/SafeCast.sol";
import "../Governor.sol";
import "../extensions/IGovernorTimelock.sol";

/**
 * TODO
 * _Available since v4.2._
 */
abstract contract GovernorCompCompatibility is IGovernorTimelock, Governor {
    using Counters for Counters.Counter;
    using Timers for Timers.BlockNumber;

    struct CompProposal {
        uint256 id;
        address proposer;
        uint256 eta;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
    }
    struct CompReceipt {
        bool hasVoted;
        uint8 support;
        uint96 votes;
    }
    struct ProposalDetails {
        address proposer;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        mapping(address => CompReceipt) receipts;
        bytes32 salt;
    }

    mapping(uint256 => ProposalDetails) internal _proposalDetails;

    Counters.Counter private _saltCounter;

    // ============================================== Proposal lifecycle ==============================================
    function proposal(uint256 proposalId) external view returns (CompProposal memory) {
        Proposal memory core = getProposal(proposalId);
        ProposalDetails storage details = _proposalDetails[proposalId];

        CompProposal memory result;
        result.id = proposalId;
        result.proposer = details.proposer;
        result.eta = this.proposalEta(proposalId);
        result.targets = details.targets;
        result.values = details.values;
        result.signatures = details.signatures;
        result.calldatas = details.calldatas;
        result.startBlock = core.voteStart.getDeadline();
        result.endBlock = core.voteEnd.getDeadline();
        result.forVotes = details.forVotes;
        result.againstVotes = details.againstVotes;
        result.abstainVotes = details.abstainVotes;
        result.canceled = core.canceled;
        result.executed = core.executed;
        return result;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        bytes32 salt = bytes32(_saltCounter.current());
        _saltCounter.increment();

        uint256 proposalId = propose(targets, values, _encodeCalldata(signatures, calldatas), salt, description);

        ProposalDetails storage details = _proposalDetails[proposalId];
        details.proposer = _msgSender();
        details.targets = targets;
        details.values = values;
        details.signatures = signatures;
        details.calldatas = calldatas;
        details.salt = salt;

        return proposalId;
    }

    function queue(uint256 proposalId) external {
        ProposalDetails storage details = _proposalDetails[proposalId];
        queue(details.targets, details.values, _encodeCalldata(details.signatures, details.calldatas), details.salt);
    }

    function execute(uint256 proposalId) external payable {
        ProposalDetails storage details = _proposalDetails[proposalId];
        execute(details.targets, details.values, _encodeCalldata(details.signatures, details.calldatas), details.salt);
    }


    function _encodeCalldata(string[] memory signatures, bytes[] memory calldatas)
        private
        pure
        returns (bytes[] memory)
    {
        bytes[] memory fullcalldatas = new bytes[](calldatas.length);

        for (uint256 i = 0; i < signatures.length; ++i) {
            fullcalldatas[i] = bytes(signatures[i]).length == 0
                ? calldatas[i]
                : abi.encodePacked(bytes4(keccak256(bytes(signatures[i]))), calldatas[i]);
        }

        return fullcalldatas;
    }

    // ==================================================== Views =====================================================
    function getActions(uint256 proposalId)
        external
        view
        returns (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas
        )
    {
        ProposalDetails storage details = _proposalDetails[proposalId];
        return (details.targets, details.values, details.signatures, details.calldatas);
    }

    function getReceipt(uint256 proposalId, address voter) external view returns (CompReceipt memory) {
        return _proposalDetails[proposalId].receipts[voter];
    }

    // ==================================================== Voting ====================================================
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalDetails[proposalId].receipts[account].hasVoted;
    }

    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalDetails storage details = _proposalDetails[proposalId];
        return quorum(proposalSnapshot(proposalId)) < details.forVotes;
    }

    function _voteSuccess(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalDetails storage details = _proposalDetails[proposalId];
        return details.forVotes > details.againstVotes;
    }

    function _pushVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal virtual override {
        ProposalDetails storage details = _proposalDetails[proposalId];
        CompReceipt storage receipt = details.receipts[account];

        require(!receipt.hasVoted, "GovernorCompCompatibility: vote already casted");
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = SafeCast.toUint96(weight);

        if (support == 0) {
            details.againstVotes += weight;
        } else if (support == 1) {
            details.forVotes += weight;
        } else if (support == 2) {
            details.abstainVotes += weight;
        } else {
            revert("GovernorCompCompatibility: invalid vote type");
        }
    }
}
