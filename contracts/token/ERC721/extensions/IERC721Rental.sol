// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC721.sol";
import "../../../utils/introspection/IERC165.sol";

/// @title ERC721 token rental agreement interface
///
/// Defines the interface that a rental agreement contract should support to be used by
/// `IERC721Rental`.
interface IERC721RentalAgreement is IERC165 {
    /// Function called at the end of `IERC721Rental.setRentalAgreement` on the agreement
    /// currently set for the token, if one exists.
    ///
    /// @dev Allows the agreement to cancel the change by reverting if it deems it
    /// necessary. The `IERC721Rental` is calling this function, so all information needed
    /// can be queried through the `msg.sender`. This event is only called when the token
    /// is not rented, as it is not allowed to change an agreement during a rental.
    function afterAgreementRemoved(uint256 tokenId) external;

    /// Function called at the end of `IERC721Rental.acceptRentalAgreement`.
    ///
    /// @dev Allows the agreement to cancel the rental by reverting if it deems it
    /// necessary. The `IERC721Rental` is calling this function, so all information needed
    /// can be queried through the `msg.sender`. This event is not called if a rental agreement
    /// has been set.
    ///
    /// @param from The address that called `IERC721Rental.acceptRentalAgreement`
    function afterRentalStarted(address from, uint256 tokenId) external;

    /// Function called at the end of `IERC721Rental.stopRentalAgreement`.
    ///
    /// @dev Allows the agreement to cancel the stop by reverting if it deems it
    /// necessary. The `IERC721Rental` is calling this function, so all information needed
    /// can be queried through the `msg.sender`. This event is not called if a rental is
    /// not in progress.
    ///
    /// @param from The address that called `IERC721Rental.stopRentalAgreement`
    function afterRentalStopped(address from, uint256 tokenId) external;
}

/// @title ERC721 token rental interface
///
/// Defines the optional interface that allows renting tokens. It works by changing the
/// behaviour of `IERC721.ownerOf` and `IERC721.balanceOf`, declaring that the owner is
/// the address that rented the token. To allow for maximum flexibility the specific
/// conditions of the rental (like setting a price or a duration) is defined by another
/// contract with the `IERC721RentalAgreement` interface.
/// Renting a contract does not allow the renter to transfer a token or change its
/// approvers or operators, only to own it. During a rental, an owner cannot transfer
/// their token either, but can still change their approvers or operators.
interface IERC721Rental is IERC721 {
    /// Set the rental agreement contract for a specific token.
    ///
    /// A previously set rental agreement contract must accept the change.
    /// The caller must be the owner (not the renter) or their approver or operator.
    /// The token must not be currently rented.
    /// The agreement is removed upon token transfer.
    ///
    /// @dev If an agreement was already set before this call, calls its
    /// `IERC721RentalAgreement.afterAgreementRemoved` at the end of the call.
    ///
    /// @param agreement The agreement. Set to 0 to remove the current agreement.
    function setRentalAgreement(IERC721RentalAgreement agreement, uint256 tokenId) external;

    /// @return The address of the rental agreement for `tokenId`, or 0 is there is no
    /// such agreement.
    function rentalAgreementOf(uint256 tokenId) external view returns (IERC721RentalAgreement);

    /// Start the rental. After this function completes, `forAddress` becomes the new
    /// registered owner.
    ///
    /// The token must have a rental agreement contract set.
    /// The token must not be currently rented.
    /// The rental agreement contract must accept the rental.
    /// `forAddress` must not be the owner of the token.
    ///
    /// @dev Calls `IERC721RentalAgreement.afterRentalStarted` at the end of the call.
    function acceptRentalAgreement(address forAddress, uint256 tokenId) external;

    /// Stop the rental. After this function completes, the original owner recovers their
    /// token.
    ///
    /// The token must be currently rented.
    /// The rental agreement contract must accept the termination.
    ///
    /// @dev Calls `IERC721RentalAgreement.afterRentalStopped` at the end of the call.
    function stopRentalAgreement(uint256 tokenId) external;

    /// @return The address of the asset owner and not the renter, or 0 if there is no
    /// rental in progress.
    function rentedOwnerOf(uint256 tokenId) external view returns (address);
}
