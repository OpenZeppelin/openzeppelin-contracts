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
 * _Available since v4.3._
 */
abstract contract GovernorTimelockController is IGovernorTimelock, Governor {
    TimelockController private _timelock;
    mapping(uint256 => bytes32) private _ids;

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
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, Governor) returns (bool) {
        return interfaceId == type(IGovernorTimelock).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Overriden version of the {Governor-state} function with added support for the `Queued` status.
     */
    function state(uint256 proposalId) public view virtual override(IGovernor, Governor) returns (ProposalState) {
        ProposalState proposalState = super.state(proposalId);

        return
            proposalState == ProposalState.Succeeded
                ? _timelock.isOperationPending(_ids[proposalId])
                    ? ProposalState.Queued
                    : _timelock.isOperationDone(_ids[proposalId])
                    ? ProposalState.Executed
                    : proposalState
                : proposalState;
    }

    /**
     * @dev Public accessor to check the address of the timelock
     */
    function timelock() external view virtual override returns (address) {
        return address(_timelock);
    }

    /**
     * @dev Public accessor to check the eta of a queued proposal
     */
    function proposalEta(uint256 proposalId) public view virtual override returns (uint256) {
        return _timelock.getTimestamp(_ids[proposalId]);
    }

    /**
     * @dev Function to queue a proposal to the timelock.
     */
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);

        require(state(proposalId) == ProposalState.Succeeded, "Governor: proposal not successfull");

        uint256 delay = _timelock.getMinDelay();
        _ids[proposalId] = _timelock.hashOperationBatch(targets, values, calldatas, 0, salt);
        _timelock.scheduleBatch(targets, values, calldatas, 0, salt, delay);

        emit ProposalQueued(proposalId, block.timestamp + delay);

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
    ) public payable virtual override(IGovernor, Governor) returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);
        _timelock.executeBatch{value: msg.value}(targets, values, calldatas, 0, salt);

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
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, salt);

        if (_ids[proposalId] != 0) {
            _timelock.cancel(_ids[proposalId]);
            delete _ids[proposalId];
        }

        return proposalId;
    }

    /**
     * @dev Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
     * must be proposed, scheduled and executed using the {Governor} workflow.
     */
    function updateTimelock(address newTimelock) external virtual {
        require(msg.sender == address(_timelock), "GovernorTimelockController: caller must be timelock");
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) private {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = TimelockController(payable(newTimelock));
    }
}
