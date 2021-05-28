// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IGovernorTimelock.sol";
import "../Governor.sol";
import "../TimelockController.sol";

abstract contract GovernorTimelockExternal is IGovernorTimelock, Governor {
    using Time for Time.Timer;

    TimelockController private _timelock;
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
            ? ProposalState.Queued
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
        // _call is overriden to customize _execute action (while keeping the checks)
        proposalId = _execute(targets, values, calldatas, salt);
        uint256 eta = block.timestamp + _timelock.getMinDelay();
        _executionTimers[proposalId].setDeadline(eta);

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
        _timelock.executeBatch{ value: msg.value }(targets, values, calldatas, 0, salt);
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

        bytes32 timelockProposalId = _timelock.hashOperationBatch(targets, values, calldatas, 0, salt);
        if (_timelock.isOperationPending(timelockProposalId)) {
            _timelock.cancel(timelockProposalId);
            _executionTimers[proposalId].reset();
        }
    }

    function _calls(
        uint256 /*proposalId*/,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        internal virtual override
    {
        _timelock.scheduleBatch(
            targets,
            values,
            calldatas,
            0,
            salt,
            _timelock.getMinDelay()
        );
    }

    function updateTimelock(address newTimelock) external virtual {
        require(msg.sender == address(_timelock), "GovernorWithTimelockExternal: caller must be timelock");
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) internal virtual {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = TimelockController(payable(newTimelock));
    }
}
