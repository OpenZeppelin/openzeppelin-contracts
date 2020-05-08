pragma solidity ^0.6.0;

/**
 * @title ERC721 token receiver interface
 * @dev Interface for any contract that wants to support safeTransfers
 * from ERC721 asset contracts.
 */
abstract contract IERC721Receiver {

    /**
     * @dev Returns the function selector on the recipient after `operator` safely transfers ({IERC721-safeTransferFrom}) `tokenId` from `from` to this contract.
     *
     * The selector to be returned can be obtained as `this.onERC721Received.selector`.
     *
     * This function may throw to revert and reject the transfer.
     *
     * The ERC721 contract address is always the message sender.
     *
     * Requirements:
     *
     * - This function must return the function selector, otherwise the caller will revert the transaction.
     */
    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data)
    public virtual returns (bytes4);
}
