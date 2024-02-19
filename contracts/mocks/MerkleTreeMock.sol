// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleTree} from "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.TreeWithHistory;

    MerkleTree.TreeWithHistory private _tree;

    constructor(uint256 _depth, bytes32 _zero) {
        _tree.setUp(_depth, _zero);
    }

    function insert(bytes32 leaf) public returns (uint256) {
        return _tree.insert(leaf);
    }

    function getDepth() public view returns (uint256) {
        return _tree.getDepth();
    }

    function getRoot() public view returns (bytes32) {
        return _tree.getRoot();
    }

    // internal state
    function nextLeafIndex() public view returns (uint256) {
        return _tree.nextLeafIndex;
    }

    function sides(uint256 i) public view returns (bytes32) {
        return _tree.sides[i];
    }

    function zeros(uint256 i) public view returns (bytes32) {
        return _tree.zeros[i];
    }
}
