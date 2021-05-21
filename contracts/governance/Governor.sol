// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/draft-EIP712.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";
import "../utils/Time.sol";
import "./IGovernor.sol";

abstract contract Governor is IGovernor, EIP712, Context {
    using Time for Time.Timer;

    bytes32 private constant _BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    struct Proposal {
        Time.Timer timer;
        uint256 snapshot;
        uint256 supply;
        uint256 score;
        mapping (address => bool) voters;
    }

    mapping (uint256 => Proposal) private _proposals;

    /*************************************************************************
     *                           Public interface                            *
     *************************************************************************/
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

    function castVote(uint256 proposalId, uint8 support)
    public virtual override
    {
        address voter = _msgSender();
        uint256 balance = _castVote(proposalId, voter, support);
        emit VoteCast(voter, proposalId, support, balance);
    }

    function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)
    public virtual override
    {
        address voter = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(_BALLOT_TYPEHASH, proposalId, support))),
            v, r, s
        );
        uint256 balance = _castVote(proposalId, voter, support);
        emit VoteCast(voter, proposalId, support, balance);
    }

    /*************************************************************************
     *                            View functions                             *
     *************************************************************************/
    function viewProposalStatus(uint256 proposalId) public view virtual override returns (uint8 status) {
        Time.Timer memory timer = _proposals[proposalId].timer;
        if (timer.isUnset()) return uint8(0x0);
        if (timer.isPending()) return uint8(0x1);
        if (timer.isExpired()) return uint8(0x2);
        // default: timer.isLocked()
        return uint8(0x3);
    }

    function viewProposal(uint256 proposalId)
    public view virtual override returns (uint256 snapshot, uint256 deadline, uint256 supply, uint256 score)
    {
        Proposal storage proposal = _proposals[proposalId];
        return (
            proposal.snapshot,
            proposal.timer.getDeadline(),
            proposal.supply,
            proposal.score
        );
    }

    function hashProposal(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 salt)
    public view virtual override returns (uint256 proposalId)
    {
        return uint256(keccak256(abi.encode(targets, values, calldatas, salt)));
    }

    /*************************************************************************
     *                               Internal                                *
     *************************************************************************/
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

        snapshot = block.number + votingOffset();
        deadline = block.timestamp + votingDuration();

        proposal.snapshot = snapshot;
        proposal.timer.setDeadline(deadline);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
    internal virtual returns (uint256 proposalId)
    {
        proposalId = hashProposal(targets, values, calldatas, salt);
        _proposals[proposalId].timer.lock();
    }

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
        require(proposal.supply >= quorum(), "Governance: quorum not reached");
        require(proposal.score >= proposal.supply * requiredScore(), "Governance: required score not reached");
        proposal.timer.lock();

        _calls(proposalId, targets, values, calldatas, salt);

        return proposalId;
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support
    )
    internal virtual returns (uint256 balance)
    {
        require(support <= maxScore(), "Governance: invalid score");

        Proposal storage proposal = _proposals[proposalId];
        require(proposal.timer.isPending(), "Governance: vote not currently active");
        require(!proposal.voters[account], "Governance: vote already casted");

        proposal.voters[account] = true;
        balance = getVotes(account, proposal.snapshot);
        proposal.supply += balance;
        proposal.score += balance * support;
    }

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
