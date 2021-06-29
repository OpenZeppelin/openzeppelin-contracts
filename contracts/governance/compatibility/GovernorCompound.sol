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
 * _Available since v4.3._
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



    // public for hooking + default: 0
    function proposalThreshold() public view virtual override returns (uint256) {
        return 0;
    }

    // public for hooking
    function proposalEta(uint256 proposalId) public view virtual override returns (uint256);

    // public for hooking
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public virtual override returns (uint256);

    // ============================================== Proposal lifecycle ==============================================
    /**
     * @dev See {IGovernor-propose}.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override(IGovernor, Governor) returns (uint256) {
        return propose(targets, values, new string[](calldatas.length), calldatas, description);
    }

    /**
     * @dev See {IGovernorCompound-propose}.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        require(
            getVotes(msg.sender, block.number - 1) >= proposalThreshold(),
            "GovernorCompound: proposer votes below proposal threshold"
        );

        uint256 proposalId = super.propose(targets, values, _encodeCalldata(signatures, calldatas), description);
        _storeProposal(proposalId, _msgSender(), targets, values, signatures, calldatas, description);
        return proposalId;
    }

    /**
     * @dev See {IGovernorCompound-queue}.
     */
    function queue(uint256 proposalId) public virtual override {
        ProposalDetails storage details = _proposalDetails[proposalId];
        queue(details.targets, details.values, _encodeCalldata(details.signatures, details.calldatas), details.salt);
    }

    /**
     * @dev See {IGovernorCompound-execute}.
     */
    function execute(uint256 proposalId) public payable virtual override {
        ProposalDetails storage details = _proposalDetails[proposalId];
        execute(details.targets, details.values, _encodeCalldata(details.signatures, details.calldatas), details.salt);
    }

    /**
     * @dev Encodes calldatas with optional function signature.
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

    /**
     * @dev Store proposal metadata for later lookup
     */
    function _storeProposal(
        uint256 proposalId,
        address proposer,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) private {
        ProposalDetails storage details = _proposalDetails[proposalId];

        details.proposer = proposer;
        details.targets = targets;
        details.values = values;
        details.signatures = signatures;
        details.calldatas = calldatas;
        details.salt = keccak256(bytes(description));
    }

    // ==================================================== Views =====================================================
    /**
     * @dev See {IGovernorCompound-proposals}.
     */
        function proposals(uint256 proposalId) public view virtual override returns (Proposal memory) {
        Proposal memory result;
        result.id = proposalId;
        result.eta = proposalEta(proposalId);

        ProposalDetails storage details = _proposalDetails[proposalId];
        result.proposer = details.proposer;
        result.targets = details.targets;
        result.values = details.values;
        result.signatures = details.signatures;
        result.calldatas = details.calldatas;
        result.forVotes = details.forVotes;
        result.againstVotes = details.againstVotes;
        result.abstainVotes = details.abstainVotes;

        ProposalCore memory core = _getProposal(proposalId);
        result.startBlock = core.voteStart.getDeadline();
        result.endBlock = core.voteEnd.getDeadline();

        ProposalState status = state(proposalId);
        result.canceled = status == ProposalState.Canceled;
        result.executed = status == ProposalState.Executed;
        return result;
    }

    /**
     * @dev See {IGovernorCompound-getActions}.
     */
    function getActions(uint256 proposalId)
        public
        view
        virtual
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

    /**
     * @dev See {IGovernorCompound-getReceipt}.
     */
    function getReceipt(uint256 proposalId, address voter) public view virtual override returns (Receipt memory) {
        return _proposalDetails[proposalId].receipts[voter];
    }

    /**
     * @dev See {IGovernorCompound-quorumVotes}.
     */
    function quorumVotes() public view virtual override returns (uint256) {
        return quorum(block.number);
    }


    // ==================================================== Voting ====================================================
    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalDetails[proposalId].receipts[account].hasVoted;
    }

    /**
     * @dev See {IGovernor-proposalWeight}. In this module, only forVotes count toward the quorum.
     */
    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalDetails storage details = _proposalDetails[proposalId];
        return quorum(proposalSnapshot(proposalId)) < details.forVotes;
    }

    /**
     * @dev See {IGovernor-_voteSuccess}. In this module, the forVotes must be scritly over the againstVotes.
     */
    function _voteSuccess(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalDetails storage details = _proposalDetails[proposalId];
        return details.forVotes > details.againstVotes;
    }

    /**
     * @dev See {IGovernor-_pushVote}. In this module, the support follows Governor Bravo.
     */
    function _pushVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal virtual override {
        ProposalDetails storage details = _proposalDetails[proposalId];
        Receipt storage receipt = details.receipts[account];

        require(!receipt.hasVoted, "GovernorCompound: vote already casted");
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
            revert("GovernorCompound: invalid vote type");
        }
    }
}
