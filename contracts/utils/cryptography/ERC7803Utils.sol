// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {MessageHashUtils} from "./MessageHashUtils.sol";
import {Strings} from "../Strings.sol";
import {Bytes} from "../Bytes.sol";
import {Math} from "../math/Math.sol";

/**
 * @dev Utilities to process https://ercs.ethereum.org/ERCS/erc-7803[ERC-7803] signatures with signing domains
 * for Account Abstraction.
 *
 * This library provides methods to encode and decode ERC-7803 signatures that support signing domains
 * and authentication method coordination. Signing domains prevent replay attacks when private keys
 * are shared across smart contract accounts, while authentication methods allow dapps and wallets
 * to coordinate on signature verification approaches.
 *
 * The core functionality implements the recursive encoding scheme defined in ERC-7803:
 *
 * * If signing domain separators exist: `"\x19\x02" ‖ first ‖ encodeForSigningDomains(others, verifyingDomainSeparator, message)`
 * * If no signing domain separators: standard EIP-712 encoding
 */
library ERC7803Utils {
    /**
     * @dev Encodes message for signing domains according to ERC-7803 specification.
     *
     * This implements the recursive encoding scheme:
     *
     * * If `signingDomainSeparators` is not empty: `"\x19\x02" ‖ first ‖ encodeForSigningDomains(others, verifyingDomainSeparator, message)`
     * * If `signingDomainSeparators` is empty: standard EIP-712 encoding using {MessageHashUtils-toTypedDataHash}
     */
    function encodeForSigningDomains(
        bytes32[] memory signingDomainSeparators,
        bytes32 verifyingDomainSeparator,
        bytes32 structHash
    ) internal pure returns (bytes32) {
        return
            signingDomainSeparators.length == 0
                ? MessageHashUtils.toTypedDataHash(verifyingDomainSeparator, structHash)
                : MessageHashUtils.toSigningDomainHash(
                    signingDomainSeparators[0],
                    // TODO: Make iterative?
                    encodeForSigningDomains(
                        _splice(signingDomainSeparators, 1, signingDomainSeparators.length),
                        verifyingDomainSeparator,
                        structHash
                    )
                );
    }

    /// @dev Checks if an authentication method ID corresponds to ECDSA.
    function isECDSA(string memory methodId) internal pure returns (bool) {
        return Strings.equal(methodId, "ECDSA");
    }

    /// @dev Checks if an authentication method ID corresponds to an ERC standard.
    function isERC(string memory methodId) internal pure returns (bool, uint256) {
        bytes memory methodBytes = bytes(methodId);
        if (methodBytes.length < 4) return (false, 0);

        // Check if it starts with "ERC-"
        if (!(methodBytes[0] == "E" && methodBytes[1] == "R" && methodBytes[2] == "C" && methodBytes[3] == "-")) {
            return (false, 0);
        }

        // Extract and validate the ERC number
        return Strings.tryParseUint(string(Bytes.slice(methodBytes, 4)));
    }

    /**
     * @dev Splices a slice of a bytes32 array. Avoids expanding memory.
     *
     * Replicates https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice[Javascript's `Array.splice`]
     *
     * NOTE: Clears the array if `start` is greater than `end`.
     */
    function _splice(bytes32[] memory data, uint256 start, uint256 end) private pure returns (bytes32[] memory) {
        // sanitize
        uint256 length = data.length;
        end = Math.min(end, length);
        start = Math.min(start, end);

        if (start != 0) {
            // allocate and copy
            for (uint256 i = start; i < end; i++) {
                data[i - start] = data[i];
            }
        }

        assembly ("memory-safe") {
            // Can't overflow because `end` is less than `data.length`
            mstore(data, sub(mload(data), sub(end, start)))
        }

        return data;
    }
}
