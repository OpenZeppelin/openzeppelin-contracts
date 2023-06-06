// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../access/manager/conditions/TimelockConditionBase.sol";
import "../Governor.sol";
import "./IGovernorTimelock.sol";

abstract contract GovernorTimelockManaged is IGovernorTimelock, Governor {
    TimelockConditionBase private _timelock;

    /**
     * @dev Emitted when the timelock controller used for proposal execution is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    /**
     * @dev Set the timelock.
     */
    constructor(TimelockConditionBase timelockAddress) {
        _updateTimelock(timelockAddress);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, Governor) returns (bool) {
        return interfaceId == type(IGovernorTimelock).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Overridden version of the {Governor-state} function with added support for the `Queued` state.
     */
    function state(uint256 proposalId) public view virtual override(IGovernor, Governor) returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);

        if (currentState != ProposalState.Succeeded) {
            return currentState;
        }

        // proposalId is computed the same way by the timelock
        TimelockConditionBase.Operation memory op = _timelock.details(bytes32(proposalId));
        if (op.state == TimelockConditionBase.OperationState.UNSET) {
            return ProposalState.Succeeded;
        } else if (op.state == TimelockConditionBase.OperationState.SCHEDULED) {
            return ProposalState.Queued;
        } else if (op.state == TimelockConditionBase.OperationState.EXECUTED) {
            return ProposalState.Executed;
        } else /*if (op.state == TimelockConditionBase.OperationState.CANCELED)*/ {
            return ProposalState.Canceled;
        }
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
    function proposalEta(uint256 proposalId) public view virtual override returns (uint256) {
        TimelockConditionBase.Operation memory op = _timelock.details(bytes32(proposalId));
        return op.state == TimelockConditionBase.OperationState.SCHEDULED ? op.timepoint : 0;
    }

    /**
     * @dev Function to queue a proposal to the timelock.
     */
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(state(proposalId) == ProposalState.Succeeded, "Governor: proposal not successful");
        _timelock.schedule(targets, values, calldatas, descriptionHash);
        uint48 timepoint = _timelock.details(bytes32(proposalId)).timepoint;

        emit ProposalQueued(proposalId, timepoint);

        return proposalId;
    }

    /**
     * @dev Overridden execute function that run the already queued proposal through the timelock.
     */
    function _execute(
        uint256 /* proposalId */,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override {
        _timelock.execute{value: msg.value}(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Overridden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
     * been queued.
     */
    // This function can reenter through the external call to the timelock, but we assume the timelock is trusted and
    // well behaved (according to TimelockController) and this will not happen.
    // slither-disable-next-line reentrancy-no-eth
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);

        if (_timelock.details(bytes32(proposalId)).state == TimelockConditionBase.OperationState.SCHEDULED) {
            _timelock.cancel(bytes32(proposalId));
        }

        return proposalId;
    }

    /**
     * @dev Address through which the governor executes action. In this case, the timelock.
     */
    function _executor() internal view virtual override returns (address) {
        return address(_timelock);
    }

    /**
     * @dev Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
     * must be proposed, scheduled, and executed through governance proposals.
     *
     * CAUTION: It is not recommended to change the timelock while there are other queued governance proposals.
     */
    function updateTimelock(TimelockConditionBase newTimelock) external virtual onlyGovernance {
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(TimelockConditionBase newTimelock) private {
        emit TimelockChange(address(_timelock), address(newTimelock));
        _timelock = newTimelock;
    }
}
