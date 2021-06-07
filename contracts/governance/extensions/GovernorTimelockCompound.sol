// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IGovernorTimelock.sol";
import "../Governor.sol";

/**
 * https://github.com/compound-finance/compound-protocol/blob/master/contracts/Timelock.sol[Compound's timelock] interface
 */
interface ICompoundTimelock {
    receive() external payable;

    // solhint-disable-next-line func-name-mixedcase
    function GRACE_PERIOD() external view returns (uint256);

    // solhint-disable-next-line func-name-mixedcase
    function MINIMUM_DELAY() external view returns (uint256);

    // solhint-disable-next-line func-name-mixedcase
    function MAXIMUM_DELAY() external view returns (uint256);

    function admin() external view returns (address);

    function pendingAdmin() external view returns (address);

    function delay() external view returns (uint256);

    function queuedTransactions(bytes32) external view returns (bool);

    function setDelay(uint256) external;

    function acceptAdmin() external;

    function setPendingAdmin(address) external;

    function queueTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external returns (bytes32);

    function cancelTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external;

    function executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external payable returns (bytes memory);
}

/**
 * @dev Extension of {Governor} that binds the execution process to a Compound Timelock. This adds a delay, enforced by
 * the external timelock to all successfull proposal (in addition to the voting duration). The {Governor} needs to be
 * the admin of the timelock for any operation to be performed. A public, unrestricted,
 * {GovernorTimelockCompound-__acceptAdmin} is available to accept ownership of the timelock.
 *
 * Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus,
 * the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be
 * inaccessible.
 *
 * _Available since v4.2._
 */
abstract contract GovernorTimelockCompound is IGovernorTimelock, Governor {
    using Time for Time.Timer;

    struct ProposalTimelock {
        Time.Timer timer;
        bool executed;
    }

    ICompoundTimelock private _timelock;

    mapping(uint256 => ProposalTimelock) private _proposalTimelocks;

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
     * @dev Overriden version of the {Governor-state} function with added support for the `Queued` and `Expired` status.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState proposalState = super.state(proposalId);

        if (proposalState != ProposalState.Succeeded) {
            return proposalState;
        }

        uint256 eta = proposalEta(proposalId);
        if (eta == 0) {
            return proposalState;
        } else if (_proposalTimelocks[proposalId].executed) {
            return ProposalState.Executed;
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
    function proposalEta(uint256 proposalId) public view virtual returns (uint256) {
        return _proposalTimelocks[proposalId].timer.getDeadline();
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

        require(state(proposalId) == ProposalState.Succeeded, "Governance: proposal not successfull");

        uint256 eta = block.timestamp + _timelock.delay();
        _proposalTimelocks[proposalId].timer.setDeadline(eta);
        for (uint256 i = 0; i < targets.length; ++i) {
            require(
                !_timelock.queuedTransactions(keccak256(abi.encode(targets[i], values[i], "", calldatas[i], eta))),
                "GovernorWithTimelockCompound:queue: identical proposal action already queued"
            );
            _timelock.queueTransaction(targets[i], values[i], "", calldatas[i], eta);
        }

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
    ) public payable virtual override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, salt);
        Address.sendValue(payable(_timelock), msg.value);

        uint256 eta = proposalEta(proposalId);
        require(eta > 0, "GovernorWithTimelockCompound:execute: proposal not yet queued");
        for (uint256 i = 0; i < targets.length; ++i) {
            _timelock.executeTransaction(targets[i], values[i], "", calldatas[i], eta);
        }
        _proposalTimelocks[proposalId].executed = true;

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

        uint256 eta = proposalEta(proposalId);
        if (eta > 0) {
            for (uint256 i = 0; i < targets.length; ++i) {
                _timelock.cancelTransaction(targets[i], values[i], "", calldatas[i], eta);
            }
            _proposalTimelocks[proposalId].timer.reset();
        }

        return proposalId;
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
     * must be proposed, scheduled and executed using the {Governor} workflow.
     *
     * For security reason, the timelock must be handed over to another admin before setting up a new one. The two
     * operations (hand over the timelock) and do the update can be batched in a single proposal.
     */
    function updateTimelock(address newTimelock) external virtual {
        require(msg.sender == address(_timelock), "GovernorWithTimelockCompound: caller must be timelock");
        require(
            _timelock.pendingAdmin() != address(0),
            "GovernorWithTimelockCompound: old timelock must be transfered before update"
        );
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) private {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = ICompoundTimelock(payable(newTimelock));
    }
}
