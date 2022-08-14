// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.TreeWithHistory;

    MerkleTree.TreeWithHistory private tree;

    constructor(uint256 _depth, uint256 _length) {
        tree.initialize(_depth, _length);
    }

    function insert(bytes32 leaf) public returns (uint256) {
        return tree.insert(leaf);
    }

    function getDepth() public view returns (uint256) {
        return tree.getDepth();
    }

    function getLength() public view returns (uint256) {
        return tree.getLength();
    }

    function getLastRoot() public view returns (bytes32) {
        return tree.getLastRoot();
    }

    function isKnownRoot(bytes32 root) public view returns (bool) {
        return tree.isKnownRoot(root);
    }

    // internal state
    function currentRootIndex() public view returns (uint256) {
        return tree.currentRootIndex;
    }

    function nextLeafIndex() public view returns (uint256) {
        return tree.nextLeafIndex;
    }

    function sides(uint256 i) public view returns (bytes32) {
        return tree.sides[i];
    }

    function zeros(uint256 i) public view returns (bytes32) {
        return tree.zeros[i];
    }

    function roots(uint256 i) public view returns (bytes32) {
        return tree.roots[i];
    }
}
