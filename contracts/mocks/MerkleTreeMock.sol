// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.TreeWithHistory;

    MerkleTree.TreeWithHistory private tree;

    constructor(uint32 _depth, uint32 _length) {
        tree.initialize(_depth, _length);
    }

    function insert(bytes32 leaf) public returns (uint32) {
        return tree.insert(leaf);
    }

    function getLastRoot() public view returns (bytes32) {
        return tree.getLastRoot();
    }

    function isKnownRoot(bytes32 root) public view returns (bool) {
        return tree.isKnownRoot(root);
    }

    // internal state
    function depth() public view returns (uint32) {
        return tree.depth;
    }

    function length() public view returns (uint32) {
        return tree.length;
    }

    function currentRootIndex() public view returns (uint32) {
        return tree.currentRootIndex;
    }

    function nextLeafIndex() public view returns (uint32) {
        return tree.nextLeafIndex;
    }

    function filledSubtrees(uint256 i) public view returns (bytes32) {
        return tree.filledSubtrees[i];
    }

    function zeros(uint256 i) public view returns (bytes32) {
        return tree.zeros[i];
    }

    function roots(uint256 i) public view returns (bytes32) {
        return tree.roots[i];
    }
}
