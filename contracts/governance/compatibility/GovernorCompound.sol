// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/Counters.sol";
import "../../utils/math/SafeCast.sol";
import "../extensions/IGovernorTimelock.sol";
import "../Governor.sol";
import "./IGovernorCompound.sol";

/**
 * @dev Compatibility layer that implements GovernorBravo compatibility on to of {Governor}.
 *
 * This compatibility layer includes a voting system and requires a {IGovernorTimelock} compatible module to be added
 * through inheritance. It does not include token bindings, not does it include any variable upgrade patterns.
 *
 * _Available since v4.2._
 */
abstract contract GovernorCompound is IGovernorTimelock, IGovernorCompound, Governor {
    using Counters for Counters.Counter;
    using Timers for Timers.BlockNumber;

    struct ProposalDetails {
        address proposer;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        mapping(address => Receipt) receipts;
        bytes32 salt;
    }

    mapping(uint256 => ProposalDetails) internal _proposalDetails;

    Counters.Counter private _saltCounter;

    // ============================================== Proposal lifecycle ==============================================
    /**
     * ~210k gas to deploy
     */
    function proposals(uint256 proposalId) external view override returns (Proposal memory) {
        ProposalState status = state(proposalId);
        ProposalCore memory core = _getProposal(proposalId);
        ProposalDetails storage details = _proposalDetails[proposalId];

        Proposal memory result;
        result.id = proposalId;
        result.proposer = details.proposer;
        result.eta = proposalEta(proposalId);
        result.targets = details.targets;
        result.values = details.values;
        result.signatures = details.signatures;
        result.calldatas = details.calldatas;
        result.startBlock = core.voteStart.getDeadline();
        result.endBlock = core.voteEnd.getDeadline();
        result.forVotes = details.forVotes;
        result.againstVotes = details.againstVotes;
        result.abstainVotes = details.abstainVotes;
        result.canceled = status == ProposalState.Canceled;
        result.executed = status == ProposalState.Executed;
        return result;
    }

    /**
     * ~265k gas to deploy
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        // Enshure the same proposal can be proposed twice through this saltless interface. Proposal can be frontrun
        // using the core interface, but the id will only be used if the frontrun proposal is identical, which makes
        // this situation ok (the frontrunner would not prevent anything, it would activelly accellerate the proposal).
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

    /**
     * ~130k gas to deploy
     */
    function queue(uint256 proposalId) external override {
        ProposalDetails storage details = _proposalDetails[proposalId];
        queue(details.targets, details.values, _encodeCalldata(details.signatures, details.calldatas), details.salt);
    }

    /**
     * ~130k gas to deploy
     */
    function execute(uint256 proposalId) external payable override {
        ProposalDetails storage details = _proposalDetails[proposalId];
        execute(details.targets, details.values, _encodeCalldata(details.signatures, details.calldatas), details.salt);
    }

    /**
     * ~90k gas to deploy
     */
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
        override
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

    function getReceipt(uint256 proposalId, address voter) external view override returns (Receipt memory) {
        return _proposalDetails[proposalId].receipts[voter];
    }

    // ==================================================== Voting ====================================================
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalDetails[proposalId].receipts[account].hasVoted;
    }

    function quorumVotes() external view virtual override returns (uint256) {
        return quorum(block.number);
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
        Receipt storage receipt = details.receipts[account];

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
