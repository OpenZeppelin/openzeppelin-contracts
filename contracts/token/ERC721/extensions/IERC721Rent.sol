// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC721.sol";
import "../../../utils/introspection/IERC165.sol";

/**
 * @title ERC721 token rent aggreement interface
 */
interface IERC721RentAgreement is IERC165 {
    /**
     * Called when an owner of an NFT changes or removes its NTF renting contract.
     *
     * May throw if the change is not desired.
     */
    function afterRentAgreementReplaced(uint256 tokenId) external;

    /**
     * Called when an account accepts a renting contract and wants to start the location.
     * `from` is the address that called the holder, `forAddress` is the rent beneficiary.
     *
     * May throw if the contract does not accept the rent.
     */
    function afterRentStarted(address from, uint256 tokenId) external;

    /**
     * Called when the owner or the renter wants to stop a started rent agreement.
     * `from` is the address that called the holder.
     *
     * May throw if the stop is not approved.
     */
    function afterRentStopped(address from, uint256 tokenId) external;
}

/**
 * @title ERC721 token rent interface
 */
interface IERC721Rent is IERC721 {
    /**
     * Set the rent agreement for a specific NFT. If a renting agreement already existed,
     * its afterRentAgreementReplaced() is called, which may cancel the change.
     * The agreement is cleared when the token is transferred.
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
     * Start the rental of an NFT. May throw if afterRentStarted() throws.
     *
     * Requirements:
     *
     * - `forAddress` must not own the NFT
     * - `tokenId` token must not be currently rented.
     * - the renting agreement contract must accept the rental.
     */
    function acceptRentAgreement(address forAddress, uint256 tokenId) external;

    /**
     * Stop the rental of an NFT. May throw if afterRentStopped() throws.
     *
     * Requirements:
     *
     * - `tokenId` token must be currently rented.
     * - the renting agreement contract must accept the termination.
     */
    function stopRentAgreement(uint256 tokenId) external;

    /**
     * If a token is rented, returns the true owner, otherwise returns address(0)
     */
    function rentedOwnerOf(uint256 tokenId) external view returns (address);
}
