pragma solidity ^0.4.24;


import "../ECRecovery.sol";


contract ECRecoveryMock {
  using ECRecovery for bytes32;

  function recover(bytes32 _hash, bytes _sig)
    public
    pure
    returns (address)
  {
    return _hash.recover(_sig);
  }

  function toEthSignedMessageHash(bytes32 _hash)
    public
    pure
    returns (bytes32)
  {
    return _hash.toEthSignedMessageHash();
  }
}
