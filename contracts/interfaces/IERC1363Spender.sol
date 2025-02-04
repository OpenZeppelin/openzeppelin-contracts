// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (interfaces/IERC1363Spender.sol)

pragma solidity ^0.8.20;

/**
 * @title IERC1363Spender
 * @dev Interface for any contract that wants to support `approveAndCall`
 * from ERC-1363 token contracts.
 */
interface IERC1363Spender {
    /**
     * @dev Whenever an ERC-1363 token `owner` approves this contract via `approveAndCall`
     * to spend their tokens, this function is called.
     *
     * NOTE: To accept the approval, this must return
     * `bytes4(keccak256("onApprovalReceived(address,uint256,bytes)"))`
     * (i.e. 0x7b04a2d0, or its own function selector).
     *
     * @param owner The address which called `approveAndCall` function and previously owned the tokens.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format.
     * @return `bytes4(keccak256("onApprovalReceived(address,uint256,bytes)"))` if approval is allowed unless throwing.
     */
    function onApprovalReceived(address owner, uint256 value, bytes calldata data) external returns (bytes4);
}
