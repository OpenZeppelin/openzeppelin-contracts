// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OwnableExample
 * @dev Demonstrates how to inherit and use the Ownable contract from OpenZeppelin.
 * Only the owner can execute certain restricted functions.
 */

import "./Ownable.sol";

contract OwnableExample is Ownable {
    uint256 private storedNumber;

    /**
     * @notice Allows only the contract owner to update the stored number.
     * @param newNumber The new value to store.
     */
    function setNumber(uint256 newNumber) external onlyOwner {
        storedNumber = newNumber;
    }

    /**
     * @notice Returns the currently stored number.
     */
    function getNumber() external view returns (uint256) {
        return storedNumber;
    }
}
