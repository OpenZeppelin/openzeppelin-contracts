// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/draft-EIP712.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";
import "../utils/Timers.sol";
import "./IGovernor.sol";

/**
 * @dev Core of the governance system, designed to be extended though various modules.
 *
 * _Available since v4.2._
 */
abstract contract Governor is IGovernor, EIP712, Context {
    using Timers for Timers.BlockNumber;

    bytes32 private constant _BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    struct Proposal {
        Timers.BlockNumber timer;
        uint64 snapshot;
        bool executed;
        bool canceled;
    }

    string private _name;

    mapping(uint256 => Proposal) private _proposals;

    /**
     * @dev Sets the value for {name} and {version}
     */
    constructor(string memory name_) EIP712(name_, version()) {
        _name = name_;
    }

    /**
     * @dev See {IGovernor-name}.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IGovernor-version}.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        Proposal memory proposal = _proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        } else if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number <= proposal.snapshot) {
            return ProposalState.Pending;
        } else if (proposal.timer.isPending()) {
            return ProposalState.Active;
        } else if (proposal.timer.isExpired()) {
            return
                _quorumReached(proposalId) && _voteSuccess(proposalId)
                    ? ProposalState.Succeeded
                    : ProposalState.Defeated;
        } else {
            revert("Governor::state: invalid proposal id");
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
    ) public view virtual override returns (uint256) {
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
    ) public virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);

        require(targets.length == values.length, "Governance: invalid proposal length");
        require(targets.length == calldatas.length, "Governance: invalid proposal length");
        require(targets.length > 0, "Governance: empty proposal");

        Proposal storage proposal = _proposals[proposalId];
        require(proposal.timer.isUnset(), "Governance: proposal already exists");

        uint64 snapshot = uint64(block.number) + votingDelay();
        uint64 deadline = snapshot + votingPeriod();

        proposal.snapshot = snapshot;
        proposal.timer.setDeadline(deadline);

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

        emit ProposalSalt(
            proposalId,
            salt
        );

        return proposalId;
    }

    /**
     * @dev See {IGovernor-execute}.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);

        require(state(proposalId) == ProposalState.Succeeded, "Governance: proposal not successfull");
        _proposals[proposalId].executed = true;

        _calls(proposalId, targets, values, calldatas, salt);

        emit ProposalExecuted(proposalId);

        return proposalId;
    }

    /**
     * @dev See {IGovernor-castVote}.
     */
    function castVote(uint256 proposalId, uint8 support) public virtual override returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, "");
    }

    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) public virtual override returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, reason);
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
    ) public virtual override returns (uint256) {
        address voter = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(_BALLOT_TYPEHASH, proposalId, support))),
            v,
            r,
            s
        );
        return _castVote(proposalId, voter, support, "");
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
    ) internal virtual returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);
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
        Proposal memory proposal = _proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Governance: vote not currently active");

        uint256 weight = getVotes(account, proposal.snapshot);
        _pushVote(proposalId, account, support, weight);

        emit VoteCast(account, proposalId, support, weight, reason);

        return weight;
    }

    /**
     * @dev Internal mechnism to execute multiple calls.
     */
    function _calls(
        uint256, /*proposalId*/
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*salt*/
    ) internal virtual {
        for (uint256 i = 0; i < targets.length; ++i) {
            if (calldatas[i].length == 0) {
                Address.sendValue(payable(targets[i]), values[i]);
            } else {
                Address.functionCallWithValue(targets[i], calldatas[i], values[i]);
            }
        }
    }
}
