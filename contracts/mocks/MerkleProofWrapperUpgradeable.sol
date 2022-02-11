// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/MerkleProofUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract MerkleProofWrapperUpgradeable is Initializable {
    function __MerkleProofWrapper_init() internal onlyInitializing {
    }

    function __MerkleProofWrapper_init_unchained() internal onlyInitializing {
    }
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        return MerkleProofUpgradeable.verify(proof, root, leaf);
    }

    function processProof(bytes32[] memory proof, bytes32 leaf) public pure returns (bytes32) {
        return MerkleProofUpgradeable.processProof(proof, leaf);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
