// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleTree} from "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.Bytes32MerkleTree;

    MerkleTree.Bytes32MerkleTree private _tree;

    event LeafInserted(bytes32 leaf, uint256 index, bytes32 root);

    function setup(uint8 _depth, bytes32 _zero) public {
        _tree.setup(_depth, _zero);
    }

    function insert(bytes32 leaf) public {
        (uint256 index, bytes32 root) = _tree.insert(leaf);
        emit LeafInserted(leaf, index, root);
    }

    function getRoot() public view returns (bytes32) {
        return _tree.getRoot();
    }

    function getDepth() public view returns (uint256) {
        return _tree.getDepth();
    }

    // internal state
    function nextLeafIndex() public view returns (uint256) {
        return _tree._nextLeafIndex;
    }

    function sides(uint256 i) public view returns (bytes32) {
        return _tree._sides[i];
    }

    function zeros(uint256 i) public view returns (bytes32) {
        return _tree._zeros[i];
    }
}
