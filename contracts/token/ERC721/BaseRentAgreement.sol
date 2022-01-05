pragma solidity ^0.8.0;

import "./extensions/IERC721Rent.sol";

contract BaseRentAgreement {
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
    mapping(address => uint256) private _balances;

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
        address _renter,
        address _erc721Contract,
        uint256 _duration,
        uint256 _expirationDate,
        uint256 _rentalFees
    ) {
        owner = msg.sender;
        renter = _renter;
        erc721Contract = _erc721Contract;
        rentDuration = _duration;
        expirationDate = _expirationDate;
        rentalFees = _rentalFees;
    }

    // ===== Modifiers ====== //
    modifier onlyErc721Contract() {
        require(msg.sender == erc721Contract, "Only erc721Contract contract can modify rent agreement state");
        _;
    }

    // Called when an owner of an NFT changes or removes its NTF renting contract.
    function onChangeAgreement(int256) public view onlyErc721Contract {
        require(rentStatus == RentStatus.pending, "Rent agreement has to be pending to be updated.");
        require(!rentPaid, "Rent already paid");
    }

    // Called when an account accepts a renting contract and wants to start the location.
    function onStartRent(uint256 tokenId, address tokenRenter) public onlyErc721Contract {
        require(renter == tokenRenter, "Wrong renter.");
        require(rentStatus == RentStatus.pending, "Rent status has to be pending.");
        require(rentPaid, "Rent has to be paid first.");
        require(block.timestamp <= expirationDate, "rental agreement expired.");

        rentStatus = RentStatus.active;
        startTime = block.timestamp;

        // Emit an event.
        emit RentStatusChanged(owner, tokenRenter, tokenId, startTime, RentStatus.pending, RentStatus.active);
    }

    function payRent() public payable {
        require(msg.sender == renter, "Renter has to pay the rental fees.");
        require(msg.value == rentalFees, "Wrong rental fees amount.");
        require(!rentPaid, "Rent already paid.");

        rentPaid = true;
        _balances[owner] += msg.value;

        // Emit event.
        emit RentPayment(owner, renter, msg.value);
    }

    // Called when the owner or the renter wants to stop an active rent agreement.
    function onStopRent(uint256 tokenId) public onlyErc721Contract {
        require(rentStatus == RentStatus.active, "Rent status has to be active");
        rentStatus = RentStatus.finished;

        //if (role == RentingRole.Renter) {
        _stopRentRenter();
        //} else {
        _stopRentOwner();
        //}

        // Emit an event.
        emit RentStatusChanged(owner, renter, tokenId, startTime, RentStatus.active, RentStatus.finished);
    }

    function _stopRentRenter() private {
        // Early rent termination.
        if (startTime + rentDuration >= block.timestamp) {
            uint256 _rentalPeriod = block.timestamp - startTime;
            uint256 _newRentalFees = _rentalPeriod / rentDuration;

            // Update the balances to reflect the rental period.
            _balances[renter] = rentalFees - _newRentalFees;
            _balances[owner] = _newRentalFees;
        }
    }

    function _stopRentOwner() private view {
        // Owner can't do early rent termination.
        require(startTime + rentDuration <= block.timestamp, "Rental period not finished yet");
    }

    function redeemFunds(uint256 _value) public {
        require(rentStatus == RentStatus.finished, "Rent has to be finished to redeem funds");

        uint256 _balance = _balances[msg.sender];
        require(_value <= _balance, "Not enough funds to redeem");
        _balances[msg.sender] -= _value;

        // Check if the transfer is successful.
        require(_attemptETHTransfer(msg.sender, _value), "ETH transfer failed");

        // Emit an event.
        emit FundsRedeemed(msg.sender, _value, _balances[msg.sender]);
    }

    function _attemptETHTransfer(address _to, uint256 _value) internal returns (bool) {
        // Here increase the gas limit a reasonable amount above the default, and try
        // to send ETH to the recipient.
        // NOTE: This might allow the recipient to attempt a limited reentrancy attack.
        (bool success, ) = _to.call{value: _value, gas: 30000}("");
        return success;
    }
}
