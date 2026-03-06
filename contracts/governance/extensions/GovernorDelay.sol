// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (governance/extensions/GovernorDelay.sol)

pragma solidity ^0.8.24;

import {IGovernor, Governor} from "../Governor.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Time} from "../../utils/types/Time.sol";

/**
 * @dev Extension of {Governor} that adds a configurable delay to all successful proposals before they can be executed.
 *
 * This extension provides a simple way to add a delay to all proposals without requiring an external timelock contract.
 * When a delay is set (greater than 0), all successful proposals must be queued and wait for the delay period to elapse
 * before they can be executed.
 *
 * The delay is enforced by the Governor itself, unlike {GovernorTimelockControl} and {GovernorTimelockCompound} where
 * the delay is enforced by an external timelock contract.
 *
 * NOTE: The delay is expressed in seconds and uses block.timestamp, regardless of the governor's clock mode. This is
 * consistent with {proposalEta} which is documented to not follow ERC-6372 CLOCK_MODE and almost always be a timestamp.
 *
 * @custom:security-note This extension enforces delays at the Governor level. If you need more sophisticated delay
 * mechanisms (e.g., cancellable operations, different delays per operation), consider using {GovernorTimelockAccess}
 * with an {AccessManager}.
 */
abstract contract GovernorDelay is Governor {
    using Time for *;

    uint32 private _delay;

    error GovernorUnmetDelay(uint256 proposalId, uint256 neededTimestamp);

    event DelaySet(uint32 oldDelay, uint32 newDelay);

    /**
     * @dev Initialize the governor with an initial delay.
     */
    constructor(uint32 initialDelay) {
        _setDelay(initialDelay);
    }

    /**
     * @dev Returns the delay in seconds that must elapse before a queued proposal can be executed.
     */
    function delay() public view virtual returns (uint32) {
        return _delay;
    }

    /**
     * @dev Change the delay. This operation can only be performed through a governance proposal.
     *
     * Emits a {DelaySet} event.
     */
    function setDelay(uint32 newDelay) public virtual onlyGovernance {
        _setDelay(newDelay);
    }

    /**
     * @dev Internal function to set the delay without access control.
     */
    function _setDelay(uint32 newDelay) internal virtual {
        emit DelaySet(_delay, newDelay);
        _delay = newDelay;
    }

    /// @inheritdoc IGovernor
    function proposalNeedsQueuing(uint256) public view virtual override returns (bool) {
        return _delay > 0;
    }

    /**
     * @dev Function to queue a proposal with the configured delay.
     */
    function _queueOperations(
        uint256 /* proposalId */,
        address[] memory /* targets */,
        uint256[] memory /* values */,
        bytes[] memory /* calldatas */,
        bytes32 /* descriptionHash */
    ) internal virtual override returns (uint48) {
        if (_delay == 0) {
            return 0;
        }
        return Time.timestamp() + _delay;
    }

    /**
     * @dev Overridden version of the {Governor-_executeOperations} function that checks if the delay has elapsed.
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override {
        uint48 etaSeconds = SafeCast.toUint48(proposalEta(proposalId));
        if (etaSeconds > 0 && block.timestamp < etaSeconds) {
            revert GovernorUnmetDelay(proposalId, etaSeconds);
        }

        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
}

