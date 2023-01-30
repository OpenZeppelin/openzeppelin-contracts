// SPDX-License-Identifier: CC0-1.0
// OpenZeppelin Contracts (last updated v4.5.0) (interfaces/draft-IERC5313.sol)
pragma solidity ^0.8.0;

/**
 * @title EIP-5313 Light Contract Ownership Standard
 */
interface IERC5313 {
    /**
     * @dev Gets the address of the owner.
     */
    function owner() external view returns (address);
}
