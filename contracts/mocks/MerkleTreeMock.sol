// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Hashes} from "../utils/cryptography/Hashes.sol";
import {MerkleTree} from "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.Bytes32PushTree;

    MerkleTree.Bytes32PushTree private _tree;

    // This mock only stored the latest root.
    // Production contract may want to store historical values.
    bytes32 public root;

    event LeafInserted(bytes32 leaf, uint256 index, bytes32 root);
    event LeafUpdated(bytes32 oldLeaf, bytes32 newLeaf, uint256 index, bytes32 root);

    function setup(uint8 _depth, bytes32 _zero) public {
        root = _tree.setup(_depth, _zero);
    }

    function push(bytes32 leaf) public {
        (uint256 leafIndex, bytes32 currentRoot) = _tree.push(leaf);
        emit LeafInserted(leaf, leafIndex, currentRoot);
        root = currentRoot;
    }

    function update(bytes32 oldLeaf, bytes32 newLeaf, uint256 index, bytes32[] memory proof) public {
        (bytes32 oldRoot, bytes32 newRoot) = _tree.update(index, oldLeaf, newLeaf, proof);
        require(oldRoot == root, "Invalid old root");
        emit LeafUpdated(oldLeaf, newLeaf, index, newRoot);
        root = newRoot;
    }

    function depth() public view returns (uint256) {
        return _tree.depth();
    }

    function nextLeafIndex() public view returns (uint256) {
        return _tree._nextLeafIndex;
    }

    // Non-commutative hashing variants using Hashes.efficientKeccak256.
    // efficientKeccak256(a, b) = keccak256(abi.encode(a, b)) — NOT sorted,
    // so H(a,b) != H(b,a). This allows testing that MerkleTree correctly
    // preserves insertion order when a non-commutative hash function is used.

    function setupNonCommutative(uint8 _depth, bytes32 _zero) public {
        root = _tree.setup(_depth, _zero, Hashes.efficientKeccak256);
    }

    function pushNonCommutative(bytes32 leaf) public {
        (uint256 leafIndex, bytes32 currentRoot) = _tree.push(leaf, Hashes.efficientKeccak256);
        emit LeafInserted(leaf, leafIndex, currentRoot);
        root = currentRoot;
    }
}
