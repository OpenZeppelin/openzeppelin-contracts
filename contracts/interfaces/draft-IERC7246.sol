// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import {IERC20} from "./IERC20.sol";

interface IERC7246 is IERC20 {
    /// @dev Emitted when `amount` tokens are encumbered from `owner` to `spender`.
    event Encumber(address indexed owner, address indexed spender, uint256 amount);

    /// @dev Emitted when the encumbrance of a `spender` to an `owner` is reduced by `amount`.
    event Release(address indexed owner, address indexed spender, uint256 amount);

    /**
     * @dev Returns the total amount of tokens owned by `owner` that are currently encumbered.
     *
     * - MUST never exceed `balanceOf(owner)`
     * - Any function which would reduce `balanceOf(owner)` below `encumberedBalanceOf(owner)` MUST revert
     */
    function encumberedBalanceOf(address owner) external view returns (uint256);

    /**
     * @dev Convenience function for reading the unencumbered balance of an address.
     * Trivially implemented as `balanceOf(owner) - encumberedBalanceOf(owner)`
     */
    function availableBalanceOf(address owner) external view returns (uint256);

    /**
     * @dev Returns the number of tokens that `owner` has encumbered to `spender`.
     *
     * - This value increases when {encumber} or {encumberFrom} are called by the `owner` or by another permitted account.
     * - This value decreases when {release} or {transferFrom} are called by `spender`.
     */
    function encumbrances(address owner, address spender) external view returns (uint256);

    /**
     * @dev Increases the amount of tokens that the caller has encumbered to `spender` by `amount`.
     * Grants `spender` a guaranteed right to transfer `amount` from the caller's by using `transferFrom`.
     *
     * - MUST revert if caller does not have `amount` tokens available
     *  (e.g. if `balanceOf(caller) - encumberedBalanceOf(caller) < amount`).
     * - Emits an {IERC7246-Encumber} event.
     */
    function encumber(address spender, uint256 amount) external;

    /**
     * @dev Increases the amount of tokens that `owner` has encumbered to `spender` by `amount`.
     * Grants `spender` a guaranteed right to transfer `amount` from `owner` using transferFrom.
     *
     * - The function SHOULD revert unless the owner account has deliberately authorized the sender of the message via some mechanism.
     * - MUST revert if `owner` does not have `amount` tokens available
     *  (e.g. if `balanceOf(owner) - encumberedBalanceOf(owner) < amount`).
     * - Emits an {IERC7246-Encumber} event.
     */
    function encumberFrom(address owner, address spender, uint256 amount) external;

    /**
     * @dev Reduces amount of tokens encumbered from `owner` to caller by `amount`
     *
     * - Emits a {IERC7246-Release} event.
     */
    function release(address owner, uint256 amount) external;
}
