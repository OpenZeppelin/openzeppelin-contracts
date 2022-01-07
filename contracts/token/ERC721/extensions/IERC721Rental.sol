// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC721.sol";
import "../../../utils/introspection/IERC165.sol";

/// @title ERC721 token rental aggreement interface
///
/// Defines the interface that a rental agreement contract should support to be used by
/// `IERC721Rental`.
interface IERC721RentalAgreement is IERC165 {
    /// Function called at the end of `IERC721Rental.setRentalAgreement` to replace an
    /// existing rental agreement contract of a token.
    ///
    /// @dev Allows the agreement to cancel the change by reverting if it deems it
    /// necessary. The `IERC721Rental` is calling this function, so all information needed
    /// can be queried through the `msg.sender`. This event is not called if a rental is
    /// not in progress.
    function afterRentalAgreementReplaced(uint256 tokenId) external;

    /// Function called at the end of `IERC721Rental.acceptRentalAgreement`.
    ///
    /// @dev Allows the agreement to cancel the rental by reverting if it deems it
    /// necessary. The `IERC721Rental` is calling this function, so all information needed
    /// can be queried through the `msg.sender`. This event is not called if a rental is
    /// in progress.
    ///
    /// @param from the address that called `IERC721Rental.acceptRentalAgreement`
    function afterRentalStarted(address from, uint256 tokenId) external;

    /// Function called at the end of `IERC721Rental.stopRentalAgreement`.
    ///
    /// @dev Allows the agreement to cancel the stop by reverting if it deems it
    /// necessary. The `IERC721Rental` is calling this function, so all information needed
    /// can be queried through the `msg.sender`. This event is not called if a rental is
    /// not in progress.
    ///
    /// @param from the address that called `IERC721Rental.stopRentalAgreement`
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
/// approvers or operators, only to own it. During a rental, an owner cannot tranfer
/// their token either, but can still change their approvers or operators.
interface IERC721Rental is IERC721 {
    /// Set the rental agreement contract for a specific token.
    ///
    /// A previousley set rental agreement contract must accept the change.
    /// The caller must be the owner or their approver or operator.
    /// The token must not be currently rented.
    /// The agreement is removed upon token transfer.
    ///
    /// @dev If an agreement was set, calls its
    /// `IERC721RentalAgreement.afterRentalAgreementReplaced` at the end of the call.
    ///
    /// @param aggreement the agreement. Set to 0 to remove the current agreement.
    function setRentalAgreement(IERC721RentalAgreement aggreement, uint256 tokenId) external;

    /// @return the address of the rental agreement for `tokenId`, or 0 is there is no
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

    /// Stop the rental. After this function completes, the owner becomes recovers their
    /// token.
    ///
    /// The token must be currently rented.
    /// The rental agreement contract must accept the termination.
    ///
    /// @dev Calls `IERC721RentalAgreement.afterRentalStopped` at the end of the call.
    function stopRentalAgreement(uint256 tokenId) external;

    /// @return the address of the rented token owner, or 0 is there is no rental in
    /// progress.
    function rentedOwnerOf(uint256 tokenId) external view returns (address);
}
