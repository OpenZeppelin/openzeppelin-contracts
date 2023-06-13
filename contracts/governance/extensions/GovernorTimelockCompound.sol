// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (governance/extensions/GovernorTimelockCompound.sol)

pragma solidity ^0.8.19;

import "./IGovernorTimelock.sol";
import "../Governor.sol";
import "../../utils/math/SafeCast.sol";
import "../../vendor/compound/ICompoundTimelock.sol";

/**
 * @dev Extension of {Governor} that binds the execution process to a Compound Timelock. This adds a delay, enforced by
 * the external timelock to all successful proposal (in addition to the voting duration). The {Governor} needs to be
 * the admin of the timelock for any operation to be performed. A public, unrestricted,
 * {GovernorTimelockCompound-__acceptAdmin} is available to accept ownership of the timelock.
 *
 * Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
 * the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
 * inaccessible.
 *
 * _Available since v4.3._
 */
abstract contract GovernorTimelockCompound is IGovernorTimelock, Governor {
    ICompoundTimelock private _timelock;

    /// @custom:oz-retyped-from mapping(uint256 => GovernorTimelockCompound.ProposalTimelock)
    mapping(uint256 => uint256) private _proposalTimelocks;

    /**
     * @dev Emitted when the timelock controller used for proposal execution is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    /**
     * @dev Set the timelock.
     */
    constructor(ICompoundTimelock timelockAddress) {
        _updateTimelock(timelockAddress);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, Governor) returns (bool) {
        return interfaceId == type(IGovernorTimelock).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Overridden version of the {Governor-state} function with added support for the `Queued` and `Expired` state.
     */
    function state(uint256 proposalId) public view virtual override(IGovernor, Governor) returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);

        if (currentState != ProposalState.Succeeded) {
            return currentState;
        }

        uint256 eta = proposalEta(proposalId);
        if (eta == 0) {
            return currentState;
        } else if (block.timestamp >= eta + _timelock.GRACE_PERIOD()) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
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
        return _proposalTimelocks[proposalId];
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

        ProposalState currentState = state(proposalId);
        if (currentState != ProposalState.Succeeded) {
            revert GovernorUnexpectedProposalState(
                proposalId,
                currentState,
                _encodeStateBitmap(ProposalState.Succeeded)
            );
        }

        uint256 eta = block.timestamp + _timelock.delay();
        _proposalTimelocks[proposalId] = eta;

        for (uint256 i = 0; i < targets.length; ++i) {
            if (_timelock.queuedTransactions(keccak256(abi.encode(targets[i], values[i], "", calldatas[i], eta)))) {
                revert GovernorAlreadyQueuedProposal(proposalId);
            }
            _timelock.queueTransaction(targets[i], values[i], "", calldatas[i], eta);
        }

        emit ProposalQueued(proposalId, eta);

        return proposalId;
    }

    /**
     * @dev Overridden execute function that run the already queued proposal through the timelock.
     */
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal virtual override {
        uint256 eta = proposalEta(proposalId);
        if (eta == 0) {
            revert GovernorNotQueuedProposal(proposalId);
        }
        Address.sendValue(payable(_timelock), msg.value);
        for (uint256 i = 0; i < targets.length; ++i) {
            _timelock.executeTransaction(targets[i], values[i], "", calldatas[i], eta);
        }
    }

    /**
     * @dev Overridden version of the {Governor-_cancel} function to cancel the timelocked proposal if it as already
     * been queued.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);

        uint256 eta = proposalEta(proposalId);
        if (eta > 0) {
            // update state first
            delete _proposalTimelocks[proposalId];
            // do external call later
            for (uint256 i = 0; i < targets.length; ++i) {
                _timelock.cancelTransaction(targets[i], values[i], "", calldatas[i], eta);
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
    // solhint-disable-next-line private-vars-leading-underscore
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
    function updateTimelock(ICompoundTimelock newTimelock) external virtual onlyGovernance {
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(ICompoundTimelock newTimelock) private {
        emit TimelockChange(address(_timelock), address(newTimelock));
        _timelock = newTimelock;
    }
}
