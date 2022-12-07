// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC721.sol";

/**
 * @dev Extension of the ERC721 token contract to support token wrapping.
 *
 * Users can deposit and withdraw an "underlying token" and receive a "wrapped token" with a matching tokenId. This is useful
 * in conjunction with other modules. For example, combining this wrapping mechanism with {ERC721Votes} will allow the
 * wrapping of an existing "basic" ERC721 into a governance token.
 *
 * _Available since v4.8.1_
 */
abstract contract ERC721Wrapper is ERC721 {
    IERC721 public immutable underlying;

    constructor(IERC721 underlyingToken) {
        underlying = underlyingToken;
    }

    /**
     * @dev Allow a user to deposit an underlying token and mint the corresponding tokenId.
     */
    function depositFor(address account, uint256 tokenId) public virtual returns (bool) {
        underlying.safeTransferFrom(_msgSender(), address(this), tokenId);
        _safeMint(account, tokenId);
        return true;
    }

    /**
     * @dev Allow a user to burn a wrapped token and withdraw the corresponding tokenId of the underlying token.
     */
    function withdrawTo(address account, uint256 tokenId) public virtual returns (bool) {
        _burn(tokenId);
        underlying.safeTransferFrom(address(this), account, tokenId);
        return true;
    }

    /**
     * @dev Mint a wrapped token to cover any underlyingToken that would have been transferred by mistake. Internal
     * function that can be exposed with access control if desired.
     */
    function _recover(address account, uint256 tokenId) internal virtual returns (uint256) {
        require(underlying.ownerOf(tokenId) == address(this), "ERC721Wrapper: wrapper is not token owner");
        _safeMint(account, tokenId);
        return tokenId;
    }
}
