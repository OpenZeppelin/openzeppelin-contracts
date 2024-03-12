pragma solidity ^0.8.20;

import {Ownable} from "../../openzeppelin-contracts/contracts/access/Ownable.sol";

contract MyOwnable is Ownable {
    constructor() Ownable(msg.sender) {

    }

    function GetOwner() public returns(address) {
        return owner();
    }

    function RenounceOwnerShip() public {
        renounceOwnership();
    }

    function TransferOwnership(address newOwner) public {
        transferOwnership(newOwner);
    }
}