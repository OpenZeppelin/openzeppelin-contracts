// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (token/ERC6909/draft-IERC6909.sol)

pragma solidity ^0.8.20;

import {IERC165} from "../utils/introspection/IERC165.sol";

/**
 * @dev Required interface of an ERC-6909 compliant contract, as defined in the
 * https://eips.ethereum.org/EIPS/eip-6909[ERC].
 */
interface IERC6909 is IERC165 {
    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by a call to `approve` for a
     * token of type `id`. The new allowance is `amount`.
     */
    event Approval(address indexed owner, address indexed spender, uint256 indexed id, uint256 amount);

    /**
     * @dev Emitted when `owner` grants or revokes operator status for a `spender`.
     */
    event OperatorSet(address indexed owner, address indexed spender, bool isOperator);

    /**
     * @dev Emitted when `amount` tokens of type `id` are moved from `from` to `to` initiated by `caller`.
     */
    event Transfer(address caller, address indexed from, address indexed to, uint256 indexed id, uint256 amount);

    /**
     * @dev Returns the amount of tokens of type `id` owned by `owner`.
     */
    function balanceOf(address owner, uint256 id) external view returns (uint256);

    /**
     * @dev Returns the amount of tokens of type `id` that `spender` is allowed to spend on behalf of `owner`.
     *
     * NOTE: Does not include operator allowances.
     */
    function allowance(address owner, address spender, uint256 id) external view returns (uint256);

    /**
     * @dev Returns true if `spender` is set as an operator for `owner`.
     */
    function isOperator(address owner, address spender) external view returns (bool);

    /**
     * @dev Sets an approval to `spender` for `amount` tokens of type `id` from the caller's tokens.
     *
     * Must return true.
     */
    function approve(address spender, uint256 id, uint256 amount) external view returns (bool);

    /**
     * @dev Grants or revokes unlimited transfer permission of any token id to `spender` for the caller's tokens.
     *
     * Must return true.
     */
    function setOperator(address spender, bool isOperator) external returns (bool);

    /**
     * @dev Transfers `amount` of token type `id` from the caller's account to `to`.
     *
     * Must return true.
     */
    function transfer(address to, uint256 id, uint256 amount) external returns (bool);

    /**
     * @dev Transfers `amount` of token type `id` from `from` to `to`.
     *
     * Must return true.
     */
    function transferFrom(address from, address to, uint256 id, uint256 amount) external returns (bool);
}
