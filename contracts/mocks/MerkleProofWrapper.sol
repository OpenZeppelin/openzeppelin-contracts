pragma solidity ^0.4.24;

import { MerkleProof } from "../cryptography/MerkleProof.sol";


contract MerkleProofWrapper {

  function verify(
    bytes32[] _proof,
    bytes32 _root,
    bytes32 _leaf
  )
    public
    pure
    returns (bool)
  {
    return MerkleProof.verify(_proof, _root, _leaf);
  }
}
