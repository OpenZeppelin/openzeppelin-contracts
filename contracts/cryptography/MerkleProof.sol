pragma solidity ^0.4.24;

import "./LegacyMerkleTrees.sol";


/**
 * @title MerkleProof
 * @dev Merkle proof verification based on
 * https://github.com/ameensol/merkle-tree-solidity/blob/master/src/MerkleProof.sol
 */
library MerkleProof {
  /**
   * @dev Verifies a Merkle proof proving the existence of a leaf in a Merkle tree. Assumes that each pair of leaves
   * and each pair of pre-images are sorted.
   * @param proof Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree
   * @param root Merkle root
   * @param leafDataBlock Leaf data block of Merkle tree, before hashing
   */
  function verify(
    bytes32[] proof,
    bytes32 root,
    bytes leafDataBlock
  )
    internal
    pure
    returns (bool)
  {
    return LegacyMerkleTrees.verifyProof(root, leafDataBlock, proof);
  }
}
