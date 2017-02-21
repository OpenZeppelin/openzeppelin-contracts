pragma solidity ^0.4.8;


import {Bounty, Target} from "../../contracts/Bounty.sol";


contract InsecureTargetMock is Target {
  function checkInvariant() returns(bool){
    return false;
  }
}

contract InsecureTargetBounty is Bounty {
  function deployContract() internal returns (address) {
    return new InsecureTargetMock();
  }
}
