// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IGovernorTimelock} from "./IGovernorTimelock.sol";
import {IGovernor, Governor} from "../Governor.sol";
import {IManaged} from "../../access/manager/IManaged.sol";
import {IAuthority} from "../../access/manager/IAuthority.sol";
import {IAccessManager} from "../../access/manager/IAccessManager.sol";
import {Address} from "../../utils/Address.sol";
import {Math} from "../../utils/math/Math.sol";

/**
 * @dev TODO
 *
 * _Available since v5.0._
 */
abstract contract GovernorTimelock is IGovernorTimelock, Governor {
    struct ExecutionDetail {
        address authority;
        uint32 delay;
    }

    mapping(uint256 => ExecutionDetail[]) private _executionDetails;
    mapping(uint256 => uint256) private _proposalEta;

    /**
     * @dev Overridden version of the {Governor-state} function with added support for the `Queued` and `Expired` state.
     */
    function state(uint256 proposalId) public view virtual override(IGovernor, Governor) returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);

        if (currentState == ProposalState.Succeeded && proposalEta(proposalId) != 0) {
            return ProposalState.Queued;
        } else {
            return currentState;
        }
    }

    /**
     * @dev Public accessor to check the eta of a queued proposal.
     */
    function proposalEta(uint256 proposalId) public view virtual override returns (uint256) {
        return _proposalEta[proposalId];
    }

    /**
     * @dev Public accessor to check the execution details.
     */
    function proposalExecutionDetails(uint256 proposalId) public view returns (ExecutionDetail[] memory) {
        return _executionDetails[proposalId];
    }

    /**
     * @dev See {IGovernor-propose}
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override(IGovernor, Governor) returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);

        ExecutionDetail[] storage details = _executionDetails[proposalId];
        for (uint256 i = 0; i < targets.length; ++i) {
            details.push(_detectExecutionDetails(targets[i], bytes4(calldatas[i])));
        }

        return proposalId;
    }

    /**
     * @dev Function to queue a proposal to the timelock.
     *
     * NOTE: execution delay is estimated based on the delay information retrieved in {proposal}. This value may be
     * off if the delay were updated during the vote.
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

        ExecutionDetail[] storage details = _executionDetails[proposalId];
        ExecutionDetail memory detail;
        uint32 setback = 0;

        for (uint256 i = 0; i < targets.length; ++i) {
            detail = details[i];
            if (detail.authority != address(0)) {
                IAccessManager(detail.authority).schedule(targets[i], calldatas[i]);
            }
            setback = uint32(Math.max(setback, detail.delay)); // cast is safe, both parameters are uint32
        }

        uint256 eta = block.timestamp + setback;
        _proposalEta[proposalId] = eta;

        return eta;
    }

    /**
     * @dev See {IGovernor-_execute}
     */
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal virtual override {
        ExecutionDetail[] storage details = _executionDetails[proposalId];
        ExecutionDetail memory detail;

        // TODO: enforce ETA (might include some _defaultDelaySeconds that are not enforced by any authority)

        for (uint256 i = 0; i < targets.length; ++i) {
            detail = details[i];
            if (detail.authority != address(0)) {
                IAccessManager(detail.authority).relay{value: values[i]}(targets[i], calldatas[i]);
            } else {
                (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
                Address.verifyCallResult(success, returndata);
            }
        }

        delete _executionDetails[proposalId];
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

        ExecutionDetail[] storage details = _executionDetails[proposalId];
        ExecutionDetail memory detail;

        for (uint256 i = 0; i < targets.length; ++i) {
            detail = details[i];
            if (detail.authority != address(0)) {
                IAccessManager(detail.authority).cancel(address(this), targets[i], calldatas[i]);
            }
        }

        delete _executionDetails[proposalId];

        return proposalId;
    }

    /**
     * @dev Default delay to apply to function calls that are not (scheduled and) executed through an AccessManager.
     *
     * NOTE: execution delays are processed by the AccessManager contracts. We expect these to always be in seconds.
     * Therefore, the default delay that is enforced for calls that don't go through an access manager is also in
     * seconds, regardless of the Governor's clock mode.
     */
    function _defaultDelaySeconds() internal view virtual returns (uint32) {
        return 0;
    }

    /**
     * @dev Check if the execution of a call needs to be performed through an AccessManager and what delay should be
     * applied to this call.
     *
     * Returns { manager: address(0), delay: _defaultDelaySeconds() } if:
     * - target does not have code
     * - target does not implement IManaged
     * - calling canCall on the target's manager returns a 0 delay
     * - calling canCall on the target's manager reverts
     * Otherwise (calling canCall on the target's manager returns a non 0 delay), return the address of the
     * AccessManager to use, and the delay for this call.
     */
    function _detectExecutionDetails(address target, bytes4 selector) private view returns (ExecutionDetail memory) {
        bool success;
        bytes memory returndata;

        // Get authority
        (success, returndata) = target.staticcall(abi.encodeCall(IManaged.authority, ()));
        if (success && returndata.length >= 0x20) {
            address authority = abi.decode(returndata, (address));

            // Check if governor can call, and try to detect a delay
            (success, returndata) = authority.staticcall(
                abi.encodeCall(IAuthority.canCall, (address(this), target, selector))
            );
            if (success && returndata.length >= 0x40) {
                (bool authorized, uint32 delay) = abi.decode(returndata, (bool, uint32));

                // if direct call is not authorized, and delayed call is possible
                if (!authorized && delay > 0) {
                    return ExecutionDetail({authority: authority, delay: delay});
                }
            }
        }
        return ExecutionDetail({authority: address(0), delay: _defaultDelaySeconds()});
    }
}
