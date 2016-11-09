pragma solidity ^0.4.4;

import "../Bounty.sol";

contract InsecureTargetMock {
  function checkInvariant() returns(bool){
    return false;
  }
}

contract InsecureTargetBounty is Bounty {
  function deployContract() internal returns (address) {
    return new InsecureTargetMock();
  }
}
