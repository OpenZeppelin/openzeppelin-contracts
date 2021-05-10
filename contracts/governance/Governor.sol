// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";
import "../utils/draft-Timers.sol";
import "./IGovernor.sol";

abstract contract Governor is IGovernor, Context, Timers {

    struct Proposal {
        uint256 block;
        uint256 supply;
        uint256 score;
        mapping (address => bool) voters;
    }

    mapping (bytes32 => Proposal) private _proposals;

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
    function viewProposalStatus(bytes32 id) public view returns (uint8 status) {
        if (_isTimerBefore(id)) return uint8(0x0);
        if (_isTimerDuring(id)) return uint8(0x1);
        if (_isTimerAfter(id))  return uint8(0x2);
        if (_isTimerLocked(id)) return uint8(0x3);
        revert();
    }

    function viewProposal(bytes32 id)
    public view returns (uint256 startBlock, uint256 deadline, uint256 supply, uint256 score)
    {
        return ( _proposals[id].block, _getDeadline(id), _proposals[id].supply, _proposals[id].score);
    }

    function hashProposal(address[] calldata, uint256[] calldata, bytes[] calldata, bytes32)
    public view virtual returns (bytes32)
    {
        // This is cheaper and works just as well
        return keccak256(_msgData()[4:]);
        // return keccak256(abi.encode(target, value, data, salt));
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
    internal virtual returns (bytes32)
    {
        bytes32 id = hashProposal(target, value, data, salt);
        _propose(id, target, value, data, salt);
        return id;
    }

    function _propose(
        bytes32 id,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual
    {
        require(target.length == value.length, "Governance: invalid proposal length");
        require(target.length == data.length,  "Governance: invalid proposal length");
        require(target.length > 0,             "Governance: empty proposal");

        uint256 duration = votingDuration();
        uint256 offset   = votingOffset();

        _startTimer(id, block.number + offset + duration); // internal checks prevent double proposal
        _proposals[id].block = block.number + offset;

        emit Proposed(id, target, value, data, salt);
    }

    function _execute(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual returns (bytes32)
    {
        bytes32 id = hashProposal(target, value, data, salt);
        _execute(id, target, value, data, salt);
        return id;
    }

    function _execute(
        bytes32 id,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual onlyAfterTimer(id)
    {
        require(target.length == value.length, "Governance: invalid proposal length");
        require(target.length == data.length,  "Governance: invalid proposal length");
        require(target.length > 0,             "Governance: empty proposal");

        _resetTimer(id); // check timer expired + reset
        _lockTimer(id); // avoid double execution

        Proposal storage proposal = _proposals[id];
        require(proposal.supply >= quorum(), "Governance: quorum not reached");
        require(proposal.score >= proposal.supply * requiredScore(), "Governance: required score not reached");

        _calls(id, target, value, data, salt);

        emit Executed(id);
    }

    function _castVote(
        bytes32 id,
        address account,
        uint8 support
    )
    internal virtual onlyDuringTimer(id)
    {
        require(support <= maxScore(), "Governance: invalid score");

        Proposal storage proposal = _proposals[id];
        require(!proposal.voters[account], "Governance: vote already casted");
        proposal.voters[account] = true;

        require(proposal.block < block.number, "Governance: too early to vote");
        uint256 balance = getVotes(account, proposal.block);
        proposal.supply += balance;
        proposal.score += balance * support;

        emit Vote(id, account, balance, support);
    }

    function _calls(
        bytes32 /*id*/,
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
