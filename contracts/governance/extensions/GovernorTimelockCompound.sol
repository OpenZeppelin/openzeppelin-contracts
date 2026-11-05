// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (governance/extensions/GovernorTimelockCompound.sol)

pragma solidity ^0.8.24;

import {Address} from "../../utils/Address.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {ICompoundTimelock} from "../../vendor/compound/ICompoundTimelock.sol";
import {IGovernor, Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} that binds the execution process to a Compound Timelock. This adds a delay, enforced by
 * the external timelock to all successful proposals (in addition to the voting duration). The {Governor} needs to be
 * the admin of the timelock for any operation to be performed. A public, unrestricted,
 * {GovernorTimelockCompound-__acceptAdmin} is available to accept ownership of the timelock.
 *
 * Using this model means the proposal will be operated by the {ICompoundTimelock} and not by the {Governor}. Thus,
 * the assets and permissions must be attached to the {ICompoundTimelock}. Any asset sent to the {Governor} will be
 * inaccessible from a proposal, unless executed via {Governor-relay}.
 *
 * NOTE: The Compound timelock identifies each queued transaction by the hash of its target, value, signature, calldata
 * and eta. To let a proposal repeat an identical action without the hashes colliding, {_queueOperations} gives each
 * action its own eta, offset by one second per index (the first at `block.timestamp + timelock.delay()`). A proposal
 * is therefore executable only once `block.timestamp` reaches {Governor-proposalEta}, which is the eta of its last
 * action. Two *different* proposals that share an identical action and are queued in the same block still produce the
 * same hash for that action and revert with {IGovernor-GovernorAlreadyQueuedProposal}. A retry succeeds if its
 * etas do not collide with an existing queued action.
 */
abstract contract GovernorTimelockCompound is Governor {
    ICompoundTimelock private _timelock;

    /**
     * @dev Emitted when the timelock used for proposal execution is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    /**
     * @dev Set the timelock.
     */
    constructor(ICompoundTimelock timelockAddress) {
        _updateTimelock(timelockAddress);
    }

    /**
     * @dev Overridden version of the {Governor-state} function with added support for the `Expired` state.
     *
     * NOTE: The `Expired` transition uses {Governor-proposalEta} (the last action's eta). Because a proposal's actions
     * carry etas offset by one second per index (see {_queueOperations}), its oldest action goes stale in the timelock
     * `n - 1` seconds before this returns `Expired`, where `n` is the number of actions. In that final window {execute}
     * reverts (`"Transaction is stale."`) while `state` still reports `Queued`.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);

        return
            (currentState == ProposalState.Queued &&
                block.timestamp >= proposalEta(proposalId) + _timelock.GRACE_PERIOD())
                ? ProposalState.Expired
                : currentState;
    }

    /**
     * @dev Public accessor to check the address of the timelock
     */
    function timelock() public view virtual returns (address) {
        return address(_timelock);
    }

    /// @inheritdoc IGovernor
    function proposalNeedsQueuing(uint256) public view virtual override returns (bool) {
        return true;
    }

    /**
     * @dev Queues a proposal to the timelock. Each action is queued with its own eta: the first at
     * `block.timestamp + timelock.delay()`, each subsequent one incremented by a second, so a proposal can repeat an
     * identical action without the timelock's content-addressed hash colliding. Returns the eta of the last action,
     * which becomes the proposal's {Governor-proposalEta} and the point from which the whole batch is executable.
     */
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal virtual override returns (uint48) {
        uint256 firstEta = block.timestamp + _timelock.delay();
        uint48 lastEta = SafeCast.toUint48(firstEta + targets.length - 1);

        for (uint256 i = 0; i < targets.length; ++i) {
            // The timelock keys transactions by hash(target, value, signature, data, eta). Each action gets its own
            // `etaSeconds` (offset by `i`), so repeated actions within a proposal no longer collide. This still
            // reverts if an identical action from another proposal already occupies the same eta. A retry requires
            // an eta that does not collide with an existing queued action.
            uint256 etaSeconds = firstEta + i;
            if (
                _timelock.queuedTransactions(keccak256(abi.encode(targets[i], values[i], "", calldatas[i], etaSeconds)))
            ) {
                revert GovernorAlreadyQueuedProposal(proposalId);
            }
            _timelock.queueTransaction(targets[i], values[i], "", calldatas[i], etaSeconds);
        }

        return lastEta;
    }

    /**
     * @dev Overridden version of the {Governor-_executeOperations} function that run the already queued proposal
     * through the timelock. Each action's offset eta is reconstructed from {Governor-proposalEta} (the last action's
     * eta) by subtracting its distance from the end of the batch.
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal virtual override {
        uint256 firstEta = proposalEta(proposalId) - (targets.length - 1);
        Address.sendValue(payable(_timelock), msg.value);
        for (uint256 i = 0; i < targets.length; ++i) {
            _timelock.executeTransaction(targets[i], values[i], "", calldatas[i], firstEta + i);
        }
    }

    /**
     * @dev Overridden version of the {Governor-_cancel} function to cancel the timelocked proposal if it has already
     * been queued.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);

        uint256 etaSeconds = proposalEta(proposalId);
        if (etaSeconds > 0) {
            uint256 firstEta = etaSeconds - (targets.length - 1);
            // do external call later
            for (uint256 i = 0; i < targets.length; ++i) {
                _timelock.cancelTransaction(targets[i], values[i], "", calldatas[i], firstEta + i);
            }
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
     * @dev Accept admin right over the timelock.
     */
    // solhint-disable-next-line openzeppelin/leading-underscore
    function __acceptAdmin() public {
        _timelock.acceptAdmin();
    }

    /**
     * @dev Public endpoint to update the underlying timelock instance. Restricted to the timelock itself, so updates
     * must be proposed, scheduled, and executed through governance proposals.
     *
     * For security reasons, the timelock must be handed over to another admin before setting up a new one. The two
     * operations (hand over the timelock) and do the update can be batched in a single proposal.
     *
     * Note that if the timelock admin has been handed over in a previous operation, we refuse updates made through the
     * timelock if admin of the timelock has already been accepted and the operation is executed outside the scope of
     * governance.

     * CAUTION: It is not recommended to change the timelock while there are other queued governance proposals.
     */
    function updateTimelock(ICompoundTimelock newTimelock) public virtual onlyGovernance {
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(ICompoundTimelock newTimelock) private {
        emit TimelockChange(address(_timelock), address(newTimelock));
        _timelock = newTimelock;
    }
}
