// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleTree} from "../utils/structs/MerkleTree.sol";

contract MerkleTreeMock {
    using MerkleTree for MerkleTree.Bytes32PushTree;

    MerkleTree.Bytes32PushTree private _tree;

    event LeafInserted(bytes32 leaf, uint256 index, bytes32 root);
    event TreeSetup(uint8 depth, bytes32 zero, bytes32 root);

    function setup(uint8 _depth, bytes32 _zero) public returns (bytes32) {
        bytes32 initialRoot = _tree.setup(_depth, _zero);
        emit TreeSetup(_depth, _zero, initialRoot);
        return initialRoot;
    }

    function push(bytes32 leaf) public returns (uint256 leafIndex, bytes32 currentRoot) {
        (leafIndex, currentRoot) = _tree.push(leaf);
        emit LeafInserted(leaf, leafIndex, currentRoot);
        return (leafIndex, currentRoot);
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
