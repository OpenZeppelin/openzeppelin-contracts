pragma solidity ^0.4.24;

import "./MerkleTrees.sol";


/**
 * @title LegacyMerkleTree library
 * @dev Computation of Merkle root and verification of Merkle proof based on
 * https://github.com/ameensol/merkle-tree-solidity/blob/master/src/MerkleProof.sol
 */
library LegacyMerkleTrees {

  using MerkleTrees for MerkleTrees.TreeConfig;

  function _keccak256Leaf(bytes leafDataBlock)
    internal
    pure
    returns (bytes32)
  {
    return keccak256(leafDataBlock);
  }

  function _keccak256SortNodePair(bytes32 h1, bytes32 h2)
    internal
    pure
    returns (bytes32)
  {
    return keccak256(
      h1 < h2 ? abi.encodePacked(h1, h2) : abi.encodePacked(h2, h1)
    );
  }

  function _config() internal pure returns (MerkleTrees.TreeConfig config) {
    config._hashLeafData = _keccak256Leaf;
    config._hashNodePair = _keccak256SortNodePair;
  }

  function newTree(uint256 size)
    internal
    pure
    returns (MerkleTrees.Tree tree)
  {
    return _config().newTree(size);
  }

  function verifyProof(bytes32 root, bytes leafDataBlock, bytes32[] proof)
    internal
    pure
    returns (bool)
  {
    return _config().verifyProof(root, leafDataBlock, proof);
  }

}
