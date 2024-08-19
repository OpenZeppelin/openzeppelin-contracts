// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";

/**
 * @dev RSA PKCS#1 v1.5 signature verification implementation according to https://datatracker.ietf.org/doc/html/rfc8017[RFC8017].
 *
 * This library supports PKCS#1 v1.5 padding to avoid malleability via chosen plaintext attacks in practical implementations.
 * The padding follows the EMSA-PKCS1-v1_5-ENCODE encoding definition as per section 9.2 of the RFC. This padding makes
 * RSA semanticaly secure for signing messages.
 *
 * Inspired by https://github.com/adria0/SolRsaVerify[Adrià Massanet's work]
 */
library RSA {
    /**
     * @dev Same as {pkcs1} but using SHA256 to calculate the digest of `data`.
     */
    function pkcs1Sha256(
        bytes memory data,
        bytes memory s,
        bytes memory e,
        bytes memory n
    ) internal view returns (bool) {
        return pkcs1(sha256(data), s, e, n);
    }

    /**
     * @dev Verifies a PKCSv1.5 signature given a digest according the verification
     * method described in https://datatracker.ietf.org/doc/html/rfc8017#section-8.2.2[section 8.2.2 of RFC8017].
     *
     * IMPORTANT: Although this function allows for it, using n of length 1024 bits is considered unsafe.
     * Consider using at least 2048 bits.
     *
     * WARNING: PKCS#1 v1.5 allows for replayability given the message may contain arbitrary optional parameters in the
     * DigestInfo. Consider using an onchain nonce or unique identifier to include in the message to prevent replay attacks.
     *
     * @param digest the digest to verify
     * @param s is a buffer containing the signature
     * @param e is the exponent of the public key
     * @param n is the modulus of the public key
     */
    function pkcs1(bytes32 digest, bytes memory s, bytes memory e, bytes memory n) internal view returns (bool) {
        unchecked {
            // cache and check length
            uint256 length = n.length;
            if (
                length < 0x40 || // PKCS#1 padding is slightly less than 0x40 bytes at the bare minimum
                length != s.length // signature must have the same length as the finite field
            ) {
                return false;
            }

            // Verify that s < n to ensure there's only one valid signature for a given message
            for (uint256 i = 0; i < length; i += 0x20) {
                uint256 p = Math.min(i, length - 0x20);
                bytes32 sp = _unsafeReadBytes32(s, p);
                bytes32 np = _unsafeReadBytes32(n, p);
                if (sp < np) {
                    // s < n in the upper bits (everything before is equal) → s < n globally: ok
                    break;
                } else if (sp > np || p == length - 0x20) {
                    // s > n in the upper bits (everything before is equal) → s > n globally: fail
                    // or
                    // s = n and we are looking at the lower bits → s = n globally: fail
                    return false;
                }
            }

            // RSAVP1 https://datatracker.ietf.org/doc/html/rfc8017#section-5.2.2
            // The previous check guarantees that n > 0. Therefore modExp cannot revert.
            bytes memory buffer = Math.modExp(s, e, n);

            // Check that buffer is well encoded:
            // buffer ::= 0x00 | 0x01 | PS | 0x00 | DigestInfo
            //
            // With
            // - PS is padding filled with 0xFF
            // - DigestInfo ::= SEQUENCE {
            //    digestAlgorithm AlgorithmIdentifier,
            //      [optional algorithm parameters]
            //    digest OCTET STRING
            // }

            // Get AlgorithmIdentifier from the DigestInfo, and set the config accordingly
            // - params: includes 00 + first part of DigestInfo
            // - mask: filter to check the params
            // - offset: length of the suffix (including digest)
            bytes32 params; // 0x00 | DigestInfo
            bytes32 mask;
            uint256 offset;

            // Digest is expected at the end of the buffer. Therefore if NULL param is present,
            // it should be at 32 (digest) + 2 bytes from the end. To those 34 bytes, we add the
            // OID (9 bytes) and its length (2 bytes) to get the position of the DigestInfo sequence,
            // which is expected to have a length of 0x31 when the NULL param is present or 0x2f if not.
            if (bytes1(_unsafeReadBytes32(buffer, length - 50)) == 0x31) {
                offset = 0x34;
                // 00 (1 byte) | SEQUENCE length (0x31) = 3031 (2 bytes) | SEQUENCE length (0x0d) = 300d (2 bytes) | OBJECT_IDENTIFIER length (0x09) = 0609 (2 bytes)
                // SHA256 OID = 608648016503040201 (9 bytes) | NULL = 0500 (2 bytes) (explicit) | OCTET_STRING length (0x20) = 0420 (2 bytes)
                params = 0x003031300d060960864801650304020105000420000000000000000000000000;
                mask = 0xffffffffffffffffffffffffffffffffffffffff000000000000000000000000; // (20 bytes)
            } else if (bytes1(_unsafeReadBytes32(buffer, length - 48)) == 0x2F) {
                offset = 0x32;
                // 00 (1 byte) | SEQUENCE length (0x2f) = 302f (2 bytes) | SEQUENCE length (0x0b) = 300b (2 bytes) | OBJECT_IDENTIFIER length (0x09) = 0609 (2 bytes)
                // SHA256 OID = 608648016503040201 (9 bytes) | NULL = <implicit> | OCTET_STRING length (0x20) = 0420 (2 bytes)
                params = 0x00302f300b060960864801650304020104200000000000000000000000000000;
                mask = 0xffffffffffffffffffffffffffffffffffff0000000000000000000000000000; // (18 bytes)
            } else {
                // unknown
                return false;
            }

            // Length is at least 0x40 and offset is at most 0x34, so this is safe. There is always some padding.
            uint256 paddingEnd = length - offset;

            // The padding has variable (arbitrary) length, so we check it byte per byte in a loop.
            // This is required to ensure non-malleability. Not checking would allow an attacker to
            // use the padding to manipulate the message in order to create a valid signature out of
            // multiple valid signatures.
            for (uint256 i = 2; i < paddingEnd; ++i) {
                if (bytes1(_unsafeReadBytes32(buffer, i)) != 0xFF) {
                    return false;
                }
            }

            // All the other parameters are small enough to fit in a bytes32, so we can check them directly.
            return
                bytes2(0x0001) == bytes2(_unsafeReadBytes32(buffer, 0x00)) && // 00 | 01
                // PS was checked in the loop
                params == _unsafeReadBytes32(buffer, paddingEnd) & mask && // DigestInfo
                // Optional parameters are not checked
                digest == _unsafeReadBytes32(buffer, length - 0x20); // Digest
        }
    }

    /// @dev Reads a bytes32 from a bytes array without bounds checking.
    function _unsafeReadBytes32(bytes memory array, uint256 offset) private pure returns (bytes32 result) {
        // Memory safetiness is guaranteed as long as the provided `array` is a Solidity-allocated bytes array
        // and `offset` is within bounds. This is the case for all calls to this private function from {pkcs1}.
        assembly ("memory-safe") {
            result := mload(add(add(array, 0x20), offset))
        }
    }
}
