pragma solidity ^0.4.24;

/**
 * @title Generic Merkle-tree library
 * @author Edward Grech (@dwardu)
 * @notice Functions to compute a Merkle-root and verify a Merkle-proof.
 * @dev The Merkle-tree implementation in this library may be configured
 * with arbitrary leaf/node-pair hash functions.
 */
library MerkleTrees {

  using MerkleTrees for TreeConfig;

  /**
   * @dev Holds references to the leaf/node hash functions
   * to be used to construct a Merkle tree.
   * By choosing the two functions to be different, it is possible
   * to guard against second pre-image attacks.
   * See https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack/
   * Give a TreeConfig, it is then possible to build a Merkle tree
   * to compute its root, or to verify a Merkle proof for a leaf in
   * a tree with a specific root.
   */
  struct TreeConfig {
    function(bytes memory) internal pure returns (bytes32) _hashLeafData;
    function(bytes32, bytes32) internal pure returns (bytes32) _hashNodePair;
  }

  using MerkleTrees for Tree;

  struct Tree {
    /**
     * @dev Holds references to the leaf/node hash functions
     * to be used for this tree.
     */
    TreeConfig _config;

    /**
     * @dev Used as a guard against computing the root more than once, as
     * the first computation destroys the original leaf nodes.
     */
    bytes32[] _nodes;

    /**
     * @dev Used as a guard against computing the root more than once, as
     * the first computation overwrites the original leaf nodes.
     */
    bool _wasRootComputed;
  }

  /**
   * @notice The first step towards computing a Merkle root is to allocate
   * a new tree by calling this function.
   */
  function newTree(TreeConfig self, uint256 size)
    internal
    pure
    returns (Tree tree)
  {
    assert(1 <= size);
    tree._config = self;
    tree._nodes = new bytes32[](size);
    tree._wasRootComputed = false;
  }

  /**
   * @notice After allocating a tree, this function should be called
   * with each leaf data block.
   */
  function setLeafDataBlock(Tree self, uint256 index, bytes leafDataBlock)
    internal
    pure
  {
    self._nodes[index] = self._config._hashLeafData(leafDataBlock);
  }

  /**
   * @notice Once the tree has been allocated and the leaves set,
   * this function is called to compute the Merkle root.
   * @return The Merkle root.
   */
  function computeRoot(Tree self)
    internal
    pure
    returns (bytes32 root)
  {
    assert(!self._wasRootComputed);

    uint256 nCurr = self._nodes.length;

    while (1 < nCurr) {

      // We pair and hash sibling elements in the current layer starting from
      // the left to the right, and store the hashes in the next layer.
      // If nCurr is odd, then the right-most element in current layer will
      // remain unpaired - we do not account for it in `nNext` right now, as
      // `nCurr / 2` rounds down, but we will account for it later.
      uint256 nNext = nCurr / 2;

      // Loop over all paired sibling elements
      for (uint256 iNext = 0; iNext < nNext; iNext++) {
        uint256 iCurr = iNext * 2;
        self._nodes[iNext] = self._config._hashNodePair(
          self._nodes[iCurr],
          self._nodes[iCurr + 1]
        );
      }

      // If the right-most element remained unpaired, promote it to the
      // end of the next layer, and increment nNext to account for it.
      if (nCurr % 2 == 1) {
        self._nodes[++nNext - 1] = self._nodes[nCurr - 1];
      }

      nCurr = nNext;
    }

    self._wasRootComputed = true;

    return self._nodes[0];
  }

  /**
   * @notice Verifies a Merkle proof proving the existence of a leaf data
   * block in a Merkle tree.
   * @param self The Merkle tree configuration instance.
   * @param root The root of the Merkle tree to verify the proof against.
   * @param leafDataBlock The leaf data block (unhashed) whose exitence to verify.
   * @param proof Merkle proof containing sibling hashes on the branch from
   * the leaf to the root of the Merkle tree.
   */
  function verifyProof(
    TreeConfig self,
    bytes32 root,
    bytes leafDataBlock,
    bytes32[] proof
  )
    internal
    pure
    returns (bool)
  {
    bytes32 computedHash = self._hashLeafData(leafDataBlock);

    for (uint256 i = 0; i < proof.length; i++) {
      computedHash = self._hashNodePair(computedHash, proof[i]);
    }

    return computedHash == root;
  }

}
