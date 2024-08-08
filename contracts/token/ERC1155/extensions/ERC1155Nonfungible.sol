// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC1155} from "../ERC1155.sol";
import {Arrays} from "../../../utils/Arrays.sol";

/**
 * @dev Indicates that the operator is trying to mint a token that already exists.
 * @param id Identifier of token being minted
 * @param owner Current token owner
 */
error ERC1155NonfungibleDuplicate(uint256 id, address owner);

/**
 * @dev Indicates that the operator is trying mint/transfer/burn an amount > 1 of a token
 */
error ERC1155NonfungibleInvalidAmount(uint256 id, uint256 amount);

/**
 * @dev For tokens that are nonfungible but prefer to use {ERC1155} rather than {ERC721}.
 *
 * {ERC1155Nonfungible} takes advantage of nonfungibility constraint to replace data model
 * tracking multiple account balances per token with with a more gas-efficient data model
 * tracking unique ownership per token.
 *
 * Moreover {ERC1155Nonfungible} makes it possible to query the owner of a specific token via {ERC1155Nonfungible-ownerOf},
 * similar to {ERC721-ownerOf}, but differs from {ERC721-ownerOf} in that querying the owner of an inexistent token
 * will not revert but will return `address(0)`.
 */
abstract contract ERC1155Nonfungible is ERC1155 {
    using Arrays for uint256[];
    using Arrays for address[];

    mapping(uint256 id => address) private _owners;

    /**
     * @dev Returns the owner of the token `id`. Does NOT revert if token doesn't exist.
     *
     * {ERC1155Nonfungible-ownerOf} and {ERC1155Nonfungible-_setOwnerOf} may be overridden in tandem,
     * e.g. to store more token information along with the owner
     */
    function ownerOf(uint256 id) public view virtual returns (address) {
        return _owners[id];
    }

    /**
     * @dev {ERC1155Nonfungible-ownerOf} and {ERC1155Nonfungible-_setOwnerOf} may be overridden in tandem,
     * e.g. to store more token information along with the owner
     */
    function _setOwnerOf(uint256 id, address owner) internal virtual {
        _owners[id] = owner;
    }

    /**
     * @dev Replaces {ERC1155-balanceOf} implementation entirely.
     */
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        return account != address(0) && ownerOf(id) == account ? 1 : 0;
    }

    /**
     * @dev Replaces {ERC1155-_update} implementation entirely.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        if (ids.length != values.length) {
            revert ERC1155InvalidArrayLength(ids.length, values.length);
        }

        address operator = _msgSender();

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids.unsafeMemoryAccess(i);
            uint256 value = values.unsafeMemoryAccess(i);

            if (value == 1) {
                address currOwner = ownerOf(id);
                // Could be written more compactly, but clearer if mint tackled separately from transfer/burn
                if (from == address(0)) {
                    if (currOwner == address(0)) {
                        _setOwnerOf(id, to);
                    } else {
                        revert ERC1155NonfungibleDuplicate(id, currOwner);
                    }
                } else {
                    if (from == currOwner) {
                        _setOwnerOf(id, to);
                    } else {
                        revert ERC1155InsufficientBalance({sender: from, balance: 0, needed: 1, tokenId: id});
                    }
                }
            } else if (value == 0) {
                // ERC-1155 allows zero-value transfers
            } else {
                revert ERC1155NonfungibleInvalidAmount(id, value);
            }
        }

        if (ids.length == 1) {
            uint256 id = ids.unsafeMemoryAccess(0);
            uint256 value = values.unsafeMemoryAccess(0);
            emit TransferSingle(operator, from, to, id, value);
        } else {
            emit TransferBatch(operator, from, to, ids, values);
        }
    }
}
