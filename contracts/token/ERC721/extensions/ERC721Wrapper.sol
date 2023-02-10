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
    // Equal to 0xb125e89df18e2ceac5fd2fa8
    bytes12 public constant WRAPPER_ACCEPT_MAGIC = bytes12(keccak256("WRAPPER_ACCEPT_MAGIC"));

    constructor(IERC721 underlyingToken) {
        _underlying = underlyingToken;
    }

    /**
     * @dev Allow a user to deposit underlying tokens and mint the corresponding tokenIds.
     */
    function depositFor(address account, uint256[] memory tokenIds) public virtual returns (bool) {
        bytes memory data = abi.encodePacked(WRAPPER_ACCEPT_MAGIC, account);

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
     * this contract.
     *
     * In case there's data attached, it validates that the sender is aware of this contract's existence and behavior
     * by checking a magic value (`WRAPPER_ACCEPT_MAGIC`) in the first 12 bytes. If it also matches, the rest 20
     * bytes are used as an address to send the tokens to.
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
        require(address(underlying()) == _msgSender(), "ERC721Wrapper: caller is not underlying");
        if (data.length > 0) {
            require(data.length == 32 && WRAPPER_ACCEPT_MAGIC == bytes12(data), "ERC721Wrapper: Invalid data format");
            from = address(bytes20(bytes32(data) << 96));
        }
        _safeMint(from, tokenId);
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
}
