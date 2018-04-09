pragma solidity ^0.4.21;


import "../ECRecovery.sol";


contract ECRecoveryMock {
  using ECRecovery for bytes32;

  address public addrRecovered;

  function recover(bytes32 hash, bytes sig) public returns (address) {
    addrRecovered = hash.recover(sig);
  }

}
