// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC721.sol";
import "./extensions/IERC721Rental.sol";
import "../../utils/introspection/ERC165.sol";

/// @title ERC721 bundle rental agreement
///
/// Deploy one contract for any token rentals following these principles:
///  - The rental price is defined by second of rental.
///  - The whole cost must be payed at the start of the rental (with a defined duration).
///  - Both owner and renter can cancel the rental, but must pay a fee for it. The unused
///    rented time is refunded to the renter.
///
/// The contract defines a default rental price and cancelation fee, but the owner of a
/// token (or their approved ones) can define them for a specific token as well.
/// The contract lets the owner redeem the fees only after the rental is finished, and
/// does not allow itself to be changed if fees need to be redeemed.
contract ERC721BundleRentalAgreement is IERC721RentalAgreement, ERC165 {
    struct TokenRental {
        uint40 startTimestamp;
        uint40 paidDurationInSecond;
        uint80 priceInWeiPerSecond;
        uint80 cancelationFeeInWei;
        // ---
        uint80 nextPriceInWeiPerSecond;
        uint80 nextCancelationFeeInWei;
        uint96 rentToRedeemInWei;
    }

    mapping(IERC721Rental => mapping(uint256 => TokenRental)) public tokenRentals;
    uint80 public immutable defaultRentPriceInWeiPerSecond;
    uint80 public immutable defaultCancelationFeeInWei;

    /// If the token specific price is zero, it will use the default one. Same for the fee.
    /// Default prices cannot be changed afterwards.
    constructor(uint32 _defaultRentPriceInWeiPerSecond, uint80 _defaultCancelationFeeInWei) {
        defaultRentPriceInWeiPerSecond = _defaultRentPriceInWeiPerSecond;
        defaultCancelationFeeInWei = _defaultCancelationFeeInWei;
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalAgreementReplaced(uint256 tokenId) external view virtual override {
        // We don't need to check if a rental is in progress because the IERC721Rental does that for us
        // We don't allow to change the contract if funds remain, because we don't store the owner
        require(
            tokenRentals[IERC721Rental(msg.sender)][tokenId].rentToRedeemInWei == 0,
            "IERC721RentalAgreement: rent has not been redeemed"
        );
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalStarted(address from, uint256 tokenId) external view virtual override {
        // Make sure it was called through `payAndStartRent` to make sure the fee was paid and the state set
        require(from == address(this));
        require(tokenRentals[IERC721Rental(msg.sender)][tokenId].startTimestamp == uint40(block.timestamp));
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalStopped(address, uint256 tokenId) external virtual override {
        TokenRental memory rental = tokenRentals[IERC721Rental(msg.sender)][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentalAgreement: token is not rented");
        require(_isRentalFinished(rental), "IERC721RentalAgreement: rental is not finished");

        rental.rentToRedeemInWei += uint96(rental.priceInWeiPerSecond) * uint96(rental.paidDurationInSecond);

        rental.startTimestamp = 0;
        rental.paidDurationInSecond = 0;
        rental.priceInWeiPerSecond = 0;
        rental.cancelationFeeInWei = 0;
        tokenRentals[IERC721Rental(msg.sender)][tokenId] = rental;
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721RentalAgreement).interfaceId || super.supportsInterface(interfaceId);
    }

    /// Start a rental for a defined time, paying the expected price upfront. The caller
    /// of the function becomes the renter.
    function payAndStartRent(
        IERC721Rental holder,
        uint256 tokenId,
        uint40 plannedRentalDurationInSeconds
    ) external payable {
        require(plannedRentalDurationInSeconds > 0, "IERC721RentalAgreement: rental duration");

        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp == 0, "IERC721RentalAgreement: token is rented");

        rental.priceInWeiPerSecond = rental.nextPriceInWeiPerSecond;
        if (rental.priceInWeiPerSecond == 0) {
            rental.priceInWeiPerSecond = defaultRentPriceInWeiPerSecond;
        }
        rental.cancelationFeeInWei = rental.nextCancelationFeeInWei;
        if (rental.cancelationFeeInWei == 0) {
            rental.cancelationFeeInWei = defaultCancelationFeeInWei;
        }

        uint96 price = uint96(rental.priceInWeiPerSecond) * uint96(plannedRentalDurationInSeconds);
        require(msg.value == price, "IERC721RentalAgreement: rental price not matched");

        rental.startTimestamp = uint40(block.timestamp);
        rental.paidDurationInSecond = plannedRentalDurationInSeconds;
        tokenRentals[holder][tokenId] = rental;

        holder.acceptRentalAgreement(msg.sender, tokenId);
    }

    /// Stop a rental before its declared time. If the owner (or their approvers) calls this
    /// function, they have to pay the fee, and the unused time is refunded to the renter.
    /// If the renter calls this function, they have to pay the current rental cost + the
    /// fee. If the amount paid before is greater than that, then the rest is refunded to
    // the renter directly.
    ///
    /// The owner can know their fee by calling `cancelationFeesForOwner` (or by querying
    /// `tokenRentals` directly).
    /// The renter can know their fee by calling `cancelationFeesForRenter` in the same
    /// transaction as they call this function.
    function payAndCancelRent(IERC721Rental holder, uint256 tokenId) external payable {
        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentalAgreement: token is not rented");
        require(!_isRentalFinished(rental), "IERC721RentalAgreement: token rental can be finished");

        uint96 paid = uint96(rental.priceInWeiPerSecond) * uint96(rental.paidDurationInSecond);
        address renter = holder.ownerOf(tokenId);
        uint256 refund = 0;

        if (msg.sender == renter) {
            int256 fees = _renterCancelationFees(rental);

            if (fees > 0) {
                require(msg.value == uint256(fees), "IERC721RentalAgreement: cancelation fee not matched");
                rental.rentToRedeemInWei += paid + uint96(uint256(fees));
            } else {
                require(msg.value == 0, "IERC721RentalAgreement: cancelation fee not matched");
                rental.rentToRedeemInWei += paid - uint96(uint256(-fees));
                refund = uint256(-fees);
            }
        } else {
            require(
                _isOwnerOrApproved(holder, tokenId, msg.sender),
                "IERC721RentalAgreement: only renter, owner or approved of token"
            );
            require(msg.value == rental.cancelationFeeInWei, "IERC721RentalAgreement: cancelation fee not matched");

            uint256 durationRefund = _currentDurationRefund(rental);
            refund = durationRefund + rental.cancelationFeeInWei;
            rental.rentToRedeemInWei += paid - uint96(durationRefund);
        }

        // Early exit
        rental.paidDurationInSecond = 0;
        tokenRentals[holder][tokenId] = rental;
        holder.stopRentalAgreement(tokenId);

        // Do the refund at the end to avoid reentrancy attacks
        if (refund > 0) {
            require(payable(renter).send(refund), "IERC721RentalAgreement: sending ETH to renter");
        }
    }

    /// Stop the rental after its planned time expired. Provided for convenience, can
    /// just use `IERC721Rental.stopRentalAgreement` directly.
    function finishRent(IERC721Rental holder, uint256 tokenId) external {
        holder.stopRentalAgreement(tokenId);
    }

    /// @return the fees that need to be paid by the renter if they want to cancel the
    /// rental, on top of what they already paid. If they are entitled to a refund instead,
    /// the refund is indicated by a negative number and the cancellation should not be
    /// called with a value.
    /// Note that since the rental price is defined by second, the price returned by this
    /// function is valid only for the current transaction.
    function cancelationFeesForRenter(IERC721Rental holder, uint256 tokenId) external view returns (int256) {
        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentalAgreement: token is not rented");
        require(!_isRentalFinished(rental), "IERC721RentalAgreement: token rental can be finished");
        return _renterCancelationFees(rental);
    }

    /// @return the cancelation fee that the owner must pay to cancel a rental. The fee
    /// is transfered to the renter upon cancelation, as well as a refund for the unused
    /// rental time.
    function cancelationFeesForOwner(IERC721Rental holder, uint256 tokenId) external view returns (uint80) {
        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentalAgreement: token is not rented");
        require(!_isRentalFinished(rental), "IERC721RentalAgreement: token rental can be finished");
        return rental.cancelationFeeInWei;
    }

    /// The fees and rent can be redeemed by the owner (or one of their approvers) by calling
    /// this function. The whole available amount is transfered to the `recipient`.
    /// Note that while it is possible to redeem this at any time, the rent for a specific
    /// rental can only be redeemed after that rental is finished.
    /// Anybody can check how much there is to redeem by querying `tokenRentals`.
    function redeemRent(
        IERC721Rental holder,
        uint256 tokenId,
        address payable recipient
    ) external {
        require(
            _isOwnerOrApproved(holder, tokenId, msg.sender),
            "IERC721RentalAgreement: only owner or approved of token"
        );

        uint96 value = tokenRentals[holder][tokenId].rentToRedeemInWei;
        tokenRentals[holder][tokenId].rentToRedeemInWei = 0;

        require(recipient.send(value), "IERC721RentalAgreement: sending ETH");
    }

    /// Set the price of the next rentals for that specific token. If does not modify the
    /// price of the current rental if one is in progress.
    function setTokenPriceInWeiPerSecond(
        IERC721Rental holder,
        uint256 tokenId,
        uint80 priceInWeiPerSecond
    ) external {
        require(
            _isOwnerOrApproved(holder, tokenId, msg.sender),
            "IERC721RentalAgreement: only owner or approved of token"
        );
        tokenRentals[holder][tokenId].nextPriceInWeiPerSecond = priceInWeiPerSecond;
    }

    /// Set the price of the next cancellation fee for that specific token. If does not
    /// modify the fee of the current rental if one is in progress.
    function setTokenCancelationFeeInWei(
        IERC721Rental holder,
        uint256 tokenId,
        uint80 cancelationFeeInWei
    ) external {
        require(
            _isOwnerOrApproved(holder, tokenId, msg.sender),
            "IERC721RentalAgreement: only owner or approved of token"
        );
        tokenRentals[holder][tokenId].nextCancelationFeeInWei = cancelationFeeInWei;
    }

    function _isRentalFinished(TokenRental memory rental) internal view returns (bool) {
        return (rental.startTimestamp + rental.paidDurationInSecond) <= block.timestamp;
    }

    // Do not call if `_isRentalFinished` returns `true`
    function _currentDurationRefund(TokenRental memory rental) internal view returns (uint256) {
        uint256 timeSpent = block.timestamp - rental.startTimestamp;
        return (rental.paidDurationInSecond - timeSpent) * rental.priceInWeiPerSecond;
    }

    // Negative value means refund
    function _renterCancelationFees(TokenRental memory rental) internal view returns (int256) {
        return int256(uint256(rental.cancelationFeeInWei)) - int256(_currentDurationRefund(rental));
    }

    function _isOwnerOrApproved(
        IERC721Rental holder,
        uint256 tokenId,
        address sender
    ) internal view returns (bool) {
        // We want the real owner here, not the renter
        address owner = holder.rentedOwnerOf(tokenId);
        if (owner == address(0)) {
            owner = holder.ownerOf(tokenId);
        }
        return owner == sender || holder.getApproved(tokenId) == sender || holder.isApprovedForAll(owner, sender);
    }
}
