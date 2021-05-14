// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/cryptography/ECDSA.sol";
import "../../utils/Address.sol";
import "../../utils/Context.sol";
import "../../utils/draft-Timers.sol";
import "./IGovernor.sol";

abstract contract GovernorCore is IGovernor, Context, Timers {
    struct Proposal {
        uint256 block;
        uint256 supply;
        uint256 score;
        mapping (address => bool) voters;
    }

    mapping (uint256 => Proposal) private _proposals;

    modifier onlyActiveTimer(bytes32 id) virtual override {
        require(_isTimerActive(id), "Governance: invalid proposal");
        _;
    }

    modifier onlyDuringTimer(bytes32 id) virtual override {
        require(_isTimerDuring(id), "Governance: vote not currently active");
        _;
    }

    modifier onlyAfterTimer(bytes32 id) virtual override {
        require(_isTimerAfter(id), "Governance: proposal not ready to execute");
        _;
    }

    /*************************************************************************
     *                            View functions                             *
     *************************************************************************/
    function viewProposalStatus(uint256 proposalId) public view virtual override returns (uint8 status) {
        if (_isTimerBefore(bytes32(proposalId))) return uint8(0x0);
        if (_isTimerDuring(bytes32(proposalId))) return uint8(0x1);
        if (_isTimerAfter(bytes32(proposalId)))  return uint8(0x2);
        if (_isTimerLocked(bytes32(proposalId))) return uint8(0x3);
        revert();
    }

    function viewProposal(uint256 proposalId)
    public view virtual override returns (uint256 startBlock, uint256 deadline, uint256 supply, uint256 score)
    {
        return ( _proposals[proposalId].block, _getDeadline(bytes32(proposalId)), _proposals[proposalId].supply, _proposals[proposalId].score);
    }

    function hashProposal(address[] calldata, uint256[] calldata, bytes[] calldata, bytes32)
    public view  virtual override returns (uint256 proposalId)
    {
        // This is cheaper and works just as well
        return uint256(keccak256(_msgData()[4:]));
        // return uint256(keccak256(abi.encode(target, value, data, salt)));
    }

    /*************************************************************************
     *                               Private                                 *
     *************************************************************************/
    function _propose(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual returns (uint256 proposalId)
    {
        proposalId = hashProposal(target, value, data, salt);
        _propose(proposalId, target, value, data, salt);
    }

    function _propose(
        uint256 proposalId,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 /*salt*/
    )
    internal virtual
    {
        require(target.length == value.length, "Governance: invalid proposal length");
        require(target.length == data.length,  "Governance: invalid proposal length");
        require(target.length > 0,             "Governance: empty proposal");

        uint256 duration = votingDuration();
        uint256 offset   = votingOffset();

        _startTimer(bytes32(proposalId), block.number + offset + duration); // internal checks prevent double proposal
        _proposals[proposalId].block = block.number + offset;
    }

    function _execute(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual returns (uint256 proposalId)
    {
        proposalId = hashProposal(target, value, data, salt);
        _execute(proposalId, target, value, data, salt);
    }

    function _execute(
        uint256 proposalId,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual onlyAfterTimer(bytes32(proposalId))
    {
        require(target.length == value.length, "Governance: invalid proposal length");
        require(target.length == data.length,  "Governance: invalid proposal length");
        require(target.length > 0,             "Governance: empty proposal");

        _resetTimer(bytes32(proposalId)); // check timer expired + reset
        _lockTimer(bytes32(proposalId)); // avoid double execution

        Proposal storage proposal = _proposals[proposalId];
        require(proposal.supply >= quorum(), "Governance: quorum not reached");
        require(proposal.score >= proposal.supply * requiredScore(), "Governance: required score not reached");

        _calls(proposalId, target, value, data, salt);
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support
    )
    internal virtual onlyDuringTimer(bytes32(proposalId)) returns (uint256 balance)
    {
        require(support <= maxScore(), "Governance: invalid score");

        Proposal storage proposal = _proposals[proposalId];
        require(!proposal.voters[account], "Governance: vote already casted");
        proposal.voters[account] = true;

        require(proposal.block < block.number, "Governance: too early to vote");
        balance = getVotes(account, proposal.block);
        proposal.supply += balance;
        proposal.score += balance * support;
    }

    function _calls(
        uint256 /*proposalId*/,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 /*salt*/
    )
    internal virtual
    {
        for (uint256 i = 0; i < target.length; ++i) {
            _call(target[i], value[i], data[i]);
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
