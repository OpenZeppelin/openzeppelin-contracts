pragma solidity ^0.8.0;

import "../../utils/Context.sol";
import "./extensions/IERC721Rental.sol";
import "../../utils/introspection/ERC165.sol";

/// @title ERC721 simple rental agreement.
/// Define a simple rental agreement following the principles:
///   - The rental is valid for a fixed period. The rental period has to be over to finish the rental.
///   - The rental has an expiration date: after this date it cannot be started.
///   - Anybody (except the owner) can pay & start the rent and becomes the renter.
///   - The rental can be started only once.
///   - The rent has to be paid by the renter to the original owner.
///   - The contract exposes a function redeemFunds for the original owner and the renter to redeem their funds.
contract ERC721SingleRentalAgreement is Context, IERC721RentalAgreement, ERC165 {
    enum RentalStatus {
        pending,
        active,
        finished
    }

    address public owner;
    address public renter;
    IERC721Rental public erc721Contract;
    uint256 public tokenId;
    uint256 public rentalFees;
    uint40 public rentalDuration;
    uint40 public expirationDate;
    uint40 public startTime;
    RentalStatus public rentalStatus;

    // Mapping owners address to balances;
    mapping(address => uint256) public balances;

    // ====== Events ====== //.
    event RentalStatusChanged(
        address owner,
        address renter,
        uint256 tokenId,
        uint256 timestamp,
        RentalStatus oldStatus,
        RentalStatus newStatus
    );

    event RentPayment(address owner, address renter, uint256 amount);
    event FundsRedeemed(address redeemer, uint256 amount, uint256 remainingBalance);

    constructor(
        IERC721Rental _erc721Contract,
        uint256 _tokenId,
        uint40 _duration,
        uint40 _expirationDate,
        uint256 _rentalFees
    ) {
        // Original owner.
        address rentedOwnerOf = _erc721Contract.rentedOwnerOf(_tokenId);
        if (rentedOwnerOf != address(0)) {
            owner = rentedOwnerOf;
        } else {
            owner = _erc721Contract.ownerOf(_tokenId);
        }

        erc721Contract = _erc721Contract;
        tokenId = _tokenId;
        rentalDuration = _duration;
        expirationDate = _expirationDate;
        rentalFees = _rentalFees;
    }

    // ===== Modifiers ====== //
    modifier onlyErc721Contract() {
        require(
            _msgSender() == address(erc721Contract),
            "ERC721SingleRentalAgreement: only erc721Contract contract can modify rental agreement state"
        );
        _;
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalAgreementReplaced(uint256) public view override onlyErc721Contract {
        require(
            rentalStatus == RentalStatus.pending,
            "ERC721SingleRentalAgreement: rental agreement has to be pending to be updated."
        );
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalStarted(address from, uint256) public view override {
        require(from == address(this));
    }

    /// Enables the caller to pay and start the rent, and become the renter.
    function payAndStartRent() public payable {
        require(rentalStatus == RentalStatus.pending, "ERC721SingleRentalAgreement: rental status has to be pending");
        require(block.timestamp <= expirationDate, "ERC721SingleRentalAgreement: rental agreement expired");
        require(msg.value >= rentalFees, "ERC721SingleRentalAgreement: rental fees amount too low");

        // Start rental.
        rentalStatus = RentalStatus.active;
        renter = _msgSender();
        balances[owner] += rentalFees;
        // Hold the exceeded funds so it can be redeem later by the renter.
        balances[renter] = msg.value - rentalFees;
        startTime = uint40(block.timestamp);

        // Accept rental agreement between owner and msg sender.
        erc721Contract.acceptRentalAgreement(renter, tokenId);

        // Emit event.
        emit RentPayment(owner, renter, msg.value);
        emit RentalStatusChanged(owner, renter, tokenId, startTime, RentalStatus.pending, RentalStatus.active);
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalStopped(address from, uint256 tknId) public override onlyErc721Contract {
        require(tknId == tokenId, "ERC721SingleRentalAgreement: invalid token id");
        require(rentalStatus == RentalStatus.active, "ERC721SingleRentalAgreement: rental status has to be active");
        require(
            block.timestamp >= startTime + rentalDuration,
            "ERC721SingleRentalAgreement: rental period not finished yet"
        );

        // Only original owner, approver, operator or renter can finish the rental.
        require(
            from == owner ||
                from == erc721Contract.getApproved(tokenId) ||
                erc721Contract.isApprovedForAll(owner, from) ||
                from == renter,
            "ERC721SingleRentalAgreement: only owner, approver or renter can finish rent"
        );

        // Update rental status.
        rentalStatus = RentalStatus.finished;

        // Emit an RentalStatusChanged event.
        emit RentalStatusChanged(owner, renter, tokenId, startTime, RentalStatus.active, RentalStatus.finished);
    }

    /// Enable renter and owner to redeem their balances.
    function redeemFunds(uint256 _value) public {
        require(_value <= balances[_msgSender()], "ERC721SingleRentalAgreement: not enough funds to redeem");

        // Owner can redeem funds once the rental agreement is finished.
        // Renter can redeem their exceeded balance anytime in case of he overpaid the rent.
        if (_msgSender() == owner) {
            require(
                rentalStatus == RentalStatus.finished,
                "ERC721SingleRentalAgreement: rental has to be finished to redeem funds"
            );
        }

        balances[_msgSender()] -= _value;

        // Check if the transfer is successful.
        require(_attemptETHTransfer(_msgSender(), _value), "ERC721SingleRentalAgreement: ETH transfer failed");

        // Emit an event.
        emit FundsRedeemed(_msgSender(), _value, balances[_msgSender()]);
    }

    function _attemptETHTransfer(address _to, uint256 _value) internal returns (bool) {
        // Here increase the gas limit a reasonable amount above the default, and try
        // to send ETH to the recipient.
        // NOTE: This might allow the recipient to attempt a limited reentrancy attack.
        (bool success, ) = _to.call{value: _value, gas: 30000}("");
        return success;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721RentalAgreement).interfaceId || super.supportsInterface(interfaceId);
    }
}
