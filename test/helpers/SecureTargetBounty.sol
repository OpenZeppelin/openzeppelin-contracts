pragma solidity ^0.4.18;


import {Bounty, Target} from "../../contracts/Bounty.sol";


contract SecureTargetMock is Target {
  function checkInvariant() public returns(bool) {
    return true;
  }
}

contract SecureTargetBounty is Bounty {
  function deployContract() internal returns (address) {
    return new SecureTargetMock();
  }
}
