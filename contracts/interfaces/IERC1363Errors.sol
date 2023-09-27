// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @title IERC1363Errors
 * @dev Interface of the ERC1363 custom errors following the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] rationale.
 */
interface IERC1363Errors {
    /**
     * @dev Indicates a failure with the token `receiver` as it can't be an EOA. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1363EOAReceiver(address receiver);

    /**
     * @dev Indicates a failure with the token `spender` as it can't be an EOA. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1363EOASpender(address spender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1363InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the token `spender`. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1363InvalidSpender(address spender);
}
