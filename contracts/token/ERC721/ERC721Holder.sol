pragma solidity ^0.6.0;

import "./IERC721Receiver.sol";

contract ERC721Holder is IERC721Receiver {

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
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
