pragma solidity ^0.4.24;

import "./MerkleTrees.sol";

/**
 * @title SecondPreimageResistantMerkleTrees library
 * @dev Computation of Merkle root and verification of Merkle proof based on
 * a Merkle tree implementation that uses different hash functions for leaf
 * data blocks and node hash pairs, in order to give
 * second preimage resistance.
 * The implementation is similar to that described in the
 * Certificate Transparency RFC
 * (see https://tools.ietf.org/html/rfc6962#section-2.1), in that it
 * prepends 0x00 and 0x01 to leaves and nodes respectively, but differs
 * in that it uses keccak256 instead of sha256, and sorts
 * node hash pairs before hashing.
 */
library SecondPreimageResistantMerkleTrees {

  using MerkleTrees for MerkleTrees.TreeConfig;

  function _keccak256Prepend00Leaf(bytes leafDataBlock)
    internal
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(bytes1(0x00), leafDataBlock));
  }

  function _keccak256Prepend01SortNodePair(bytes32 h1, bytes32 h2)
    internal
    pure
    returns (bytes32)
  {
    return keccak256(
      h1 < h2
        ? abi.encodePacked(bytes1(0x01), h1, h2)
        : abi.encodePacked(bytes1(0x01), h2, h1)
    );
  }

  function _config() internal pure returns (MerkleTrees.TreeConfig config) {
    config._hashLeafData = _keccak256Prepend00Leaf;
    config._hashNodePair = _keccak256Prepend01SortNodePair;
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
