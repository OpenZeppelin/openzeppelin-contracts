// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/draft-EIP712.sol";
import "../utils/introspection/ERC165.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";
import "../utils/Timers.sol";
import "./IGovernor.sol";

/**
 * @dev Core of the governance system, designed to be extended though various modules.
 *
 * _Available since v4.3._
 */
abstract contract Governor is Context, ERC165, EIP712, IGovernor {
    using Timers for Timers.BlockNumber;

    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    struct ProposalCore {
        Timers.BlockNumber voteStart;
        Timers.BlockNumber voteEnd;
        bool executed;
        bool canceled;
    }

    string private _name;

    mapping(uint256 => ProposalCore) private _proposals;

    /**
     * @dev Sets the value for {name} and {version}
     */
    constructor(string memory name_) EIP712(name_, version()) {
        _name = name_;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return interfaceId == type(IGovernor).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Name of the governor instance (used in building the ERC712 domain separator).
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Version of the governor instance (used in building the ERC712 domain separator). Default: "1"
     */
    function version() public view virtual returns (string memory) {
        return "1";
    }

    /**
     * @dev Hashing function used to (re)build the proposal id from the proposal details..
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public view virtual returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    /**
     * @dev See {IGovernor-version}.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalCore memory proposal = _proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        } else if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.voteStart.isPending()) {
            return ProposalState.Pending;
        } else if (proposal.voteEnd.isPending()) {
            return ProposalState.Active;
        } else if (proposal.voteEnd.isExpired()) {
            return
                _quorumReached(proposalId) && _voteSuccess(proposalId)
                    ? ProposalState.Succeeded
                    : ProposalState.Defeated;
        } else {
            revert("Governor::state: invalid proposal id");
        }
    }

    /**
     * @dev See {IGovernor-proposalSnapshot}.
     */
    function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposals[proposalId].voteStart.getDeadline();
    }

    /**
     * @dev See {IGovernor-proposalDeadline}.
     */
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposals[proposalId].voteEnd.getDeadline();
    }

    /**
     * @dev See {IGovernor-votingDelay}
     *
     * Default: 0
     */
    function votingDelay() public view virtual override returns (uint64) {
        return 0;
    }

    /**
     * @dev See {IGovernor-votingPeriod}
     */
    function votingPeriod() public view virtual override returns (uint64);

    /**
     * @dev See {IGovernor-quorum}
     */
    function quorum(uint256 blockNumber) public view virtual override returns (uint256);

    /**
     * @dev See {IGovernor-getVotes}
     */
    function getVotes(address account, uint256 blockNumber) public view virtual override returns (uint256);

    /**
     * @dev Internal proposal viewer
     */
    function _getProposal(uint256 proposalId) internal view returns (ProposalCore memory) {
        return _proposals[proposalId];
    }

    /**
     * @notice module:voting
     * @dev Amont of votes already casted passes the threshold limit.
     */
    function _quorumReached(uint256 proposalId) internal view virtual returns (bool);

    /**
     * @notice module:voting
     * @dev Is the proposal successfull or not.
     */
    function _voteSuccess(uint256 proposalId) internal view virtual returns (bool);

    /**
     * @notice module:core
     * @dev See {IGovernor-propose}.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

        require(targets.length == values.length, "Governance: invalid proposal length");
        require(targets.length == calldatas.length, "Governance: invalid proposal length");
        require(targets.length > 0, "Governance: empty proposal");

        ProposalCore storage proposal = _proposals[proposalId];
        require(proposal.voteStart.isUnset(), "Governance: proposal already exists");

        uint64 snapshot = uint64(block.number) + votingDelay();
        uint64 deadline = snapshot + votingPeriod();

        proposal.voteStart.setDeadline(snapshot);
        proposal.voteEnd.setDeadline(deadline);

        emit ProposalCreated(
            proposalId,
            _msgSender(),
            targets,
            values,
            new string[](targets.length),
            calldatas,
            snapshot,
            deadline,
            description
        );

        return proposalId;
    }

    /**
     * @notice module:core
     * @dev See {IGovernor-execute}.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(state(proposalId) == ProposalState.Succeeded, "Governance: proposal not successfull");
        _proposals[proposalId].executed = true;

        for (uint256 i = 0; i < targets.length; ++i) {
            if (calldatas[i].length == 0) {
                Address.sendValue(payable(targets[i]), values[i]);
            } else {
                Address.functionCallWithValue(targets[i], calldatas[i], values[i]);
            }
        }

        emit ProposalExecuted(proposalId);

        return proposalId;
    }

    /**
     * @notice module:core
     * @dev Internal cancel mechanism: locks up the proposal timer, preventing it from being re-submitted. Marks it as
     * canceled to allow distinguishing it from executed proposals.
     *
     * Emits a {IGovernor-ProposalCanceled} event.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        ProposalState status = state(proposalId);

        require(
            status != ProposalState.Canceled && status != ProposalState.Expired && status != ProposalState.Executed,
            "Governance: proposal not active"
        );
        _proposals[proposalId].canceled = true;

        emit ProposalCanceled(proposalId);

        return proposalId;
    }

    /**
     * @notice module:core
     * @dev See {IGovernor-castVote}.
     */
    function castVote(uint256 proposalId, uint8 support) public virtual override returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, "");
    }

    /**
     * @notice module:core
     * @dev See {IGovernor-castVoteWithReason}.
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public virtual override returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, reason);
    }

    /**
     * @notice module:core
     * @dev See {IGovernor-castVoteBySig}.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override returns (uint256) {
        address voter = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support))),
            v,
            r,
            s
        );
        return _castVote(proposalId, voter, support, "");
    }

    /**
     * @notice module:core
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been casted yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {IGovernor-_pushVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual returns (uint256) {
        ProposalCore memory proposal = _proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Governance: vote not currently active");

        uint256 weight = getVotes(account, proposal.voteStart.getDeadline());
        _pushVote(proposalId, account, support, weight);

        emit VoteCast(account, proposalId, support, weight, reason);

        return weight;
    }

    /**
     * @notice module:voting
     * @dev Internal abstract interface to the voting module: register a vote with a given support and voting weight.
     *
     * Note: Support is generic and can represent various things depending
     * on the voting system used.
     */
    function _pushVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal virtual;
}
