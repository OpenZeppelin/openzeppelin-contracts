pragma solidity ^0.8.20;

import {Ownable2Step} from "../../openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import {Ownable} from "../../openzeppelin-contracts/contracts/access/Ownable.sol";

contract MyOwnable2Step is Ownable2Step {
    constructor() Ownable(msg.sender) {}

    function PendingOwner() public returns(address) {
        return pendingOwner();
    }

    function TransferOwnership(address newOwner) public{
        return transferOwnership(newOwner);
    }

    function AcceptOwnership() public {
        acceptOwnership();
    }
}