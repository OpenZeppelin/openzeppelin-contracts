pragma solidity ^0.4.4;

contract SecureTargetMock {
  function checkInvariant() returns(bool){
    return true;
  }
}

contract SecureTargetFactory {
  function deployContract() returns (address) {
    return new SecureTargetMock();
  }
}
