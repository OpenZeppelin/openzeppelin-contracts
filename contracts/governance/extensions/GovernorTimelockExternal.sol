// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IGovernorTimelock.sol";
import "../Governor.sol";
import "../TimelockController.sol";

/**
 * @dev Extension of {Governor} that binds the execution process to an instance of {TimelockController}. This adds a
 * delay, enforced by the {TimelockController} to all successfull proposal (in addition to the voting duration). The
 * {Governor} needs the proposer (an ideally the executor) roles for the {Governor} to work properly.
 *
 * Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
 * the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
 * inaccessible.
 *
 * _Available since v4.2._
 */
abstract contract GovernorTimelockExternal is IGovernorTimelock, Governor {
    using Time for Time.Timer;

    TimelockController private _timelock;
    mapping (uint256 => Time.Timer) private _executionTimers;

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    /**
     * @dev Set the timelock.
     */
    constructor(address timelock_) {
        _updateTimelock(timelock_);
    }

    /**
     * @dev Overriden version of the {Governor-state} function with added support for the `Queued` status.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState proposalState = super.state(proposalId);

        return (proposalState == ProposalState.Executed && _executionTimers[proposalId].isStarted())
            ? ProposalState.Queued
            : proposalState;
    }

    /**
     * @dev Public accessor to check the address of the timelock
     */
    function timelock() public view virtual override returns (address) {
        return address(_timelock);
    }

    /**
     * @dev Public accessor to check the eta of a queued proposal
     */
    function proposalEta(uint256 proposalId) public view virtual returns (uint256) {
        return _executionTimers[proposalId].getDeadline();
    }

    /**
     * @dev Function to queue a proposal to the timelock. It internally uses the {Governor-_execute} function to
     * perform all the proposal success checks. The queueing to timelock is performed by the overriden
     * {Governor-_calls} overriden function.
     */
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        public virtual override returns (uint256)
    {
        uint256 proposalId = _execute(targets, values, calldatas, salt);
        uint256 eta = block.timestamp + _timelock.getMinDelay();
        _executionTimers[proposalId].setDeadline(eta);

        emit ProposalQueued(proposalId, eta);

        return proposalId;
    }

    /**
     * @dev Overloaded execute function that run the already queued proposal through the timelock.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        public payable virtual override returns (uint256)
    {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);
        _timelock.executeBatch{ value: msg.value }(targets, values, calldatas, 0, salt);
        _executionTimers[proposalId].reset();

        emit ProposalExecuted(proposalId);

        return proposalId;
    }

    /**
     * @dev Overriden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
     * been queued.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
        internal virtual override returns (uint256)
    {
        uint256 proposalId = super._cancel(targets, values, calldatas, salt);

        if (_executionTimers[proposalId].isStarted()) {
            _timelock.cancel(_timelock.hashOperationBatch(
                targets,
                values,
                calldatas,
                0,
                salt
            ));
            _executionTimers[proposalId].reset();
        }

        return proposalId;
    }

    /**
     * @dev Overriden internal {Governor-_calls} function to perform scheduling to the timelock instead of running
     * executing the proposal.
     */
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

    /**
     * @dev Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
     * must be proposed, scheduled and executed using the {Governor} workflow.
     */
    function updateTimelock(address newTimelock) public virtual {
        require(msg.sender == address(_timelock), "GovernorWithTimelockExternal: caller must be timelock");
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) private {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = TimelockController(payable(newTimelock));
    }
}
