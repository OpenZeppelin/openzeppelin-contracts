// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC721.sol";
import "./extensions/IERC721Rent.sol";
import "../../utils/introspection/ERC165.sol";

// Allows to manage an arbitrary number of token rentals from an arbitrary number of holder
// contracts with only one agreement contract. The contract defines a price per time to pay
// to rent a token, which can be defined globally and per token. When starting a rental, the
// renter must tell for how long and pay upfront the total cost. If either the owner of a
// token (or their approvers) or the renter wants to cancel the rental before the planned
// duration, they have to pay a cancelation fee.
contract ERC721BundleRentAgreement is IERC721RentAgreement, ERC165 {
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

    mapping(IERC721Rent => mapping(uint256 => TokenRental)) public tokenRentals;
    uint80 public defaultRentPriceInWeiPerSecond;
    uint80 public defaultCancelationFeeInWei;

    // If the contract price is zero, it will use the default one. Same for the fee.
    constructor(uint32 _defaultRentPriceInWeiPerSecond, uint80 _defaultCancelationFeeInWei) {
        defaultRentPriceInWeiPerSecond = _defaultRentPriceInWeiPerSecond;
        defaultCancelationFeeInWei = _defaultCancelationFeeInWei;
    }

    // Called when an owner of an NFT changes or removes its NTF renting contract.
    function afterRentAgreementReplaced(uint256 tokenId) external view virtual override {
        // We don't need to check if a rental is in progress because the IERC721Rent does that for us
        // We don't allow to change the contract if funds remain, because we don't store the owner
        require(
            tokenRentals[IERC721Rent(msg.sender)][tokenId].rentToRedeemInWei == 0,
            "IERC721RentAgreement: rent has not been redeemed"
        );
    }

    // Called when an account accepts a renting contract and wants to start the location.
    function afterRentStarted(address from, uint256 tokenId) external view virtual override {
        // Make sure it was called through `payAndStartRent` to make sure the fee was paid and the state set
        require(from == address(this));
        require(tokenRentals[IERC721Rent(msg.sender)][tokenId].startTimestamp == uint40(block.timestamp));
    }

    function afterRentStopped(address, uint256 tokenId) external virtual override {
        TokenRental memory rental = tokenRentals[IERC721Rent(msg.sender)][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentAgreement: token is not rented");
        require(_isRentalFinished(rental), "IERC721RentAgreement: rental is not finished");

        rental.rentToRedeemInWei += uint96(rental.priceInWeiPerSecond) * uint96(rental.paidDurationInSecond);

        rental.startTimestamp = 0;
        rental.paidDurationInSecond = 0;
        rental.priceInWeiPerSecond = 0;
        rental.cancelationFeeInWei = 0;
        tokenRentals[IERC721Rent(msg.sender)][tokenId] = rental;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721RentAgreement).interfaceId || super.supportsInterface(interfaceId);
    }

    function payAndStartRent(
        IERC721Rent holder,
        uint256 tokenId,
        uint40 plannedRentDurationInSeconds
    ) external payable {
        require(plannedRentDurationInSeconds > 0, "IERC721RentAgreement: rental duration");

        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp == 0, "IERC721RentAgreement: token is rented");

        rental.priceInWeiPerSecond = rental.nextPriceInWeiPerSecond;
        if (rental.priceInWeiPerSecond == 0) {
            rental.priceInWeiPerSecond = defaultRentPriceInWeiPerSecond;
        }
        rental.cancelationFeeInWei = rental.nextCancelationFeeInWei;
        if (rental.cancelationFeeInWei == 0) {
            rental.cancelationFeeInWei = defaultCancelationFeeInWei;
        }

        uint96 price = uint96(rental.priceInWeiPerSecond) * uint96(plannedRentDurationInSeconds);
        require(msg.value == price, "IERC721RentAgreement: rent price not matched");

        rental.startTimestamp = uint40(block.timestamp);
        rental.paidDurationInSecond = plannedRentDurationInSeconds;
        tokenRentals[holder][tokenId] = rental;

        holder.acceptRentAgreement(msg.sender, tokenId);
    }

    function payAndCancelRent(IERC721Rent holder, uint256 tokenId) external payable {
        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentAgreement: token is not rented");
        require(!_isRentalFinished(rental), "IERC721RentAgreement: token rental can be finished");

        uint96 paid = uint96(rental.priceInWeiPerSecond) * uint96(rental.paidDurationInSecond);
        address renter = holder.ownerOf(tokenId);
        uint256 refund = 0;

        if (msg.sender == renter) {
            int256 fees = _renterCancelationFees(rental);

            if (fees > 0) {
                require(msg.value == uint256(fees), "IERC721RentAgreement: cancelation fee not matched");
                rental.rentToRedeemInWei += paid + uint96(uint256(fees));
            } else {
                require(msg.value == 0, "IERC721RentAgreement: cancelation fee not matched");
                rental.rentToRedeemInWei += paid - uint96(uint256(-fees));
                refund = uint256(-fees);
            }
        } else {
            require(
                _isOwnerOrApproved(holder, tokenId, msg.sender),
                "IERC721RentAgreement: only renter, owner or approved of token"
            );
            require(msg.value == rental.cancelationFeeInWei, "IERC721RentAgreement: cancelation fee not matched");

            uint256 durationRefund = _currentDurationRefund(rental);
            refund = durationRefund + rental.cancelationFeeInWei;
            rental.rentToRedeemInWei += paid - uint96(durationRefund);
        }

        // Early exit
        rental.paidDurationInSecond = 0;
        tokenRentals[holder][tokenId] = rental;
        holder.stopRentAgreement(tokenId);

        // Do the refund at the end to avoid reentrancy attacks
        if (refund > 0) {
            require(payable(renter).send(refund), "IERC721RentAgreement: sending ETH to renter");
        }
    }

    // Provided for convenience, can just use `stopRentAgreement` directly
    function finishRent(IERC721Rent holder, uint256 tokenId) external {
        holder.stopRentAgreement(tokenId);
    }

    // Negative value means refund
    function cancelationFeesForRenter(IERC721Rent holder, uint256 tokenId) external view returns (int256) {
        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentAgreement: token is not rented");
        require(!_isRentalFinished(rental), "IERC721RentAgreement: token rental can be finished");
        return _renterCancelationFees(rental);
    }

    function cancelationFeesForOwner(IERC721Rent holder, uint256 tokenId) external view returns (uint80) {
        TokenRental memory rental = tokenRentals[holder][tokenId];
        require(rental.startTimestamp != 0, "IERC721RentAgreement: token is not rented");
        require(!_isRentalFinished(rental), "IERC721RentAgreement: token rental can be finished");
        return rental.cancelationFeeInWei;
    }

    function redeemRent(
        IERC721Rent holder,
        uint256 tokenId,
        address payable recipient
    ) external {
        require(
            _isOwnerOrApproved(holder, tokenId, msg.sender),
            "IERC721RentAgreement: only owner or approved of token"
        );

        uint96 value = tokenRentals[holder][tokenId].rentToRedeemInWei;
        tokenRentals[holder][tokenId].rentToRedeemInWei = 0;

        require(recipient.send(value), "IERC721RentAgreement: sending ETH");
    }

    // Set price of the rental that will be applied on the next rentals for that specific token
    function setTokenPriceInWeiPerSecond(
        IERC721Rent holder,
        uint256 tokenId,
        uint80 priceInWeiPerSecond
    ) external {
        require(
            _isOwnerOrApproved(holder, tokenId, msg.sender),
            "IERC721RentAgreement: only owner or approved of token"
        );
        tokenRentals[holder][tokenId].nextPriceInWeiPerSecond = priceInWeiPerSecond;
    }

    // Set the cancelation fee that will be applied on the next rentals for that specific token
    function setTokenCancelationFeeInWei(
        IERC721Rent holder,
        uint256 tokenId,
        uint80 cancelationFeeInWei
    ) external {
        require(
            _isOwnerOrApproved(holder, tokenId, msg.sender),
            "IERC721RentAgreement: only owner or approved of token"
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
        IERC721Rent holder,
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
