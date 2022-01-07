pragma solidity ^0.8.0;

import "../../utils/Context.sol";
import "./extensions/IERC721Rental.sol";
import "../../utils/introspection/ERC165.sol";

contract ERC721SingleRentalAgreement is Context, IERC721RentalAgreement, ERC165 {
    enum RentalStatus {
        pending,
        active,
        finished
    }

    // Authorized renter.
    address public renter;
    address public owner;
    address public erc721Contract;
    uint256 public rentalDuration;
    uint256 public expirationDate;
    uint256 public startTime;
    uint256 public rentalFees;
    bool public rentPaid;
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
        address _owner,
        address _renter,
        address _erc721Contract,
        uint256 _duration,
        uint256 _expirationDate,
        uint256 _rentalFees
    ) {
        owner = _owner;
        renter = _renter;
        erc721Contract = _erc721Contract;
        rentalDuration = _duration;
        expirationDate = _expirationDate;
        rentalFees = _rentalFees;
    }

    // ===== Modifiers ====== //
    modifier onlyErc721Contract() {
        require(
            _msgSender() == erc721Contract,
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
        require(!rentPaid, "ERC721SingleRentalAgreement: rent already paid");
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalStarted(address, uint256 tokenId) public override onlyErc721Contract {
        require(block.timestamp <= expirationDate, "ERC721SingleRentalAgreement: rental agreement expired");
        require(renter == IERC721Rental(_msgSender()).ownerOf(tokenId), "Wrong renter.");
        require(rentalStatus == RentalStatus.pending, "ERC721SingleRentalAgreement: rental status has to be pending");
        require(rentPaid, "ERC721SingleRentalAgreement: rent has to be paid first");

        rentalStatus = RentalStatus.active;
        startTime = block.timestamp;

        // Emit an event.
        emit RentalStatusChanged(owner, renter, tokenId, startTime, RentalStatus.pending, RentalStatus.active);
    }

    function payRent() public payable {
        require(block.timestamp <= expirationDate, "ERC721SingleRentalAgreement: rental agreement expired");
        require(!rentPaid, "ERC721SingleRentalAgreement: rent already paid");
        require(_msgSender() == renter, "ERC721SingleRentalAgreement: renter has to pay the rental fees");
        require(msg.value == rentalFees, "ERC721SingleRentalAgreement: wrong rental fees amount");

        rentPaid = true;
        balances[owner] += msg.value;

        // Emit event.
        emit RentPayment(owner, renter, msg.value);
    }

    /// @inheritdoc IERC721RentalAgreement
    function afterRentalStopped(address from, uint256 tokenId) public override onlyErc721Contract {
        require(rentalStatus == RentalStatus.active, "ERC721SingleRentalAgreement: rental status has to be active");
        rentalStatus = RentalStatus.finished;

        if (from == owner) {
            _stopRentalOwner();
        } else if (from == renter) {
            _stopRentalRenter();
        } else {
            revert();
        }

        // Emit an event.
        emit RentalStatusChanged(owner, renter, tokenId, startTime, RentalStatus.active, RentalStatus.finished);
    }

    function _stopRentalRenter() private {
        // Early rental termination.
        if (block.timestamp <= startTime + rentalDuration) {
            uint256 _rentalPeriod = block.timestamp - startTime;
            uint256 _rentalRate = (100 * _rentalPeriod) / rentalDuration;

            // Update the balances to reflect the rental period.
            balances[renter] = (rentalFees * _rentalRate) / 100;
            balances[owner] -= balances[renter];
        }
    }

    function _stopRentalOwner() private view {
        // Owner can't do early rent termination.
        require(
            block.timestamp >= startTime + rentalDuration,
            "ERC721SingleRentalAgreement: rental period not finished yet"
        );
    }

    function redeemFunds(uint256 _value) public {
        require(
            rentalStatus == RentalStatus.finished,
            "ERC721SingleRentalAgreement: rental has to be finished to redeem funds"
        );

        uint256 _balance = balances[_msgSender()];
        require(_value <= _balance, "ERC721SingleRentalAgreement: not enough funds to redeem");
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
