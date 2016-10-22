pragma solidity ^0.4.0;

contract InsecureTargetMock {
  function checkInvarient() returns(bool){
    return false;
  }
}
