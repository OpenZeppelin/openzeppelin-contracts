// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

import "./Ownable.sol";

/**
 * @dev Contract module which provides access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership} and {acceptOwnership}.
 *
 * This module is used through inheritance. It will make available all functions
 * from parent (Ownable).
 */
abstract contract SafeOwnable is Ownable {
    address private _newOwner;

    event OwnershipTransferStarted(address indexed newOwner);

    /**
     * @dev Starts the ownership transfer of the contract to a new account
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        require(newOwner != address(0), "SafeOwnable: new owner is the zero address");
        _newOwner = newOwner;
        emit OwnershipTransferStarted(newOwner);
    }

    /**
     * @dev The new owner accepts the ownership transfer.
     */
    function acceptOwnership() external {
        require(_newOwner == _msgSender(), "SafeOwnable: caller is not the new owner");
        _transferOwnership(_msgSender());
    }
}
