// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.TreeWithHistory;

    MerkleTree.TreeWithHistory private _tree;

    constructor(uint256 _depth, uint256 _length) {
        _tree.initialize(_depth, _length);
    }

    function insert(bytes32 leaf) public returns (uint256) {
        return _tree.insert(leaf);
    }

    function getDepth() public view returns (uint256) {
        return _tree.getDepth();
    }

    function getLength() public view returns (uint256) {
        return _tree.getLength();
    }

    function getLastRoot() public view returns (bytes32) {
        return _tree.getLastRoot();
    }

    function isKnownRoot(bytes32 root) public view returns (bool) {
        return _tree.isKnownRoot(root);
    }

    // internal state
    function currentRootIndex() public view returns (uint256) {
        return _tree.currentRootIndex;
    }

    function nextLeafIndex() public view returns (uint256) {
        return _tree.nextLeafIndex;
    }

    function sides(uint256 i) public view returns (bytes32) {
        return _tree.sides[i];
    }

    function zeros(uint256 i) public view returns (bytes32) {
        return _tree.zeros[i];
    }

    function roots(uint256 i) public view returns (bytes32) {
        return _tree.roots[i];
    }
}
