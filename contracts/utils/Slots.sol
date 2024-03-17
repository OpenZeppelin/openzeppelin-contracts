// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Slots.js.

pragma solidity ^0.8.24;

/**
 * @dev Library for derivating, reading and writing to storage slots. This supports both "normal" and transient storage.
 *
 * Note: Transient storage operations (`tload` and `tstore`) only works on networks where EIP-1153[https://eips.ethereum.org/EIPS/eip-1153] is available.
 */
library Slots {
    /**
     * @dev Add an offset to a slot to get the n-th element of a structure or an array.
     */
    function offset(bytes32 slot, uint256 pos) internal pure returns (bytes32 result) {
        unchecked {
            return bytes32(uint256(slot) + pos);
        }
    }

    /**
     * @dev Derivate the location of the first element in an array from the slot where the length is stored.
     */
    function derivateArray(bytes32 slot) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, slot)
            result := keccak256(0x00, 0x20)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bool key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, address key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes1 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes2 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes3 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes4 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes5 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes6 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes7 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes8 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes9 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes10 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes11 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes12 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes13 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes14 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes15 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes16 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes17 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes18 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes19 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes20 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes21 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes22 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes23 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes24 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes25 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes26 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes27 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes28 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes29 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes30 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes31 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, bytes32 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint8 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint16 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint24 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint32 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint40 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint48 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint56 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint64 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint72 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint80 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint88 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint96 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint104 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint112 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint120 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint128 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint136 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint144 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint152 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint160 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint168 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint176 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint184 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint192 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint200 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint208 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint216 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint224 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint232 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint240 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint248 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, uint256 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int8 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int16 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int24 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int32 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int40 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int48 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int56 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int64 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int72 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int80 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int88 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int96 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int104 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int112 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int120 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int128 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int136 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int144 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int152 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int160 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int168 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int176 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int184 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int192 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int200 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int208 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int216 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int224 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int232 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int240 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int248 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev Derivate the location of a mapping element from the key.
     */
    function derivateMapping(bytes32 slot, int256 key) internal pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, key)
            mstore(0x20, slot)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bool.
     */
    type BoolSlot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a BoolSlot.
     */
    function asBoolSlot(bytes32 slot) internal pure returns (BoolSlot) {
        return BoolSlot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(BoolSlot slot) internal view returns (bool value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(BoolSlot slot, bool value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(BoolSlot slot) internal view returns (bool value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(BoolSlot slot, bool value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a address.
     */
    type AddressSlot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a AddressSlot.
     */
    function asAddressSlot(bytes32 slot) internal pure returns (AddressSlot) {
        return AddressSlot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(AddressSlot slot) internal view returns (address value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(AddressSlot slot, address value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(AddressSlot slot) internal view returns (address value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(AddressSlot slot, address value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes1.
     */
    type Bytes1Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes1Slot.
     */
    function asBytes1Slot(bytes32 slot) internal pure returns (Bytes1Slot) {
        return Bytes1Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes1Slot slot) internal view returns (bytes1 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes1Slot slot, bytes1 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes1Slot slot) internal view returns (bytes1 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes1Slot slot, bytes1 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes2.
     */
    type Bytes2Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes2Slot.
     */
    function asBytes2Slot(bytes32 slot) internal pure returns (Bytes2Slot) {
        return Bytes2Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes2Slot slot) internal view returns (bytes2 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes2Slot slot, bytes2 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes2Slot slot) internal view returns (bytes2 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes2Slot slot, bytes2 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes3.
     */
    type Bytes3Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes3Slot.
     */
    function asBytes3Slot(bytes32 slot) internal pure returns (Bytes3Slot) {
        return Bytes3Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes3Slot slot) internal view returns (bytes3 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes3Slot slot, bytes3 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes3Slot slot) internal view returns (bytes3 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes3Slot slot, bytes3 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes4.
     */
    type Bytes4Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes4Slot.
     */
    function asBytes4Slot(bytes32 slot) internal pure returns (Bytes4Slot) {
        return Bytes4Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes4Slot slot) internal view returns (bytes4 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes4Slot slot, bytes4 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes4Slot slot) internal view returns (bytes4 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes4Slot slot, bytes4 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes5.
     */
    type Bytes5Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes5Slot.
     */
    function asBytes5Slot(bytes32 slot) internal pure returns (Bytes5Slot) {
        return Bytes5Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes5Slot slot) internal view returns (bytes5 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes5Slot slot, bytes5 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes5Slot slot) internal view returns (bytes5 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes5Slot slot, bytes5 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes6.
     */
    type Bytes6Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes6Slot.
     */
    function asBytes6Slot(bytes32 slot) internal pure returns (Bytes6Slot) {
        return Bytes6Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes6Slot slot) internal view returns (bytes6 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes6Slot slot, bytes6 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes6Slot slot) internal view returns (bytes6 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes6Slot slot, bytes6 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes7.
     */
    type Bytes7Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes7Slot.
     */
    function asBytes7Slot(bytes32 slot) internal pure returns (Bytes7Slot) {
        return Bytes7Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes7Slot slot) internal view returns (bytes7 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes7Slot slot, bytes7 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes7Slot slot) internal view returns (bytes7 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes7Slot slot, bytes7 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes8.
     */
    type Bytes8Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes8Slot.
     */
    function asBytes8Slot(bytes32 slot) internal pure returns (Bytes8Slot) {
        return Bytes8Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes8Slot slot) internal view returns (bytes8 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes8Slot slot, bytes8 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes8Slot slot) internal view returns (bytes8 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes8Slot slot, bytes8 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes9.
     */
    type Bytes9Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes9Slot.
     */
    function asBytes9Slot(bytes32 slot) internal pure returns (Bytes9Slot) {
        return Bytes9Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes9Slot slot) internal view returns (bytes9 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes9Slot slot, bytes9 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes9Slot slot) internal view returns (bytes9 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes9Slot slot, bytes9 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes10.
     */
    type Bytes10Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes10Slot.
     */
    function asBytes10Slot(bytes32 slot) internal pure returns (Bytes10Slot) {
        return Bytes10Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes10Slot slot) internal view returns (bytes10 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes10Slot slot, bytes10 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes10Slot slot) internal view returns (bytes10 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes10Slot slot, bytes10 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes11.
     */
    type Bytes11Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes11Slot.
     */
    function asBytes11Slot(bytes32 slot) internal pure returns (Bytes11Slot) {
        return Bytes11Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes11Slot slot) internal view returns (bytes11 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes11Slot slot, bytes11 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes11Slot slot) internal view returns (bytes11 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes11Slot slot, bytes11 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes12.
     */
    type Bytes12Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes12Slot.
     */
    function asBytes12Slot(bytes32 slot) internal pure returns (Bytes12Slot) {
        return Bytes12Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes12Slot slot) internal view returns (bytes12 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes12Slot slot, bytes12 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes12Slot slot) internal view returns (bytes12 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes12Slot slot, bytes12 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes13.
     */
    type Bytes13Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes13Slot.
     */
    function asBytes13Slot(bytes32 slot) internal pure returns (Bytes13Slot) {
        return Bytes13Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes13Slot slot) internal view returns (bytes13 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes13Slot slot, bytes13 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes13Slot slot) internal view returns (bytes13 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes13Slot slot, bytes13 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes14.
     */
    type Bytes14Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes14Slot.
     */
    function asBytes14Slot(bytes32 slot) internal pure returns (Bytes14Slot) {
        return Bytes14Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes14Slot slot) internal view returns (bytes14 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes14Slot slot, bytes14 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes14Slot slot) internal view returns (bytes14 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes14Slot slot, bytes14 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes15.
     */
    type Bytes15Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes15Slot.
     */
    function asBytes15Slot(bytes32 slot) internal pure returns (Bytes15Slot) {
        return Bytes15Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes15Slot slot) internal view returns (bytes15 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes15Slot slot, bytes15 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes15Slot slot) internal view returns (bytes15 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes15Slot slot, bytes15 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes16.
     */
    type Bytes16Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes16Slot.
     */
    function asBytes16Slot(bytes32 slot) internal pure returns (Bytes16Slot) {
        return Bytes16Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes16Slot slot) internal view returns (bytes16 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes16Slot slot, bytes16 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes16Slot slot) internal view returns (bytes16 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes16Slot slot, bytes16 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes17.
     */
    type Bytes17Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes17Slot.
     */
    function asBytes17Slot(bytes32 slot) internal pure returns (Bytes17Slot) {
        return Bytes17Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes17Slot slot) internal view returns (bytes17 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes17Slot slot, bytes17 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes17Slot slot) internal view returns (bytes17 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes17Slot slot, bytes17 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes18.
     */
    type Bytes18Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes18Slot.
     */
    function asBytes18Slot(bytes32 slot) internal pure returns (Bytes18Slot) {
        return Bytes18Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes18Slot slot) internal view returns (bytes18 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes18Slot slot, bytes18 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes18Slot slot) internal view returns (bytes18 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes18Slot slot, bytes18 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes19.
     */
    type Bytes19Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes19Slot.
     */
    function asBytes19Slot(bytes32 slot) internal pure returns (Bytes19Slot) {
        return Bytes19Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes19Slot slot) internal view returns (bytes19 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes19Slot slot, bytes19 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes19Slot slot) internal view returns (bytes19 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes19Slot slot, bytes19 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes20.
     */
    type Bytes20Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes20Slot.
     */
    function asBytes20Slot(bytes32 slot) internal pure returns (Bytes20Slot) {
        return Bytes20Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes20Slot slot) internal view returns (bytes20 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes20Slot slot, bytes20 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes20Slot slot) internal view returns (bytes20 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes20Slot slot, bytes20 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes21.
     */
    type Bytes21Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes21Slot.
     */
    function asBytes21Slot(bytes32 slot) internal pure returns (Bytes21Slot) {
        return Bytes21Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes21Slot slot) internal view returns (bytes21 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes21Slot slot, bytes21 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes21Slot slot) internal view returns (bytes21 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes21Slot slot, bytes21 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes22.
     */
    type Bytes22Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes22Slot.
     */
    function asBytes22Slot(bytes32 slot) internal pure returns (Bytes22Slot) {
        return Bytes22Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes22Slot slot) internal view returns (bytes22 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes22Slot slot, bytes22 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes22Slot slot) internal view returns (bytes22 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes22Slot slot, bytes22 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes23.
     */
    type Bytes23Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes23Slot.
     */
    function asBytes23Slot(bytes32 slot) internal pure returns (Bytes23Slot) {
        return Bytes23Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes23Slot slot) internal view returns (bytes23 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes23Slot slot, bytes23 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes23Slot slot) internal view returns (bytes23 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes23Slot slot, bytes23 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes24.
     */
    type Bytes24Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes24Slot.
     */
    function asBytes24Slot(bytes32 slot) internal pure returns (Bytes24Slot) {
        return Bytes24Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes24Slot slot) internal view returns (bytes24 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes24Slot slot, bytes24 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes24Slot slot) internal view returns (bytes24 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes24Slot slot, bytes24 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes25.
     */
    type Bytes25Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes25Slot.
     */
    function asBytes25Slot(bytes32 slot) internal pure returns (Bytes25Slot) {
        return Bytes25Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes25Slot slot) internal view returns (bytes25 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes25Slot slot, bytes25 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes25Slot slot) internal view returns (bytes25 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes25Slot slot, bytes25 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes26.
     */
    type Bytes26Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes26Slot.
     */
    function asBytes26Slot(bytes32 slot) internal pure returns (Bytes26Slot) {
        return Bytes26Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes26Slot slot) internal view returns (bytes26 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes26Slot slot, bytes26 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes26Slot slot) internal view returns (bytes26 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes26Slot slot, bytes26 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes27.
     */
    type Bytes27Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes27Slot.
     */
    function asBytes27Slot(bytes32 slot) internal pure returns (Bytes27Slot) {
        return Bytes27Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes27Slot slot) internal view returns (bytes27 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes27Slot slot, bytes27 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes27Slot slot) internal view returns (bytes27 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes27Slot slot, bytes27 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes28.
     */
    type Bytes28Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes28Slot.
     */
    function asBytes28Slot(bytes32 slot) internal pure returns (Bytes28Slot) {
        return Bytes28Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes28Slot slot) internal view returns (bytes28 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes28Slot slot, bytes28 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes28Slot slot) internal view returns (bytes28 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes28Slot slot, bytes28 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes29.
     */
    type Bytes29Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes29Slot.
     */
    function asBytes29Slot(bytes32 slot) internal pure returns (Bytes29Slot) {
        return Bytes29Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes29Slot slot) internal view returns (bytes29 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes29Slot slot, bytes29 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes29Slot slot) internal view returns (bytes29 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes29Slot slot, bytes29 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes30.
     */
    type Bytes30Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes30Slot.
     */
    function asBytes30Slot(bytes32 slot) internal pure returns (Bytes30Slot) {
        return Bytes30Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes30Slot slot) internal view returns (bytes30 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes30Slot slot, bytes30 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes30Slot slot) internal view returns (bytes30 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes30Slot slot, bytes30 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes31.
     */
    type Bytes31Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes31Slot.
     */
    function asBytes31Slot(bytes32 slot) internal pure returns (Bytes31Slot) {
        return Bytes31Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes31Slot slot) internal view returns (bytes31 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes31Slot slot, bytes31 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes31Slot slot) internal view returns (bytes31 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes31Slot slot, bytes31 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes32.
     */
    type Bytes32Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes32Slot.
     */
    function asBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot) {
        return Bytes32Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Bytes32Slot slot) internal view returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Bytes32Slot slot, bytes32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes32Slot slot) internal view returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes32Slot slot, bytes32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint8.
     */
    type Uint8Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint8Slot.
     */
    function asUint8Slot(bytes32 slot) internal pure returns (Uint8Slot) {
        return Uint8Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint8Slot slot) internal view returns (uint8 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint8Slot slot, uint8 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint8Slot slot) internal view returns (uint8 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint8Slot slot, uint8 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint16.
     */
    type Uint16Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint16Slot.
     */
    function asUint16Slot(bytes32 slot) internal pure returns (Uint16Slot) {
        return Uint16Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint16Slot slot) internal view returns (uint16 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint16Slot slot, uint16 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint16Slot slot) internal view returns (uint16 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint16Slot slot, uint16 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint24.
     */
    type Uint24Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint24Slot.
     */
    function asUint24Slot(bytes32 slot) internal pure returns (Uint24Slot) {
        return Uint24Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint24Slot slot) internal view returns (uint24 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint24Slot slot, uint24 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint24Slot slot) internal view returns (uint24 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint24Slot slot, uint24 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint32.
     */
    type Uint32Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint32Slot.
     */
    function asUint32Slot(bytes32 slot) internal pure returns (Uint32Slot) {
        return Uint32Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint32Slot slot) internal view returns (uint32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint32Slot slot, uint32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint32Slot slot) internal view returns (uint32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint32Slot slot, uint32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint40.
     */
    type Uint40Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint40Slot.
     */
    function asUint40Slot(bytes32 slot) internal pure returns (Uint40Slot) {
        return Uint40Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint40Slot slot) internal view returns (uint40 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint40Slot slot, uint40 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint40Slot slot) internal view returns (uint40 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint40Slot slot, uint40 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint48.
     */
    type Uint48Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint48Slot.
     */
    function asUint48Slot(bytes32 slot) internal pure returns (Uint48Slot) {
        return Uint48Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint48Slot slot) internal view returns (uint48 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint48Slot slot, uint48 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint48Slot slot) internal view returns (uint48 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint48Slot slot, uint48 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint56.
     */
    type Uint56Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint56Slot.
     */
    function asUint56Slot(bytes32 slot) internal pure returns (Uint56Slot) {
        return Uint56Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint56Slot slot) internal view returns (uint56 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint56Slot slot, uint56 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint56Slot slot) internal view returns (uint56 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint56Slot slot, uint56 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint64.
     */
    type Uint64Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint64Slot.
     */
    function asUint64Slot(bytes32 slot) internal pure returns (Uint64Slot) {
        return Uint64Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint64Slot slot) internal view returns (uint64 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint64Slot slot, uint64 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint64Slot slot) internal view returns (uint64 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint64Slot slot, uint64 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint72.
     */
    type Uint72Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint72Slot.
     */
    function asUint72Slot(bytes32 slot) internal pure returns (Uint72Slot) {
        return Uint72Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint72Slot slot) internal view returns (uint72 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint72Slot slot, uint72 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint72Slot slot) internal view returns (uint72 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint72Slot slot, uint72 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint80.
     */
    type Uint80Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint80Slot.
     */
    function asUint80Slot(bytes32 slot) internal pure returns (Uint80Slot) {
        return Uint80Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint80Slot slot) internal view returns (uint80 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint80Slot slot, uint80 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint80Slot slot) internal view returns (uint80 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint80Slot slot, uint80 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint88.
     */
    type Uint88Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint88Slot.
     */
    function asUint88Slot(bytes32 slot) internal pure returns (Uint88Slot) {
        return Uint88Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint88Slot slot) internal view returns (uint88 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint88Slot slot, uint88 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint88Slot slot) internal view returns (uint88 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint88Slot slot, uint88 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint96.
     */
    type Uint96Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint96Slot.
     */
    function asUint96Slot(bytes32 slot) internal pure returns (Uint96Slot) {
        return Uint96Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint96Slot slot) internal view returns (uint96 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint96Slot slot, uint96 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint96Slot slot) internal view returns (uint96 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint96Slot slot, uint96 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint104.
     */
    type Uint104Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint104Slot.
     */
    function asUint104Slot(bytes32 slot) internal pure returns (Uint104Slot) {
        return Uint104Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint104Slot slot) internal view returns (uint104 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint104Slot slot, uint104 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint104Slot slot) internal view returns (uint104 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint104Slot slot, uint104 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint112.
     */
    type Uint112Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint112Slot.
     */
    function asUint112Slot(bytes32 slot) internal pure returns (Uint112Slot) {
        return Uint112Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint112Slot slot) internal view returns (uint112 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint112Slot slot, uint112 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint112Slot slot) internal view returns (uint112 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint112Slot slot, uint112 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint120.
     */
    type Uint120Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint120Slot.
     */
    function asUint120Slot(bytes32 slot) internal pure returns (Uint120Slot) {
        return Uint120Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint120Slot slot) internal view returns (uint120 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint120Slot slot, uint120 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint120Slot slot) internal view returns (uint120 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint120Slot slot, uint120 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint128.
     */
    type Uint128Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint128Slot.
     */
    function asUint128Slot(bytes32 slot) internal pure returns (Uint128Slot) {
        return Uint128Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint128Slot slot) internal view returns (uint128 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint128Slot slot, uint128 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint128Slot slot) internal view returns (uint128 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint128Slot slot, uint128 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint136.
     */
    type Uint136Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint136Slot.
     */
    function asUint136Slot(bytes32 slot) internal pure returns (Uint136Slot) {
        return Uint136Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint136Slot slot) internal view returns (uint136 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint136Slot slot, uint136 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint136Slot slot) internal view returns (uint136 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint136Slot slot, uint136 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint144.
     */
    type Uint144Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint144Slot.
     */
    function asUint144Slot(bytes32 slot) internal pure returns (Uint144Slot) {
        return Uint144Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint144Slot slot) internal view returns (uint144 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint144Slot slot, uint144 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint144Slot slot) internal view returns (uint144 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint144Slot slot, uint144 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint152.
     */
    type Uint152Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint152Slot.
     */
    function asUint152Slot(bytes32 slot) internal pure returns (Uint152Slot) {
        return Uint152Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint152Slot slot) internal view returns (uint152 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint152Slot slot, uint152 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint152Slot slot) internal view returns (uint152 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint152Slot slot, uint152 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint160.
     */
    type Uint160Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint160Slot.
     */
    function asUint160Slot(bytes32 slot) internal pure returns (Uint160Slot) {
        return Uint160Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint160Slot slot) internal view returns (uint160 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint160Slot slot, uint160 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint160Slot slot) internal view returns (uint160 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint160Slot slot, uint160 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint168.
     */
    type Uint168Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint168Slot.
     */
    function asUint168Slot(bytes32 slot) internal pure returns (Uint168Slot) {
        return Uint168Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint168Slot slot) internal view returns (uint168 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint168Slot slot, uint168 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint168Slot slot) internal view returns (uint168 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint168Slot slot, uint168 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint176.
     */
    type Uint176Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint176Slot.
     */
    function asUint176Slot(bytes32 slot) internal pure returns (Uint176Slot) {
        return Uint176Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint176Slot slot) internal view returns (uint176 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint176Slot slot, uint176 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint176Slot slot) internal view returns (uint176 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint176Slot slot, uint176 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint184.
     */
    type Uint184Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint184Slot.
     */
    function asUint184Slot(bytes32 slot) internal pure returns (Uint184Slot) {
        return Uint184Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint184Slot slot) internal view returns (uint184 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint184Slot slot, uint184 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint184Slot slot) internal view returns (uint184 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint184Slot slot, uint184 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint192.
     */
    type Uint192Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint192Slot.
     */
    function asUint192Slot(bytes32 slot) internal pure returns (Uint192Slot) {
        return Uint192Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint192Slot slot) internal view returns (uint192 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint192Slot slot, uint192 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint192Slot slot) internal view returns (uint192 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint192Slot slot, uint192 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint200.
     */
    type Uint200Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint200Slot.
     */
    function asUint200Slot(bytes32 slot) internal pure returns (Uint200Slot) {
        return Uint200Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint200Slot slot) internal view returns (uint200 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint200Slot slot, uint200 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint200Slot slot) internal view returns (uint200 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint200Slot slot, uint200 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint208.
     */
    type Uint208Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint208Slot.
     */
    function asUint208Slot(bytes32 slot) internal pure returns (Uint208Slot) {
        return Uint208Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint208Slot slot) internal view returns (uint208 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint208Slot slot, uint208 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint208Slot slot) internal view returns (uint208 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint208Slot slot, uint208 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint216.
     */
    type Uint216Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint216Slot.
     */
    function asUint216Slot(bytes32 slot) internal pure returns (Uint216Slot) {
        return Uint216Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint216Slot slot) internal view returns (uint216 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint216Slot slot, uint216 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint216Slot slot) internal view returns (uint216 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint216Slot slot, uint216 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint224.
     */
    type Uint224Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint224Slot.
     */
    function asUint224Slot(bytes32 slot) internal pure returns (Uint224Slot) {
        return Uint224Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint224Slot slot) internal view returns (uint224 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint224Slot slot, uint224 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint224Slot slot) internal view returns (uint224 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint224Slot slot, uint224 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint232.
     */
    type Uint232Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint232Slot.
     */
    function asUint232Slot(bytes32 slot) internal pure returns (Uint232Slot) {
        return Uint232Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint232Slot slot) internal view returns (uint232 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint232Slot slot, uint232 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint232Slot slot) internal view returns (uint232 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint232Slot slot, uint232 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint240.
     */
    type Uint240Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint240Slot.
     */
    function asUint240Slot(bytes32 slot) internal pure returns (Uint240Slot) {
        return Uint240Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint240Slot slot) internal view returns (uint240 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint240Slot slot, uint240 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint240Slot slot) internal view returns (uint240 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint240Slot slot, uint240 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint248.
     */
    type Uint248Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint248Slot.
     */
    function asUint248Slot(bytes32 slot) internal pure returns (Uint248Slot) {
        return Uint248Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint248Slot slot) internal view returns (uint248 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint248Slot slot, uint248 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint248Slot slot) internal view returns (uint248 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint248Slot slot, uint248 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint256.
     */
    type Uint256Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint256Slot.
     */
    function asUint256Slot(bytes32 slot) internal pure returns (Uint256Slot) {
        return Uint256Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Uint256Slot slot) internal view returns (uint256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Uint256Slot slot, uint256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint256Slot slot) internal view returns (uint256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint256Slot slot, uint256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int8.
     */
    type Int8Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int8Slot.
     */
    function asInt8Slot(bytes32 slot) internal pure returns (Int8Slot) {
        return Int8Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int8Slot slot) internal view returns (int8 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int8Slot slot, int8 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int8Slot slot) internal view returns (int8 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int8Slot slot, int8 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int16.
     */
    type Int16Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int16Slot.
     */
    function asInt16Slot(bytes32 slot) internal pure returns (Int16Slot) {
        return Int16Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int16Slot slot) internal view returns (int16 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int16Slot slot, int16 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int16Slot slot) internal view returns (int16 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int16Slot slot, int16 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int24.
     */
    type Int24Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int24Slot.
     */
    function asInt24Slot(bytes32 slot) internal pure returns (Int24Slot) {
        return Int24Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int24Slot slot) internal view returns (int24 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int24Slot slot, int24 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int24Slot slot) internal view returns (int24 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int24Slot slot, int24 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int32.
     */
    type Int32Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int32Slot.
     */
    function asInt32Slot(bytes32 slot) internal pure returns (Int32Slot) {
        return Int32Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int32Slot slot) internal view returns (int32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int32Slot slot, int32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int32Slot slot) internal view returns (int32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int32Slot slot, int32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int40.
     */
    type Int40Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int40Slot.
     */
    function asInt40Slot(bytes32 slot) internal pure returns (Int40Slot) {
        return Int40Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int40Slot slot) internal view returns (int40 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int40Slot slot, int40 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int40Slot slot) internal view returns (int40 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int40Slot slot, int40 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int48.
     */
    type Int48Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int48Slot.
     */
    function asInt48Slot(bytes32 slot) internal pure returns (Int48Slot) {
        return Int48Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int48Slot slot) internal view returns (int48 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int48Slot slot, int48 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int48Slot slot) internal view returns (int48 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int48Slot slot, int48 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int56.
     */
    type Int56Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int56Slot.
     */
    function asInt56Slot(bytes32 slot) internal pure returns (Int56Slot) {
        return Int56Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int56Slot slot) internal view returns (int56 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int56Slot slot, int56 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int56Slot slot) internal view returns (int56 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int56Slot slot, int56 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int64.
     */
    type Int64Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int64Slot.
     */
    function asInt64Slot(bytes32 slot) internal pure returns (Int64Slot) {
        return Int64Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int64Slot slot) internal view returns (int64 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int64Slot slot, int64 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int64Slot slot) internal view returns (int64 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int64Slot slot, int64 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int72.
     */
    type Int72Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int72Slot.
     */
    function asInt72Slot(bytes32 slot) internal pure returns (Int72Slot) {
        return Int72Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int72Slot slot) internal view returns (int72 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int72Slot slot, int72 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int72Slot slot) internal view returns (int72 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int72Slot slot, int72 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int80.
     */
    type Int80Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int80Slot.
     */
    function asInt80Slot(bytes32 slot) internal pure returns (Int80Slot) {
        return Int80Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int80Slot slot) internal view returns (int80 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int80Slot slot, int80 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int80Slot slot) internal view returns (int80 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int80Slot slot, int80 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int88.
     */
    type Int88Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int88Slot.
     */
    function asInt88Slot(bytes32 slot) internal pure returns (Int88Slot) {
        return Int88Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int88Slot slot) internal view returns (int88 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int88Slot slot, int88 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int88Slot slot) internal view returns (int88 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int88Slot slot, int88 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int96.
     */
    type Int96Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int96Slot.
     */
    function asInt96Slot(bytes32 slot) internal pure returns (Int96Slot) {
        return Int96Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int96Slot slot) internal view returns (int96 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int96Slot slot, int96 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int96Slot slot) internal view returns (int96 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int96Slot slot, int96 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int104.
     */
    type Int104Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int104Slot.
     */
    function asInt104Slot(bytes32 slot) internal pure returns (Int104Slot) {
        return Int104Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int104Slot slot) internal view returns (int104 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int104Slot slot, int104 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int104Slot slot) internal view returns (int104 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int104Slot slot, int104 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int112.
     */
    type Int112Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int112Slot.
     */
    function asInt112Slot(bytes32 slot) internal pure returns (Int112Slot) {
        return Int112Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int112Slot slot) internal view returns (int112 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int112Slot slot, int112 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int112Slot slot) internal view returns (int112 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int112Slot slot, int112 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int120.
     */
    type Int120Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int120Slot.
     */
    function asInt120Slot(bytes32 slot) internal pure returns (Int120Slot) {
        return Int120Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int120Slot slot) internal view returns (int120 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int120Slot slot, int120 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int120Slot slot) internal view returns (int120 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int120Slot slot, int120 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int128.
     */
    type Int128Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int128Slot.
     */
    function asInt128Slot(bytes32 slot) internal pure returns (Int128Slot) {
        return Int128Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int128Slot slot) internal view returns (int128 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int128Slot slot, int128 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int128Slot slot) internal view returns (int128 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int128Slot slot, int128 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int136.
     */
    type Int136Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int136Slot.
     */
    function asInt136Slot(bytes32 slot) internal pure returns (Int136Slot) {
        return Int136Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int136Slot slot) internal view returns (int136 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int136Slot slot, int136 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int136Slot slot) internal view returns (int136 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int136Slot slot, int136 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int144.
     */
    type Int144Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int144Slot.
     */
    function asInt144Slot(bytes32 slot) internal pure returns (Int144Slot) {
        return Int144Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int144Slot slot) internal view returns (int144 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int144Slot slot, int144 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int144Slot slot) internal view returns (int144 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int144Slot slot, int144 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int152.
     */
    type Int152Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int152Slot.
     */
    function asInt152Slot(bytes32 slot) internal pure returns (Int152Slot) {
        return Int152Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int152Slot slot) internal view returns (int152 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int152Slot slot, int152 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int152Slot slot) internal view returns (int152 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int152Slot slot, int152 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int160.
     */
    type Int160Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int160Slot.
     */
    function asInt160Slot(bytes32 slot) internal pure returns (Int160Slot) {
        return Int160Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int160Slot slot) internal view returns (int160 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int160Slot slot, int160 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int160Slot slot) internal view returns (int160 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int160Slot slot, int160 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int168.
     */
    type Int168Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int168Slot.
     */
    function asInt168Slot(bytes32 slot) internal pure returns (Int168Slot) {
        return Int168Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int168Slot slot) internal view returns (int168 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int168Slot slot, int168 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int168Slot slot) internal view returns (int168 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int168Slot slot, int168 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int176.
     */
    type Int176Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int176Slot.
     */
    function asInt176Slot(bytes32 slot) internal pure returns (Int176Slot) {
        return Int176Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int176Slot slot) internal view returns (int176 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int176Slot slot, int176 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int176Slot slot) internal view returns (int176 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int176Slot slot, int176 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int184.
     */
    type Int184Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int184Slot.
     */
    function asInt184Slot(bytes32 slot) internal pure returns (Int184Slot) {
        return Int184Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int184Slot slot) internal view returns (int184 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int184Slot slot, int184 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int184Slot slot) internal view returns (int184 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int184Slot slot, int184 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int192.
     */
    type Int192Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int192Slot.
     */
    function asInt192Slot(bytes32 slot) internal pure returns (Int192Slot) {
        return Int192Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int192Slot slot) internal view returns (int192 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int192Slot slot, int192 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int192Slot slot) internal view returns (int192 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int192Slot slot, int192 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int200.
     */
    type Int200Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int200Slot.
     */
    function asInt200Slot(bytes32 slot) internal pure returns (Int200Slot) {
        return Int200Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int200Slot slot) internal view returns (int200 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int200Slot slot, int200 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int200Slot slot) internal view returns (int200 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int200Slot slot, int200 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int208.
     */
    type Int208Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int208Slot.
     */
    function asInt208Slot(bytes32 slot) internal pure returns (Int208Slot) {
        return Int208Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int208Slot slot) internal view returns (int208 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int208Slot slot, int208 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int208Slot slot) internal view returns (int208 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int208Slot slot, int208 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int216.
     */
    type Int216Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int216Slot.
     */
    function asInt216Slot(bytes32 slot) internal pure returns (Int216Slot) {
        return Int216Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int216Slot slot) internal view returns (int216 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int216Slot slot, int216 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int216Slot slot) internal view returns (int216 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int216Slot slot, int216 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int224.
     */
    type Int224Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int224Slot.
     */
    function asInt224Slot(bytes32 slot) internal pure returns (Int224Slot) {
        return Int224Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int224Slot slot) internal view returns (int224 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int224Slot slot, int224 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int224Slot slot) internal view returns (int224 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int224Slot slot, int224 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int232.
     */
    type Int232Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int232Slot.
     */
    function asInt232Slot(bytes32 slot) internal pure returns (Int232Slot) {
        return Int232Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int232Slot slot) internal view returns (int232 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int232Slot slot, int232 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int232Slot slot) internal view returns (int232 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int232Slot slot, int232 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int240.
     */
    type Int240Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int240Slot.
     */
    function asInt240Slot(bytes32 slot) internal pure returns (Int240Slot) {
        return Int240Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int240Slot slot) internal view returns (int240 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int240Slot slot, int240 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int240Slot slot) internal view returns (int240 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int240Slot slot, int240 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int248.
     */
    type Int248Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int248Slot.
     */
    function asInt248Slot(bytes32 slot) internal pure returns (Int248Slot) {
        return Int248Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int248Slot slot) internal view returns (int248 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int248Slot slot, int248 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int248Slot slot) internal view returns (int248 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int248Slot slot, int248 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int256.
     */
    type Int256Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int256Slot.
     */
    function asInt256Slot(bytes32 slot) internal pure returns (Int256Slot) {
        return Int256Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in (normal) storage.
     */
    function sload(Int256Slot slot) internal view returns (int256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in (normal) storage.
     */
    function sstore(Int256Slot slot, int256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int256Slot slot) internal view returns (int256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int256Slot slot, int256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }
}
