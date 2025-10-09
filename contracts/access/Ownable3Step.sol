// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (modified for 3-step ownership) (access/Ownable3Step.sol)

pragma solidity ^0.8.20;

import {Ownable} from "./Ownable.sol";

/**
 * @dev Contract module which provides access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This extension of the {Ownable} contract includes a **three-step mechanism** to transfer
 * ownership:
 * 1. The current owner proposes a new owner via {proposeOwner}.
 * 2. The proposed owner must accept via {acceptProposedOwnership}.
 * 3. The current owner finalizes the transfer via {finalizeOwnership}.
 *
 * This mechanism helps prevent common mistakes such as transferring ownership to
 * incorrect accounts or contracts that are unable to interact with the permission system.
 *
 * The initial owner is specified at deployment time in the constructor for `Ownable`. 
 * Ownership can later be changed with the three-step process described above.
 *
 * This module is used through inheritance. It will make available all functions
 * from the parent {Ownable}.
 */
abstract contract Ownable3Step is Ownable {
    address private _pendingOwner;
    bool private _pendingOwnerAccepted;

    /**
     * @dev Emitted when ownership transfer is initiated by the current owner.
     */
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Emitted when the proposed owner accepts the ownership transfer.
     */
    event OwnershipAccepted(address indexed proposedOwner);

    /**
     * @dev Emitted when the current owner finalizes the ownership transfer.
     */
    event OwnershipFinalized(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Returns the address of the pending owner.
     */
    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }

    /**
     * @dev Returns true if the pending owner has accepted the transfer.
     */
    function pendingOwnerAccepted() public view virtual returns (bool) {
        return _pendingOwnerAccepted;
    }

    /**
     * @dev Starts the ownership transfer to `newOwner`.
     *
     * Can only be called by the current owner.
     *
     * Setting `newOwner` to the zero address cancels any pending ownership transfer.
     */
    function proposeOwner(address newOwner) public virtual onlyOwner {
        _pendingOwner = newOwner;
        _pendingOwnerAccepted = false;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    /**
     * @dev Proposed owner accepts the ownership transfer.
     *
     * Can only be called by the pending owner.
     */
    function acceptProposedOwnership() public virtual {
        address sender = _msgSender();
        if (_pendingOwner != sender) {
            revert OwnableUnauthorizedAccount(sender);
        }
        _pendingOwnerAccepted = true;
        emit OwnershipAccepted(sender);
    }

    /**
     * @dev Finalizes the ownership transfer after the proposed owner has accepted.
     *
     * Can only be called by the current owner.
     */
    function finalizeOwnership() public virtual onlyOwner {
        require(_pendingOwner != address(0), "Ownable3Step: no pending owner");
        require(_pendingOwnerAccepted, "Ownable3Step: proposed owner must accept first");

        address oldOwner = owner();
        _transferOwnership(_pendingOwner);

        // Reset pending state
        _pendingOwner = address(0);
        _pendingOwnerAccepted = false;

        emit OwnershipFinalized(oldOwner, owner());
    }

    /**
     * @dev Internal override to reset pending ownership state.
     */
    function _transferOwnership(address newOwner) internal virtual override {
        super._transferOwnership(newOwner);
        _pendingOwner = address(0);
        _pendingOwnerAccepted = false;
    }
}
