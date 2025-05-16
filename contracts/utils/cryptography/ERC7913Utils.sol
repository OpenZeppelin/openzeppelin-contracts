// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {SignatureChecker} from "./SignatureChecker.sol";
import {Bytes} from "../Bytes.sol";
import {IERC7913SignatureVerifier} from "../../interfaces/IERC7913.sol";

/**
 * @dev Library that provides common ERC-7913 utility functions.
 *
 * This library extends the functionality of xref:api:utils#SignatureChecker[SignatureChecker]
 * to support signature verification for keys that do not have an Ethereum address of their own
 * as with ERC-1271.
 *
 * See https://eips.ethereum.org/EIPS/eip-7913[ERC-7913].
 */
library ERC7913Utils {
    using Bytes for bytes;

    /**
     * @dev Verifies a signature for a given signer and hash.
     *
     * The signer is a `bytes` object that is the concatenation of an address and optionally a key:
     * `verifier || key`. A signer must be at least 20 bytes long.
     *
     * Verification is done as follows:
     * - If `signer.length < 20`: verification fails
     * - If `signer.length == 20`: verification is done using {SignatureChecker}
     * - Otherwise: verification is done using {IERC7913SignatureVerifier}
     */
    function isValidSignatureNow(
        bytes memory signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        if (signer.length < 20) {
            return false;
        } else if (signer.length == 20) {
            return SignatureChecker.isValidSignatureNow(address(bytes20(signer)), hash, signature);
        } else {
            (bool success, bytes memory result) = address(bytes20(signer)).staticcall(
                abi.encodeCall(IERC7913SignatureVerifier.verify, (signer.slice(20), hash, signature))
            );
            return (success &&
                result.length >= 32 &&
                abi.decode(result, (bytes32)) == bytes32(IERC7913SignatureVerifier.verify.selector));
        }
    }

    /**
     * @dev Verifies multiple `signatures` for a given hash using a set of `signers`.
     *
     * The signers must be ordered by their `keccak256` hash to ensure no duplicates and to optimize
     * the verification process. The function will return `false` if the signers are not properly ordered.
     *
     * Requirements:
     *
     * * The `signatures` array must be at least the  `signers` array's length.
     */
    function areValidSignaturesNow(
        bytes32 hash,
        bytes[] memory signers,
        bytes[] memory signatures
    ) internal view returns (bool) {
        bytes32 previousId = bytes32(0);

        uint256 signersLength = signers.length;
        for (uint256 i = 0; i < signersLength; i++) {
            bytes memory signer = signers[i];
            // Signers must ordered by id to ensure no duplicates
            bytes32 id = keccak256(signer);
            if (previousId >= id || !isValidSignatureNow(signer, hash, signatures[i])) {
                return false;
            }

            previousId = id;
        }

        return true;
    }
}
