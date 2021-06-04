// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1155.sol";
import "../../../utils/structs/EnumerableSet.sol";

/**
 * @dev Extension of {ERC1155} that allows provide enumerability of user's tokens.
 *
 * _Available since v4.x._
 */
abstract contract ERC1155Enumerable is ERC1155 {
    using EnumerableSet for EnumerableSet.UintSet;

    mapping(address => EnumerableSet.UintSet) private _ownedTokens;

    /**
     * @dev Returns the number of token kinds held by `owner`.
     */
    function tokenCountOf(address owner) public view virtual returns (uint256) {
        return _ownedTokens[owner].length();
    }

    /**
     * @dev Returns the `index`-th tokenId held by `owner`
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256) {
        require(index < tokenCountOf(owner), "ERC1155Enumerable: owner index out of bounds");
        return _ownedTokens[owner].at(index);
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal
        virtual
        override
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            if (from != address(0)) {
                if (balanceOf(from, ids[i]) == amounts[i]) {
                    _ownedTokens[from].remove(ids[i]);
                }
            }
            if (to != address(0)) {
                if (balanceOf(to, ids[i]) == 0) {
                    _ownedTokens[to].add(ids[i]);
                }
            }
        }
    }
}
