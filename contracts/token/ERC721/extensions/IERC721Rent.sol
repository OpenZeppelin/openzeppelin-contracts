// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC721.sol";
import "../../../utils/introspection/IERC165.sol";

enum RentingRole {
    OwnerOrApprover,
    Renter
}

/**
 * @title ERC721 token rent aggreement interface
 */
interface IERC721RentAgreement is IERC165 {
    /**
     * Called when an owner of an NFT changes or removes its NTF renting contract.
     *
     * May throw if the change is not desired.
     */
    function onChangeAgreement(uint256 tokenId) external;

    /**
     * Called when an account accepts a renting contract and wants to start the location.
     *
     * May throw if the contract does not accept the rent.
     */
    function onStartRent(uint256 tokenId, address tokenRenter) external;

    /**
     * Called when the owner or the renter wants to stop a started rent agreement.
     *
     * May throw if the stop is not approved.
     */
    function onStopRent(uint256 tokenId, RentingRole role) external;
}

/**
 * @title ERC721 token rent interface
 */
interface IERC721Rent {
    /**
     * Set the rent agreement for a specific NFT. If a renting agreement already existed,
     * its onChangeAgreement() is called, which may cancel the change.
     *
     * Requirements:
     *
     * - `tokenId` token must be owned by the sender or be an approved address.
     * - `tokenId` token must not be currently rented.
     */
    function setRentAgreement(IERC721RentAgreement aggreement, uint256 tokenId) external;

    /**
     * Returns the aggreement contract of that token or address 0 if none is set.
     */
    function rentAggreementOf(uint256 tokenId) external view returns (IERC721RentAgreement);

    /**
     * Start the rental of an NFT. May throy if onStartRent() throws.
     *
     * Requirements:
     *
     * - the sender must not own the NFT
     * - `tokenId` token must not be currently rented.
     * - the renting agreement contract must accept the rental.
     */
    function acceptRentAgreement(uint256 tokenId) external;

    /**
     * Stop the rental of an NFT. May throw if onStopRent() throws.
     *
     * Requirements:
     *
     * - the sender must be the renter of the NFT, its original owner or approved by the original owner.
     * - `tokenId` token must be currently rented.
     * - the renting agreement contract must accept the termination.
     */
    function stopRentAgreement(uint256 tokenId) external;

    /**
     * Returns true if the token is currently being rent by someone.
     */
    function isRented(uint256 tokenId) external view returns (bool);
}
