// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

import {Context} from "../utils/Context.sol";
import {Ownable} from "./Ownable.sol";

/**
 * @dev Variant of {Ownable} that restricts {transferOwnership} to only
 * receive a non-zero address. The {renounceOwnership} function is provided as
 * a replacement.
 */
abstract contract OwnableRenounceable is Context, Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual override {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        super.transferOwnership(newOwner);
    }
}
