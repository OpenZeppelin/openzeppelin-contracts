// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/cryptography/MessageHashUtils.sol)

pragma solidity ^0.8.24;

import {Strings} from "../Strings.sol";
import {Memory} from "../Memory.sol";

/**
 * @dev Signature message hash utilities for producing digests to be consumed by {ECDSA} recovery or signing.
 *
 * The library provides methods for generating a hash of a message that conforms to the
 * https://eips.ethereum.org/EIPS/eip-191[ERC-191] and https://eips.ethereum.org/EIPS/eip-712[EIP 712]
 * specifications.
 */
library MessageHashUtils {
    /**
     * @dev Returns the keccak256 digest of an ERC-191 signed data with version
     * `0x45` (`personal_sign` messages).
     *
     * The digest is calculated by prefixing a bytes32 `messageHash` with
     * `"\x19Ethereum Signed Message:\n32"` and hashing the result. It corresponds with the
     * hash signed when using the https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign[`eth_sign`] JSON-RPC method.
     *
     * NOTE: The `messageHash` parameter is intended to be the result of hashing a raw message with
     * keccak256, although any bytes32 value can be safely used because the final digest will
     * be re-hashed.
     *
     * See {ECDSA-recover}.
     */
    function toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32 digest) {
        assembly ("memory-safe") {
            mstore(0x00, "\x19Ethereum Signed Message:\n32") // 32 is the bytes-length of messageHash
            mstore(0x1c, messageHash) // 0x1c (28) is the length of the prefix
            digest := keccak256(0x00, 0x3c) // 0x3c is the length of the prefix (0x1c) + messageHash (0x20)
        }
    }

    /**
     * @dev Returns the keccak256 digest of an ERC-191 signed data with version
     * `0x45` (`personal_sign` messages).
     *
     * The digest is calculated by prefixing an arbitrary `message` with
     * `"\x19Ethereum Signed Message:\n" + len(message)` and hashing the result. It corresponds with the
     * hash signed when using the https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign[`eth_sign`] JSON-RPC method.
     *
     * See {ECDSA-recover}.
     */
    function toEthSignedMessageHash(bytes memory message) internal pure returns (bytes32) {
        return
            keccak256(bytes.concat("\x19Ethereum Signed Message:\n", bytes(Strings.toString(message.length)), message));
    }

    /**
     * @dev Returns the keccak256 digest of an ERC-191 signed data with version
     * `0x00` (data with intended validator).
     *
     * The digest is calculated by prefixing an arbitrary `data` with `"\x19\x00"` and the intended
     * `validator` address. Then hashing the result.
     *
     * See {ECDSA-recover}.
     */
    function toDataWithIntendedValidatorHash(address validator, bytes memory data) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(hex"19_00", validator, data));
    }

    /**
     * @dev Variant of {toDataWithIntendedValidatorHash-address-bytes} optimized for cases where `data` is a bytes32.
     */
    function toDataWithIntendedValidatorHash(
        address validator,
        bytes32 messageHash
    ) internal pure returns (bytes32 digest) {
        assembly ("memory-safe") {
            mstore(0x00, hex"19_00")
            mstore(0x02, shl(96, validator))
            mstore(0x16, messageHash)
            digest := keccak256(0x00, 0x36)
        }
    }

    /**
     * @dev Returns the keccak256 digest of an EIP-712 typed data (ERC-191 version `0x01`).
     *
     * The digest is calculated from a `domainSeparator` and a `structHash`, by prefixing them with
     * `\x19\x01` and hashing the result. It corresponds to the hash signed by the
     * https://eips.ethereum.org/EIPS/eip-712[`eth_signTypedData`] JSON-RPC method as part of EIP-712.
     *
     * See {ECDSA-recover}.
     */
    function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32 digest) {
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            mstore(ptr, hex"19_01")
            mstore(add(ptr, 0x02), domainSeparator)
            mstore(add(ptr, 0x22), structHash)
            digest := keccak256(ptr, 0x42)
        }
    }

    /**
     * @dev Returns the keccak256 digest of an EIP-712 domain separator constructed from an `eip712Domain` function. See {IERC5267-eip712Domain}
     *
     * This function dynamically constructs the domain separator based on which fields are present in the
     * `eip712Domain` return value. The `fields` parameter uses bit flags to indicate which domain fields
     * are present:
     *
     * * Bit 0 (0x01): name
     * * Bit 1 (0x02): version
     * * Bit 2 (0x04): chainId
     * * Bit 3 (0x08): verifyingContract
     * * Bit 4 (0x10): salt
     *
     * NOTE: This allows for flexible domain construction and is particularly useful for cross-chain signatures
     * where certain fields may be omitted or set to specific values (e.g., chainId: 0 for universal validity).
     * See https://eips.ethereum.org/EIPS/eip-7964[ERC-7964].
     */
    function toDomainSeparator(
        function()
            view
            returns (bytes1, string memory, string memory, uint256, address, bytes32, uint256[] memory) eip712Domain
    ) internal view returns (bytes32) {
        bytes32 ptr = Memory.Pointer.unwrap(Memory.getFreeMemoryPointer());
        (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = eip712Domain();
        (bytes32 typePtr, bytes32 typeHash) = _buildDynamicTypeHash(ptr, fields);
        bytes32 hash = _buildDynamicDomainSeparatorHash(
            ptr,
            typePtr,
            typeHash,
            fields,
            name,
            version,
            chainId,
            verifyingContract,
            salt,
            extensions
        );
        Memory.setFreeMemoryPointer(Memory.asPointer(ptr)); // Reset cached pointer
        return hash;
    }

    /// @dev Builds an EIP-712 type hash depending on the `fields` provided, following https://eips.ethereum.org/EIPS/eip-5267[ERC-5267]
    function _buildDynamicTypeHash(bytes32 ptr, bytes1 fields) private pure returns (bytes32 typePtr, bytes32 hash) {
        assembly ("memory-safe") {
            mstore(ptr, "EIP712Domain(")
            typePtr := add(ptr, 0x0d) // Skip "EIP712Domain("
            let firstField := true
            if and(fields, 0x01) {
                firstField := false
                mstore(typePtr, "string name") // 0x0b bytes
                typePtr := add(typePtr, 0x0b) // Skip "string name"
            }
            if and(fields, 0x02) {
                if iszero(firstField) {
                    mstore(typePtr, ",")
                    typePtr := add(typePtr, 0x01)
                    firstField := false
                }
                mstore(typePtr, "string version") // 0x0e bytes
                typePtr := add(typePtr, 0x0e) // Skip "string version"
            }
            if and(fields, 0x04) {
                if iszero(firstField) {
                    mstore(typePtr, ",")
                    typePtr := add(typePtr, 0x01)
                    firstField := false
                }
                mstore(typePtr, "uint256 chainId") // 0x0f bytes
                typePtr := add(typePtr, 0x0f) // Skip "uint256 chainId"
            }
            if and(fields, 0x08) {
                if iszero(firstField) {
                    mstore(typePtr, ",")
                    typePtr := add(typePtr, 0x01)
                    firstField := false
                }
                mstore(typePtr, "address verifyingContract") // 0x19 bytes
                typePtr := add(typePtr, 0x19) // Skip "address verifyingContract"
            }
            if and(fields, 0x10) {
                if iszero(firstField) {
                    mstore(typePtr, ",")
                    typePtr := add(typePtr, 0x01)
                    firstField := false
                }
                mstore(typePtr, "bytes32 salt") // 0x0c bytes
                typePtr := add(typePtr, 0x0c) // Skip "bytes32 salt"
            }
            if and(fields, 0x20) {
                if iszero(firstField) {
                    mstore(typePtr, ",")
                    typePtr := add(typePtr, 0x01)
                    firstField := false
                }
                mstore(typePtr, "uint256[] extensions") // 0x14 bytes
                typePtr := add(typePtr, 0x14) // Skip "uint256[] extensions"
            }
            mstore8(typePtr, 0x29) // Add ")"
            typePtr := add(typePtr, 0x01) // Skip ")"
            hash := keccak256(ptr, sub(typePtr, ptr)) // sub(typePtr, ptr) is the length of the type string
        }
    }

    /// @dev Builds an EIP-712 domain separator hash depending on the `fields` provided, following https://eips.ethereum.org/EIPS/eip-5267[ERC-5267]
    function _buildDynamicDomainSeparatorHash(
        bytes32 ptr,
        bytes32 typePtr,
        bytes32 typeHash,
        bytes1 fields,
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) private pure returns (bytes32 hash) {
        assembly ("memory-safe") {
            mstore(typePtr, typeHash)
            typePtr := add(typePtr, 0x20)
            if and(fields, 0x01) {
                mstore(typePtr, keccak256(name, mload(name)))
                typePtr := add(typePtr, 0x20)
            }
            if and(fields, 0x02) {
                mstore(typePtr, keccak256(version, mload(version)))
                typePtr := add(typePtr, 0x20)
            }
            if and(fields, 0x04) {
                mstore(typePtr, chainId)
                typePtr := add(typePtr, 0x20)
            }
            if and(fields, 0x08) {
                mstore(typePtr, verifyingContract)
                typePtr := add(typePtr, 0x20)
            }
            if and(fields, 0x10) {
                mstore(typePtr, salt)
                typePtr := add(typePtr, 0x20)
            }
            if and(fields, 0x20) {
                mstore(typePtr, extensions)
                typePtr := add(typePtr, 0x20)
            }
            hash := keccak256(ptr, sub(typePtr, ptr))
        }
    }
}
