// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../utils/ERC721Holder.sol";

/**
 * @dev Extension of the ERC721 token contract to support token wrapping.
 *
 * Users can deposit and withdraw an "underlying token" and receive a "wrapped token" with a matching tokenId. This is useful
 * in conjunction with other modules. For example, combining this wrapping mechanism with {ERC721Votes} will allow the
 * wrapping of an existing "basic" ERC721 into a governance token.
 *
 * _Available since v4.9.0_
 */
abstract contract ERC721Wrapper is ERC721, ERC721Holder {
    IERC721 private immutable _underlying;

    // Kept as bytes12 so it can be packed with an address
    bytes12 private constant _WRAPPER_ACCEPT_MAGIC = bytes12(keccak256("WRAPPER_ACCEPT_MAGIC")); 

    constructor(IERC721 underlyingToken) {
        _underlying = underlyingToken;
    }

    /**
     * @dev Allow a user to deposit underlying tokens and mint the corresponding tokenIds.
     */
    function depositFor(address account, uint256[] memory tokenIds) public virtual returns (bool) {
        bytes memory data = abi.encodePacked(_WRAPPER_ACCEPT_MAGIC, account);

        uint256 length = tokenIds.length;
        for (uint256 i = 0; i < length; ++i) {
            underlying().safeTransferFrom(_msgSender(), address(this), tokenIds[i], data);
        }

        return true;
    }

    /**
     * @dev Allow a user to burn wrapped tokens and withdraw the corresponding tokenIds of the underlying tokens.
     */
    function withdrawTo(address account, uint256[] memory tokenIds) public virtual returns (bool) {
        uint256 length = tokenIds.length;
        for (uint256 i = 0; i < length; ++i) {
            uint256 tokenId = tokenIds[i];
            require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721Wrapper: caller is not token owner or approved");
            _burn(tokenId);
            // Checks were already performed at this point, and there's no way to retake ownership or approval from
            // the wrapped tokenId after this point, so it's safe to remove the reentrancy check for the next line.
            // slither-disable-next-line reentrancy-no-eth
            underlying().safeTransferFrom(address(this), account, tokenId);
        }

        return true;
    }

    /**
     * @dev Overrides {IERC721Receiver-onERC721Received} to allow minting on direct ERC721 transfers to
     * this contract. It checks that the first 4 bytes in `data` are equal to `_WRAPPER_ACCEPT_MAGIC` to
     * guarantee the sender data is aware of this contract's existence and behavior.
     *
     * Data may specify an optional address if it's appended to the magic value. Otherwise the token is sent
     * owner of the underlying tokenId.
     *
     * WARNING: Doesn't work with unsafe transfers (eg. {IERC721-transferFrom}). Use {ERC721Wrapper-_recover}
     * for recovering in that scenario.
     */
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        require(
            msg.sender == address(underlying()) && _WRAPPER_ACCEPT_MAGIC == bytes12(data),
            "ERC721Wrapper: caller is not a wrapper-aware underlying"
        );
        _safeMint(_mintWrappedTo(from, data), tokenId);
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Mint a wrapped token to cover any underlyingToken that would have been transferred by mistake. Internal
     * function that can be exposed with access control if desired.
     */
    function _recover(address account, uint256 tokenId) internal virtual returns (uint256) {
        require(underlying().ownerOf(tokenId) == address(this), "ERC721Wrapper: wrapper is not token owner");
        _safeMint(account, tokenId);
        return tokenId;
    }

    /**
     * @dev Returns the underlying token.
     */
    function underlying() public view virtual returns (IERC721) {
        return _underlying;
    }

    /**
     * @dev Returns the address to mint the wrapped token to.
     *
     * Since {onERC721Received} includes the magic value with an optional address, the only valid data lengths
     * are 4 for only the magic value and 24 for both the magic value and an address.
     *
     * Requirements:
     *
     * - `_WRAPPER_ACCEPT_MAGIC` must be already validated.
     */
    function _mintWrappedTo(address from, bytes memory data) private pure returns (address) {
        require(data.length == 32 || data.length == 12, "ERC721Wrapper: invalid data length");
        return data.length == 32 ? address(bytes20(bytes32(data) << 96)) : from;
    }
}
