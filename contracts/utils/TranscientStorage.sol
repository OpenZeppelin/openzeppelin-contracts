// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/TranscientStorage.js.

pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing transcient storage.
 *
 * Note: This library only works on networks where EIP-1153 is available.
 */
library TranscientStorage {
    /**
     * @dev Returns the transcient slot `slot` as a `address`.
     */
    function loadAddress(bytes32 slot) internal view returns (address r) {
        /// @solidity memory-safe-assembly
        assembly {
            r := tload(slot)
        }
    }

    /**
     * @dev Returns the transcient slot `slot` as a `bool`.
     */
    function loadBool(bytes32 slot) internal view returns (bool r) {
        /// @solidity memory-safe-assembly
        assembly {
            r := tload(slot)
        }
    }

    /**
     * @dev Returns the transcient slot `slot` as a `bytes32`.
     */
    function loadBytes32(bytes32 slot) internal view returns (bytes32 r) {
        /// @solidity memory-safe-assembly
        assembly {
            r := tload(slot)
        }
    }

    /**
     * @dev Returns the transcient slot `slot` as a `uint256`.
     */
    function loadUint256(bytes32 slot) internal view returns (uint256 r) {
        /// @solidity memory-safe-assembly
        assembly {
            r := tload(slot)
        }
    }

    /**
     * @dev Store `value` in the transcient slot `store`.
     */
    function store(bytes32 slot, address value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transcient slot `store`.
     */
    function store(bytes32 slot, bool value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transcient slot `store`.
     */
    function store(bytes32 slot, bytes32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transcient slot `store`.
     */
    function store(bytes32 slot, uint256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }
}
