// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (token/ERC721/extensions/ERC721Enumerable.sol)

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "./IERC721Enumerable.sol";

/**
 * @dev This implements an optional extension of {ERC721} defined in the EIP that adds
 * enumerability of all the token ids in the contract as well as all token ids owned by each
 * account.
 */
abstract contract ERC721Enumerable is ERC721, IERC721Enumerable {
    uint256 private constant _OWNED_INDEX_MASK = 0xffffffffffffffffffffffffffffffff;
    uint256 private constant _ALL_INDEX_MASK = ~_OWNED_INDEX_MASK;
    uint256 private constant _ALL_INDEX_SHIFT = 128;

    // Mapping from owner to list of owned token IDs
    mapping(address => uint16[]) private _ownedTokens;

    // Mapping from token to index in the _allTokens array and the _ownedTokens array of the owner
    // The first 16 byte of the value are the index for the owned tokens array
    // The last 16 byte of the value are the index for the all tokens array
    mapping(uint256 => uint256) private _indexMapping;

    // Array with all token ids, used for enumeration
    uint16[] private _allTokens;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC721) returns (bool) {
        return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual override returns (uint256) {
        require(index < ERC721.balanceOf(owner), "ERC721Enumerable: owner index out of bounds");
        return _ownedTokens[owner][index];
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _allTokens.length;
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        require(index < ERC721Enumerable.totalSupply(), "ERC721Enumerable: global index out of bounds");
        return _allTokens[index];
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            _createNewIndexEntry(tokenId, _ownedTokens[to].length);
            _ownedTokens[to].push(uint16(tokenId));
            _allTokens.push(uint16(tokenId));
        } else if (to == address(0)) {
            uint256 index = _indexMapping[tokenId];

            _removeTokenFromCurrentOwner(from, tokenId, index);

            // remove token from _allTokens
            uint16 lastToken = _allTokens[_allTokens.length - 1];
            _updateIndexEntry(lastToken, index, _indexMapping[lastToken]);
            _allTokens[_getAllIndex(index)] = lastToken;
            _allTokens.pop();
        } else if (from != to) {
            uint256 index = _indexMapping[tokenId];

            _removeTokenFromCurrentOwner(from, tokenId, index);

            // add token to new owner
            _updateIndexEntry(tokenId, index, _ownedTokens[to].length);
            _ownedTokens[to].push(uint16(tokenId));
        }
    }

    function _removeTokenFromCurrentOwner(address from, uint256 tokenId, uint256 index) private {
        uint16 lastToken = _ownedTokens[from][_ownedTokens[from].length - 1];
        _indexMapping[lastToken] = _indexMapping[tokenId];
        _ownedTokens[from][_getUserIndex(index)] = lastToken;
        _ownedTokens[from].pop();
    }

    function _updateIndexEntry(uint256 tokenId, uint256 allIndex, uint256 userIndex) private {
        _indexMapping[tokenId] = (allIndex & _ALL_INDEX_MASK) | (userIndex & _OWNED_INDEX_MASK);
    }

    function _createNewIndexEntry(uint256 tokenId, uint256 ownedIndex) internal {
        _indexMapping[tokenId] = (_allTokens.length << _ALL_INDEX_SHIFT) | (ownedIndex & _OWNED_INDEX_MASK);
    }

    function _getUserIndex(uint256 index) private pure returns (uint256) {
        return index & _OWNED_INDEX_MASK;
    }

    function _getAllIndex(uint256 index) private pure returns (uint256) {
        return index >> _ALL_INDEX_SHIFT;
    }
}
