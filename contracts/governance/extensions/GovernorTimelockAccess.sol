// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IGovernor, Governor} from "../Governor.sol";
import {IAuthority} from "../../access/manager/IAuthority.sol";
import {AuthorityUtils} from "../../access/manager/AuthorityUtils.sol";
import {IAccessManager} from "../../access/manager/IAccessManager.sol";
import {IAccessManaged} from "../../access/manager/IAccessManaged.sol";
import {Address} from "../../utils/Address.sol";
import {Math} from "../../utils/math/Math.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Time} from "../../utils/types/Time.sol";

/**
 * @dev TODO
 *
 * _Available since v5.0._
 */
abstract contract GovernorTimelockAccess is Governor {
    struct ExecutionPlan {
        uint32 delay;
        IAccessManager[] managers;
    }

    mapping(uint256 => ExecutionPlan) private _executionPlan;
    mapping(address target => address) private _authorityOverride;

    uint32 _baseDelay;

    error GovernorUnmetDelay(uint256 proposalId, uint256 neededTimestamp);

    event BaseDelaySet(uint32 oldBaseDelaySeconds, uint32 newBaseDelaySeconds);

    constructor(uint32 initialBaseDelay) {
        _baseDelay = initialBaseDelay;
    }

    /**
     * @dev Base delay that will be applied to all function calls. Some may be further delayed by their associated
     * `AccessManager` authority; in this case the final delay will be the maximum of the base delay and the one
     * demanded by the authority.
     *
     * NOTE: Execution delays are processed by the `AccessManager` contracts, and according to that contract are
     * expressed in seconds. Therefore, the base delay is also in seconds, regardless of the governor's clock mode.
     */
    function baseDelaySeconds() public view virtual returns (uint32) {
        return _baseDelay;
    }

    /**
     * @dev Change the value of {baseDelaySeconds}. This operation can only be invoked through a governance proposal.
     */
    function setBaseDelaySeconds(uint32 newBaseDelay) public virtual onlyGovernance {
        _setBaseDelaySeconds(newBaseDelay);
    }

    /**
     * @dev Change the value of {baseDelaySeconds}. Internal function without access control.
     */
    function _setBaseDelaySeconds(uint32 newBaseDelay) internal virtual {
        emit BaseDelaySet(_baseDelay, newBaseDelay);
        _baseDelay = newBaseDelay;
    }

    /**
     * @dev Public accessor to check the execution details.
     */
    function proposalExecutionPlan(uint256 proposalId) public view returns (ExecutionPlan memory) {
        return _executionPlan[proposalId];
    }

    /**
     * @dev See {IGovernor-propose}
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);

        uint32 maxDelay = baseDelaySeconds();

        ExecutionPlan storage plan = _executionPlan[proposalId];

        for (uint256 i = 0; i < targets.length; ++i) {
            (address manager, uint32 delay) = _detectExecutionRequirements(targets[i], bytes4(calldatas[i]));
            plan.managers.push(IAccessManager(manager));
            // downcast is safe because both arguments are uint32
            maxDelay = uint32(Math.max(delay, maxDelay));
        }

        plan.delay = maxDelay;

        return proposalId;
    }

    /**
     * @dev Function to queue a proposal to the timelock.
     *
     * NOTE: execution delay is estimated based on the delay information retrieved in {proposal}. This value may be
     * off if the delay were updated during the vote.
     */
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory /* values */,
        bytes[] memory calldatas,
        bytes32 /* descriptionHash */
    ) internal virtual override returns (uint48) {
        ExecutionPlan storage plan = _executionPlan[proposalId];
        uint48 eta = Time.timestamp() + plan.delay;

        for (uint256 i = 0; i < targets.length; ++i) {
            IAccessManager manager = plan.managers[i];
            if (address(manager) != address(0)) {
                manager.schedule(targets[i], calldatas[i], eta);
            }
        }

        return eta;
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override {
        uint256 eta = proposalEta(proposalId);
        if (block.timestamp < eta) {
            revert GovernorUnmetDelay(proposalId, eta);
        }
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev See {IGovernor-_cancel}
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);

        ExecutionPlan storage plan = _executionPlan[proposalId];

        for (uint256 i = 0; i < targets.length; ++i) {
            IAccessManager manager = plan.managers[i];
            if (address(manager) != address(0)) {
                // Attempt to cancel, but allow to revert if a guardian cancelled part of the proposal
                try manager.cancel(address(this), targets[i], calldatas[i]) {} catch {}
            }
        }

        delete _executionPlan[proposalId];

        return proposalId;
    }

    /**
     * @dev Check if the execution of a call needs to be performed through an AccessManager and what delay should be
     * applied to this call.
     *
     * Returns { manager: address(0), delay: _baseDelaySeconds() } if:
     * - target does not have code
     * - target does not implement IAccessManaged
     * - calling canCall on the target's manager returns a 0 delay
     * - calling canCall on the target's manager reverts
     * Otherwise (calling canCall on the target's manager returns a non 0 delay), return the address of the
     * AccessManager to use, and the delay for this call.
     */
    function _detectExecutionRequirements(address target, bytes4 selector) private view returns (address, uint32) {
        address authority = _authorityOverride[target];

        // Get authority from target contract if there is no override
        if (authority == address(0)) {
            bool success;
            bytes memory returndata;

            (success, returndata) = target.staticcall(abi.encodeCall(IAccessManaged.authority, ()));
            if (success && returndata.length >= 0x20) {
                authority = abi.decode(returndata, (address));
            }
        }

        if (authority != address(0)) {
            // Check if governor can call according to authority, and try to detect a delay
            (bool authorized, uint32 delay) = AuthorityUtils.canCallWithDelay(authority, address(this), target, selector);

            // If direct call is not authorized, and delayed call is possible
            if (!authorized && delay > 0) {
                return (authority, delay);
            }
        }

        // Use internal delay mechanism
        return (address(0), 0);
    }
}
