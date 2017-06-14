pragma solidity ^0.4.11;


import '../../contracts/ECRecovery.sol';


contract ECRecoveryMock {

  bool public result;
  address public signer;

  function safeRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) {
    (result, signer) = ECRecovery.safeRecover(hash, v, r, s);
  }

  function recover(bytes32 hash, bytes sig) {
    signer = ECRecovery.recover(hash, sig);
  }

}
