// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../MultiParty.sol";
import "../../token/ERC721/IERC721.sol";
import "../../token/ERC721/utils/ERC721Holder.sol";

/**
 * @dev Additional implementation of the Multiparty standard with ERC721 support.
 */
contract MultiPartyWithERC721 is MultiParty, ERC721Holder {
    constructor(address[] memory initialMembers) MultiParty(initialMembers) {}

    /**
     * @dev Transfers token with id `tokenid`  of `from` address to address `to`.
     * For this to happen `erc721Contract` should either own/approved to transfer the token.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function transferERC721(
        address erc721Contract,
        address from,
        address to,
        uint256 tokenId
    ) external virtual onlySelf returns (bool success) {
        IERC721(erc721Contract).safeTransferFrom(from, to, tokenId);
        return true;
    }

    /**
     * @dev Allows `spender` to withdraw a token with given `tokenId` from your group.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function approveERC721(
        address erc721Contract,
        address spender,
        uint256 tokenId
    ) external virtual onlySelf returns (bool success) {
        IERC721(erc721Contract).approve(spender, tokenId);
        return true;
    }

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     */
    function setApprovalForAllERC721(
        address erc721Contract,
        address operator,
        bool approved
    ) external virtual onlySelf returns (bool success) {
        IERC721(erc721Contract).setApprovalForAll(operator, approved);
        return true;
    }
}
