pragma solidity ^0.4.4;

import "../Bounty.sol";

contract SecureTargetMock {
  function checkInvariant() returns(bool){
    return true;
  }
}

contract SecureTargetBounty is Bounty {
  function deployContract() internal returns (address) {
    return new SecureTargetMock();
  }
}
