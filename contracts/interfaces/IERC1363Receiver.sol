// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363Receiver.sol)

pragma solidity >=0.5.0;

/**
 * @title IERC1363Receiver
 * @dev Interface for any contract that wants to support `transferAndCall` or `transferFromAndCall`
 * from ERC-1363 token contracts.
 */
interface IERC1363Receiver {
    /**
     * @dev Whenever ERC-1363 tokens are transferred to this contract via `transferAndCall` or `transferFromAndCall`
     * by `operator` from `from`, this function is called.
     *
     * NOTE: To accept the transfer, this must return
     * `bytes4(keccak256("onTransferReceived(address,address,uint256,bytes)"))`
     * (i.e. 0x88a7ca5c, or its own function selector).
     *
     * @param operator The address which called `transferAndCall` or `transferFromAndCall` function.
     * @param from The address which the tokens are transferred from.
     * @param value The amount of tokens transferred.
     * @param data Additional data with no specified format.
     * @return `bytes4(keccak256("onTransferReceived(address,address,uint256,bytes)"))` if transfer is allowed unless throwing.
     */
    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
}
