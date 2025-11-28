// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/cryptography/MessageHashUtils.sol)

pragma solidity ^0.8.24;

import {Strings} from "../Strings.sol";

/**
 * @dev Signature message hash utilities for producing digests to be consumed by {ECDSA} recovery or signing.
 *
 * The library provides methods for generating a hash of a message that conforms to the
 * https://eips.ethereum.org/EIPS/eip-191[ERC-191] and https://eips.ethereum.org/EIPS/eip-712[EIP 712]
 * specifications.
 */
library MessageHashUtils {
    error ERC5267ExtensionsNotSupported();

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
     * @dev Returns the EIP-712 domain separator constructed from an `eip712Domain`. See {IERC5267-eip712Domain}
     *
     * This function dynamically constructs the domain separator based on which fields are present in the
     * `fields` parameter. It contains flags that indicate which domain fields are present:
     *
     * * Bit 0 (0x01): name
     * * Bit 1 (0x02): version
     * * Bit 2 (0x04): chainId
     * * Bit 3 (0x08): verifyingContract
     * * Bit 4 (0x10): salt
     *
     * Arguments that correspond to fields which are not present in `fields` are ignored. For example, if `fields` is
     * `0x0f` (`0b01111`), then the `salt` parameter is ignored.
     */
    function toDomainSeparator(
        bytes1 fields,
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt
    ) internal pure returns (bytes32 hash) {
        return
            toDomainSeparator(
                fields,
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract,
                salt
            );
    }

    /// @dev Variant of {toDomainSeparator-bytes1-string-string-uint256-address-bytes32} that uses hashed name and version.
    function toDomainSeparator(
        bytes1 fields,
        bytes32 nameHash,
        bytes32 versionHash,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt
    ) internal pure returns (bytes32 hash) {
        bytes32 domainTypeHash = toDomainTypeHash(fields);

        assembly ("memory-safe") {
            // align fields to the right for easy processing
            fields := shr(248, fields)

            // FMP used as scratch space
            let fmp := mload(0x40)
            mstore(fmp, domainTypeHash)

            let ptr := add(fmp, 0x20)
            if and(fields, 0x01) {
                mstore(ptr, nameHash)
                ptr := add(ptr, 0x20)
            }
            if and(fields, 0x02) {
                mstore(ptr, versionHash)
                ptr := add(ptr, 0x20)
            }
            if and(fields, 0x04) {
                mstore(ptr, chainId)
                ptr := add(ptr, 0x20)
            }
            if and(fields, 0x08) {
                mstore(ptr, verifyingContract)
                ptr := add(ptr, 0x20)
            }
            if and(fields, 0x10) {
                mstore(ptr, salt)
                ptr := add(ptr, 0x20)
            }

            hash := keccak256(fmp, sub(ptr, fmp))
        }
    }

    /// @dev Builds an EIP-712 domain type hash depending on the `fields` provided, following https://eips.ethereum.org/EIPS/eip-5267[ERC-5267]
    function toDomainTypeHash(bytes1 fields) internal pure returns (bytes32 hash) {
        if (fields & 0x20 == 0x20) revert ERC5267ExtensionsNotSupported();

        assembly ("memory-safe") {
            // align fields to the right for easy processing
            fields := shr(248, fields)

            // FMP used as scratch space
            let fmp := mload(0x40)
            mstore(fmp, "EIP712Domain(")

            let ptr := add(fmp, 0x0d)
            // name field
            if and(fields, 0x01) {
                mstore(ptr, "string name,")
                ptr := add(ptr, 0x0c)
            }
            // version field
            if and(fields, 0x02) {
                mstore(ptr, "string version,")
                ptr := add(ptr, 0x0f)
            }
            // chainId field
            if and(fields, 0x04) {
                mstore(ptr, "uint256 chainId,")
                ptr := add(ptr, 0x10)
            }
            // verifyingContract field
            if and(fields, 0x08) {
                mstore(ptr, "address verifyingContract,")
                ptr := add(ptr, 0x1a)
            }
            // salt field
            if and(fields, 0x10) {
                mstore(ptr, "bytes32 salt,")
                ptr := add(ptr, 0x0d)
            }
            // if any field is enabled, remove the trailing comma
            ptr := sub(ptr, iszero(iszero(and(fields, 0x1f))))
            // add the closing brace
            mstore8(ptr, 0x29) // add closing brace
            ptr := add(ptr, 1)

            hash := keccak256(fmp, sub(ptr, fmp))
        }
    }
}
