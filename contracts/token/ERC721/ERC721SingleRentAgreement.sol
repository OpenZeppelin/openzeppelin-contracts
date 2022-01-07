pragma solidity ^0.8.0;

import "../../utils/Context.sol";
import "./extensions/IERC721Rent.sol";
import "../../utils/introspection/ERC165.sol";

contract ERC721SingleRentAgreement is Context, IERC721RentAgreement, ERC165 {
    enum RentStatus {
        pending,
        active,
        finished
    }

    // Authorized renter.
    address public renter;
    address public owner;
    address public erc721Contract;
    uint256 public rentDuration;
    uint256 public expirationDate;
    uint256 public startTime;
    uint256 public rentalFees;
    bool public rentPaid;
    RentStatus public rentStatus;

    // Mapping owners address to balances;
    mapping(address => uint256) public balances;

    // ====== Events ====== //.
    event RentStatusChanged(
        address owner,
        address renter,
        uint256 tokenId,
        uint256 timestamp,
        RentStatus oldStatus,
        RentStatus newStatus
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
        rentDuration = _duration;
        expirationDate = _expirationDate;
        rentalFees = _rentalFees;
    }

    // ===== Modifiers ====== //
    modifier onlyErc721Contract() {
        require(_msgSender() == erc721Contract, "Only erc721Contract contract can modify rent agreement state");
        _;
    }

    // Called when an owner of an NFT changes or removes its NTF renting contract.
    function afterRentAgreementReplaced(uint256) public view override onlyErc721Contract {
        require(rentStatus == RentStatus.pending, "Rent agreement has to be pending to be updated");
        require(!rentPaid, "Rent already paid");
    }

    // Called when an account accepts a renting contract and wants to start the location.
    function afterRentStarted(address, uint256 tokenId) public override onlyErc721Contract {
        require(block.timestamp <= expirationDate, "rental agreement expired");
        require(renter == IERC721Rent(_msgSender()).ownerOf(tokenId), "Wrong renter.");
        require(rentStatus == RentStatus.pending, "Rent status has to be pending");
        require(rentPaid, "Rent has to be paid first");

        rentStatus = RentStatus.active;
        startTime = block.timestamp;

        // Emit an event.
        emit RentStatusChanged(owner, renter, tokenId, startTime, RentStatus.pending, RentStatus.active);
    }

    function payRent() public payable {
        require(block.timestamp <= expirationDate, "rental agreement expired");
        require(!rentPaid, "Rent already paid");
        require(_msgSender() == renter, "Renter has to pay the rental fees");
        require(msg.value == rentalFees, "Wrong rental fees amount");

        rentPaid = true;
        balances[owner] += msg.value;

        // Emit event.
        emit RentPayment(owner, renter, msg.value);
    }

    // Called when the owner or the renter wants to stop an active rent agreement.
    function afterRentStopped(address from, uint256 tokenId) public override onlyErc721Contract {
        require(rentStatus == RentStatus.active, "Rent status has to be active");
        rentStatus = RentStatus.finished;

        if (from == owner) {
            _stopRentOwner();
        } else if (from == renter) {
            _stopRentRenter();
        } else {
            revert();
        }

        // Emit an event.
        emit RentStatusChanged(owner, renter, tokenId, startTime, RentStatus.active, RentStatus.finished);
    }

    function _stopRentRenter() private {
        // Early rent termination.
        if (block.timestamp <= startTime + rentDuration) {
            uint256 _rentalPeriod = block.timestamp - startTime;
            uint256 _rentalRate = (100 * _rentalPeriod) / rentDuration;

            // Update the balances to reflect the rental period.
            balances[renter] = (rentalFees * _rentalRate) / 100;
            balances[owner] -= balances[renter];
        }
    }

    function _stopRentOwner() private view {
        // Owner can't do early rent termination.
        require(block.timestamp >= startTime + rentDuration, "Rental period not finished yet");
    }

    function redeemFunds(uint256 _value) public {
        require(rentStatus == RentStatus.finished, "Rent has to be finished to redeem funds");

        uint256 _balance = balances[_msgSender()];
        require(_value <= _balance, "Not enough funds to redeem");
        balances[_msgSender()] -= _value;

        // Check if the transfer is successful.
        require(_attemptETHTransfer(_msgSender(), _value), "ETH transfer failed");

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
        return interfaceId == type(IERC721RentAgreement).interfaceId || super.supportsInterface(interfaceId);
    }
}
