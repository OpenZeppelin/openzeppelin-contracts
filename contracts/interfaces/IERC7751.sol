// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (interfaces/IERC7751.sol)

pragma solidity >=0.8.4;

/**
 * @dev Wrapping of bubbled up reverts
 * Interface of the https://eips.ethereum.org/EIPS/eip-7751[ERC-7751] wrapping of bubbled up reverts.
 */
interface IERC7751 {
    error WrappedError(address target, bytes4 selector, bytes reason, bytes details);
}
