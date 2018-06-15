pragma solidity ^0.4.24;


import "../ECRecovery.sol";


contract ECRecoveryMock {
  using ECRecovery for bytes32;

  function recover(bytes32 hash, bytes sig)
    public
    pure
    returns (address)
  {
    return hash.recover(sig);
  }

  function toEthSignedMessageHash(bytes32 hash)
    public
    pure
    returns (bytes32)
  {
    return hash.toEthSignedMessageHash();
  }
}
