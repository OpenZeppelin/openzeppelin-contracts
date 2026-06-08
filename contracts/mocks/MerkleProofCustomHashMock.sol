// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {MerkleProof} from "../utils/cryptography/MerkleProof.sol";
import {Hashes} from "../utils/cryptography/Hashes.sol";

// This could be a library, but then we would have to add it to the Stateless.sol mock for upgradeable tests
abstract contract MerkleProofCustomHashMock {
    function hash(bytes32 a, bytes32 b) public pure virtual returns (bytes32) {
        return a < b ? sha256(abi.encode(a, b)) : sha256(abi.encode(b, a));
    }

    function verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal view returns (bool) {
        return MerkleProof.verify(proof, root, leaf, hash);
    }

    function processProof(bytes32[] calldata proof, bytes32 leaf) internal view returns (bytes32) {
        return MerkleProof.processProof(proof, leaf, hash);
    }

    function verifyCalldata(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal view returns (bool) {
        return MerkleProof.verifyCalldata(proof, root, leaf, hash);
    }

    function processProofCalldata(bytes32[] calldata proof, bytes32 leaf) internal view returns (bytes32) {
        return MerkleProof.processProofCalldata(proof, leaf, hash);
    }

    function multiProofVerify(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32 root,
        bytes32[] calldata leaves
    ) internal view returns (bool) {
        return MerkleProof.multiProofVerify(proof, proofFlags, root, leaves, hash);
    }

    function processMultiProof(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32[] calldata leaves
    ) internal view returns (bytes32) {
        return MerkleProof.processMultiProof(proof, proofFlags, leaves, hash);
    }

    function multiProofVerifyCalldata(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32 root,
        bytes32[] calldata leaves
    ) internal view returns (bool) {
        return MerkleProof.multiProofVerifyCalldata(proof, proofFlags, root, leaves, hash);
    }

    function processMultiProofCalldata(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32[] calldata leaves
    ) internal view returns (bytes32) {
        return MerkleProof.processMultiProofCalldata(proof, proofFlags, leaves, hash);
    }
}

abstract contract MerkleProofNonCommutativeHashMock is MerkleProofCustomHashMock {
    function hash(bytes32 a, bytes32 b) public pure virtual override returns (bytes32) {
        return Hashes.efficientKeccak256(a, b);
    }
}
