// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleProof} from "../utils/cryptography/MerkleProof.sol";

contract MerkleProofCustomCommutativeHashMock {
    using MerkleProof for *;

    function $verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) public view returns (bool) {
        return proof.verify(root, leaf, _commutativeCustom);
    }

    function $verifyCalldata(bytes32[] calldata proof, bytes32 root, bytes32 leaf) public view returns (bool) {
        return proof.verifyCalldata(root, leaf, _commutativeCustom);
    }

    function $multiProofVerify(
        bytes32[] memory proof,
        bool[] memory proofFlags,
        bytes32 root,
        bytes32[] memory leaves
    ) public view returns (bool) {
        return proof.multiProofVerify(proofFlags, root, leaves, _commutativeCustom);
    }

    function $multiProofVerifyCalldata(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32 root,
        bytes32[] calldata leaves
    ) public view returns (bool) {
        return proof.multiProofVerifyCalldata(proofFlags, root, leaves, _commutativeCustom);
    }

    function $processProof(bytes32[] memory proof, bytes32 leaf) public view returns (bytes32) {
        return proof.processProof(leaf, _commutativeCustom);
    }

    function $processProofCalldata(bytes32[] calldata proof, bytes32 leaf) public view returns (bytes32) {
        return proof.processProofCalldata(leaf, _commutativeCustom);
    }

    function $processMultiProof(
        bytes32[] memory proof,
        bool[] memory proofFlags,
        bytes32[] memory leaves
    ) public view returns (bytes32 merkleRoot) {
        return proof.processMultiProof(proofFlags, leaves, _commutativeCustom);
    }

    function $processMultiProofCalldata(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32[] calldata leaves
    ) public view returns (bytes32 merkleRoot) {
        return proof.processMultiProofCalldata(proofFlags, leaves, _commutativeCustom);
    }

    function _commutativeCustom(bytes32 a, bytes32 b) private pure returns (bytes32) {
        // TODO: Change this to a custom commutative hash function different to keccak256
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }
}
