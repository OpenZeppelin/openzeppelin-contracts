pragma solidity ^0.4.11;

import '../../contracts/MerkleProof.sol';

contract MerkleProofMock {

  bool public result;

  function verifyProof(bytes _proof, bytes32 _root, bytes32 _leaf) {
    result = MerkleProof.verifyProof(_proof, _root, _leaf);
  }
}
