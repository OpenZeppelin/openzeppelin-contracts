pragma solidity ^0.4.24;

import { MerkleProof } from "../cryptography/MerkleProof.sol";


contract MerkleProofWrapper {

  function verifyProof(
    bytes32[] proof,
    bytes32 root,
    bytes32 leaf
  )
    public
    pure
    returns (bool)
  {
    return MerkleProof.verifyProof(proof, root, leaf);
  }
}
