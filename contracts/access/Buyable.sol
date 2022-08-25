// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Ownable.sol";

abstract contract Buyable is Ownable {
    address private _originalOwner;

    bool public isForSale;

    uint256 public priceOfContract;
    uint256 public FEE_PCT;

    /**
     * @dev Initializes the contract setting the deployer as the original owner.
     */
    constructor() {
        _originalOwner = _msgSender();
    }

    modifier originalOwner {
        require(_originalOwner == _msgSender(), "Buyable: Caller is not original owner");
        _;
    }

    /**
     * @dev Makes ownership of contract purchasable 
     * price is in Wei => 1 * 10^-18 ETH
     */
    function sellContract(uint256 _priceOfContract) public onlyOwner {
        require(_priceOfContract >= 1000000000000, "Buyable: Proposed price is too low");
        isForSale = true;
        priceOfContract = _priceOfContract;
    }

    /**
     * @dev Ends sale of ownership, makes contract not purchasable
     */
    function endSale() public onlyOwner {
        isForSale = false;
    }

    /**
     * @dev Results in transfer of ownership, if conditions are met 
     * will always transfer a royalty to _originalOwner
     */
    function buyContract() public payable {
        require(isForSale, "Buyable: Contract not for sale");
        require(msg.value == priceOfContract, "Buyable: invalid amount sent");

        isForSale = false;
        priceOfContract = 0;

        uint256 fee = (msg.value / 100) * FEE_PCT;

        (bool success,) = owner().call{value: msg.value - fee}("");
        require(success, 'Transfer fail');

        (bool success2,) = _originalOwner.call{value: fee}("");
        require(success2, 'Transfer fail');

        _transferOwnership(_msgSender());
    }

    /**
     * @dev Sets percentage fee to charge for all future contract sales
     * fee goes to _originalOwner
     * must be an integer from 0 to 10 
     */
    function setFee(uint256 _feepct) public originalOwner {
        require(_feepct <= 10, "Buyable: Fee percentage exceeds upper limit");
        FEE_PCT = _feepct;
    }
}