// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IGovernorTimelock.sol";
import "../Governor.sol";

/**
 * Compound's timelock interface
 */
interface ICompTimelock {
    receive() external payable;

    function GRACE_PERIOD() external view returns (uint256);
    function MINIMUM_DELAY() external view returns (uint256);
    function MAXIMUM_DELAY() external view returns (uint256);

    function admin() external view returns (address);
    function pendingAdmin() external view returns (address);
    function delay() external view returns (uint256);

    function setDelay(uint256) external;
    function acceptAdmin() external;
    function setPendingAdmin(address) external;

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external returns (bytes32);
    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external;
    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external payable returns (bytes memory);
}

abstract contract GovernorTimelockCompound is IGovernorTimelock, Governor {
    using Time for Time.Timer;

    ICompTimelock private _timelock;
    mapping (uint256 => Time.Timer) private _executionTimers;

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    constructor(address timelock_)
    {
        _updateTimelock(timelock_);
    }

    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState proposalState = super.state(proposalId);

        return (proposalState == ProposalState.Executed && _executionTimers[proposalId].isStarted())
            ? block.timestamp >= proposalEta(proposalId) + _timelock.GRACE_PERIOD()
            ? ProposalState.Expired
            : ProposalState.Queued
            : proposalState;
    }

    function timelock() public view virtual override returns (address) {
        return address(_timelock);
    }

    function proposalEta(uint256 proposalId) public view virtual returns (uint256) {
        return _executionTimers[proposalId].getDeadline();
    }

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        public virtual override returns (uint256 proposalId)
    {
        // _call is overriden have no action (while keeping the checks)
        proposalId = _execute(targets, values, calldatas, salt);

        uint256 eta = block.timestamp + _timelock.delay();
        _executionTimers[proposalId].setDeadline(eta);

        for (uint256 i = 0; i < targets.length; ++i) {
            _timelock.queueTransaction(
                targets[i],
                values[i],
                "",
                calldatas[i],
                eta
            );
        }

        emit ProposalQueued(proposalId, eta);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        public payable virtual override returns (uint256 proposalId)
    {
        proposalId = hashProposal(targets, values, calldatas, salt);
        Address.sendValue(payable(_timelock), msg.value);

        uint256 eta = proposalEta(proposalId);
        require(eta > 0, "GovernorWithTimelockCompound:execute: proposal not yet queued");
        for (uint256 i = 0; i < targets.length; ++i) {
            _timelock.executeTransaction(
                targets[i],
                values[i],
                "",
                calldatas[i],
                eta
            );
        }
        _executionTimers[proposalId].reset();

        emit ProposalExecuted(proposalId);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        internal virtual override returns (uint256 proposalId)
    {
        proposalId = super._cancel(targets, values, calldatas, salt);

        uint256 eta = proposalEta(proposalId);
        if (eta > 0) {
            for (uint256 i = 0; i < targets.length; ++i) {
                _timelock.cancelTransaction(
                    targets[i],
                    values[i],
                    "",
                    calldatas[i],
                    eta
                );
            }
            _executionTimers[proposalId].reset();
        }
    }

    function _calls(
        uint256 /*proposalId*/,
        address[] memory /*targets*/,
        uint256[] memory /*values*/,
        bytes[] memory /*calldatas*/,
        bytes32 /*salt*/
    )
        internal virtual override
    {
        // don't do anything here to avoid sload of `eta`
    }

    // TODO: Does this need access control? Make it part of updateTimelock ?
    function __acceptAdmin() public {
        _timelock.acceptAdmin();
    }

    function updateTimelock(address newTimelock) external virtual {
        require(msg.sender == address(_timelock), "GovernorWithTimelockCompound: caller must be timelock");
        require(_timelock.pendingAdmin() != address(0), "GovernorWithTimelockCompound: old timelock must be transfered before update");
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) internal virtual {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = ICompTimelock(payable(newTimelock));
    }
}
