pragma solidity ^0.4.18;


import "../ECRecovery.sol";


contract ECRecoveryMock {
  using ECRecovery for bytes32;

  address public addrRecovered;

  function recover(bytes32 hash, bytes sig) public returns (address) {
    addrRecovered = hash.recover(sig);
  }

}
