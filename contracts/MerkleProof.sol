pragma solidity ^0.4.11;

/*
 * @title MerkleProof
 * @dev Merkle proof verification
 * @note Based on https://github.com/ameensol/merkle-tree-solidity/blob/master/src/MerkleProof.sol
 */
library MerkleProof {
  /*
   * @dev Verifies a Merkle proof proving the existence of a leaf in a Merkle tree. Assumes that each pair of leaves
   * and each pair of pre-images is sorted.
   * @param _proof Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree
   * @param _root Merkle root
   * @param _leaf Leaf of Merkle tree
   */
  function verifyProof(bytes _proof, bytes32 _root, bytes32 _leaf) constant returns (bool) {
    bytes32 proofElement;
    bytes32 computedHash = _leaf;

    for (uint256 i = 32; i <= _proof.length; i += 32) {
      assembly {
        // Load the current element of the proof
      proofElement := mload(add(_proof, i))
          }

      if (computedHash < proofElement) {
        // Hash(current computed hash + current element of the proof)
        computedHash = sha3(computedHash, proofElement);
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash = sha3(proofElement, computedHash);
      }
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash == _root;
  }
}
