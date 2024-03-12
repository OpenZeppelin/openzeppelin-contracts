// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleTree} from "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.Bytes32PushTree;

    MerkleTree.Bytes32PushTree private _tree;

    // This mock only stored the latest root.
    // Production contract may want to store historical values.
    bytes32 public root;

    event LeafInserted(bytes32 leaf, uint256 index, bytes32 root);

    function setup(uint8 _depth, bytes32 _zero) public {
        root = _tree.setup(_depth, _zero);
    }

    function push(bytes32 leaf) public {
        (uint256 leafIndex, bytes32 currentRoot) = _tree.push(leaf);
        emit LeafInserted(leaf, leafIndex, currentRoot);
        root = currentRoot;
    }

    function depth() public view returns (uint256) {
        return _tree.depth();
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
