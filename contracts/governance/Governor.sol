// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/draft-EIP712.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";
import "../utils/Time.sol";
import "./IGovernor.sol";

/**
 * @dev Core of the governance system, designed to be extended though various modules.
 *
 * _Available since v4.2._
 */
abstract contract Governor is IGovernor, EIP712, Context {
    using Time for Time.Timer;

    bytes32 private constant _BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    struct Proposal {
        Time.Timer timer;
        uint256 snapshot;
        bool canceled;
    }

    string private _name;
    string private _version;

    mapping (uint256 => Proposal) private _proposals;

    /**
     * @dev Sets the value for {name} and {version}
     */
    constructor(string memory name_, string memory version_)
    EIP712(name_, version_)
    {
        _name = name_;
        _version = version_;
    }

    /**
     * @dev See {IGovernor-name}.
     */
    function name() external view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IGovernor-version}.
     */
    function version() external view virtual override returns (string memory) {
        return _version;
    }

    /**
     * @dev See {IGovernor-version}.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        Proposal memory proposal = _proposals[proposalId];

        if (proposal.timer.isUnset()) {
            // There is no ProposalState for unset proposals
            revert("Governor::state: invalid proposal id");
        } else if (block.number <= proposal.snapshot) {
            return ProposalState.Pending;
        } else if (proposal.timer.isPending()) {
            return ProposalState.Active;
        } else if (proposal.timer.isExpired()) {
            return (proposalWeight(proposalId) >= quorum(proposal.snapshot) && _voteSuccess(proposalId))
                ? ProposalState.Succeeded
                : ProposalState.Defeated;
        } else if (proposal.canceled) {
            return ProposalState.Canceled;
        } else {
            return ProposalState.Executed;
        }
    }

    /**
     * @dev See {IGovernor-proposalDeadline}.
     */
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposals[proposalId].timer.getDeadline();
    }

    /**
     * @dev See {IGovernor-proposalSnapshot}.
     */
    function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposals[proposalId].snapshot;
    }

    /**
     * @dev See {IGovernor-hashProposal}.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        public view virtual override returns (uint256 proposalId)
    {
        return uint256(keccak256(abi.encode(targets, values, calldatas, salt)));
    }


    /**
     * @dev See {IGovernor-propose}.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt,
        string memory description
    )
        public virtual override returns (uint256 proposalId)
    {
        uint256 snapshot;
        uint256 deadline;
        (proposalId, snapshot, deadline) = _propose(targets, values, calldatas, salt);
        emit ProposalCreated(proposalId, _msgSender(), targets, values, calldatas, salt, snapshot, deadline, description);
    }

    /**
     * @dev See {IGovernor-execute}.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        public payable virtual override returns (uint256 proposalId)
    {
        proposalId = _execute(targets, values, calldatas, salt);
        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev See {IGovernor-castVote}.
     */
    function castVote(uint256 proposalId, uint8 support) public virtual override returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support);
    }

    /**
     * @dev See {IGovernor-castVoteBySig}.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        public virtual override returns (uint256)
    {
        address voter = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(_BALLOT_TYPEHASH, proposalId, support))),
            v, r, s
        );
        return _castVote(proposalId, voter, support);
    }

    /**
     * @dev Internal propose mechanism: Hashes proposal and sets snapshot and deadline. Revert if proposal is already
     * registered.
     *
     * Note: does not emit any events. Events are part of the public function so they can be customized.
     */
    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        internal virtual returns (uint256 proposalId, uint256 snapshot, uint256 deadline)
    {
        proposalId = hashProposal(targets, values, calldatas, salt);

        require(targets.length == values.length,    "Governance: invalid proposal length");
        require(targets.length == calldatas.length, "Governance: invalid proposal length");
        require(targets.length > 0,                 "Governance: empty proposal");

        Proposal storage proposal = _proposals[proposalId];
        require(proposal.timer.isUnset(), "Governance: proposal already exists");

        snapshot = block.number + votingDelay();
        deadline = block.timestamp + votingDuration();

        proposal.snapshot = snapshot;
        proposal.timer.setDeadline(deadline);
    }

    /**
     * @dev Internal cancel mechanism: locks up the proposal timer, preventing it from being re-submitted. Marks it as
     * canceled to allow distinguishing it from executed proposals.
     *
     * Emits a {IGovernor-ProposalCanceled} event.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        internal virtual returns (uint256 proposalId)
    {
        proposalId = hashProposal(targets, values, calldatas, salt);
        require(_proposals[proposalId].timer.isActive(), "Governance: proposal is not active");
        _proposals[proposalId].timer.lock();
        _proposals[proposalId].canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Internal execute mechanism: verifies that a proposal is successfull, lock the timelock to prevent
     * re-execution, and calls the {_calls} internal function.
     *
     * Note: does not emit any events. Events are part of the public function so they can be customized. In particular
     * some modules can use this mechanism to queue timelocked proposals.
     */
    function _execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        internal virtual returns (uint256 proposalId)
    {
        proposalId = hashProposal(targets, values, calldatas, salt);

        Proposal storage proposal = _proposals[proposalId];
        require(proposal.timer.isExpired(), "Governance: proposal not ready");
        require(proposalWeight(proposalId) >= quorum(proposal.snapshot), "Governance: quorum not reached");
        require(_voteSuccess(proposalId), "Governance: required score not reached");
        proposal.timer.lock();

        _calls(proposalId, targets, values, calldatas, salt);
    }

    /**
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been casted yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {IGovernor-_pushVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support
    )
        internal virtual returns (uint256 weight)
    {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.timer.isPending(), "Governance: vote not currently active");

        weight = getVotes(account, proposal.snapshot);
        _pushVote(proposalId, account, support, weight);

        emit VoteCast(account, proposalId, support, weight);
    }

    /**
     * @dev Internal mechnism to execute multiple calls. Relies on {_call} for individual calls. Can be overriden to
     * customized the operation to performed by {_execute} when an proposal is successfull.
     */
    function _calls(
        uint256 /*proposalId*/,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*salt*/
    )
        internal virtual
    {
        for (uint256 i = 0; i < targets.length; ++i) {
            _call(targets[i], values[i], calldatas[i]);
        }
    }

    /**
     * @dev Internal mechnism to execute a single call. Can be overriden to customized the operation to performed by
     * {_execute} when an proposal is successfull.
     */
    function _call(
        address target,
        uint256 value,
        bytes memory data
    )
        internal virtual
    {
        if (data.length == 0) {
            Address.sendValue(payable(target), value);
        } else {
            Address.functionCallWithValue(target, data, value);
        }
    }
}
