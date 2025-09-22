// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {P256} from "./P256.sol";
import {Base64} from "../Base64.sol";
import {Bytes} from "../Bytes.sol";
import {Strings} from "../Strings.sol";

/**
 * @dev Library for verifying WebAuthn Authentication Assertions.
 *
 * WebAuthn enables strong authentication for smart contracts using
 * https://docs.openzeppelin.com/contracts/5.x/api/utils#P256[P256]
 * as an alternative to traditional secp256k1 ECDSA signatures. This library verifies
 * signatures generated during WebAuthn authentication ceremonies as specified in the
 * https://www.w3.org/TR/webauthn-2/[WebAuthn Level 2 standard].
 *
 * For blockchain use cases, the following WebAuthn validations are intentionally omitted:
 *
 * * Origin validation: Origin verification in `clientDataJSON` is omitted as blockchain
 *   contexts rely on authenticator and dapp frontend enforcement. Standard authenticators
 *   implement proper origin validation.
 * * RP ID hash validation: Verification of `rpIdHash` in authenticatorData against expected
 *   RP ID hash is omitted. This is typically handled by platform-level security measures.
 *   Including an expiry timestamp in signed data is recommended for enhanced security.
 * * Signature counter: Verification of signature counter increments is omitted. While
 *   useful for detecting credential cloning, on-chain operations typically include nonce
 *   protection, making this check redundant.
 * * Extension outputs: Extension output value verification is omitted as these are not
 *   essential for core authentication security in blockchain applications.
 * * Attestation: Attestation object verification is omitted as this implementation
 *   focuses on authentication (`webauthn.get`) rather than registration ceremonies.
 *
 * Inspired by:
 *
 * * https://github.com/daimo-eth/p256-verifier/blob/master/src/WebAuthn.sol[daimo-eth implementation]
 * * https://github.com/base/webauthn-sol/blob/main/src/WebAuthn.sol[base implementation]
 */
library WebAuthn {
    struct WebAuthnAuth {
        bytes32 r; /// The r value of secp256r1 signature
        bytes32 s; /// The s value of secp256r1 signature
        uint256 challengeIndex; /// The index at which "challenge":"..." occurs in `clientDataJSON`.
        uint256 typeIndex; /// The index at which "type":"..." occurs in `clientDataJSON`.
        /// The WebAuthn authenticator data.
        /// https://www.w3.org/TR/webauthn-2/#dom-authenticatorassertionresponse-authenticatordata
        bytes authenticatorData;
        /// The WebAuthn client data JSON.
        /// https://www.w3.org/TR/webauthn-2/#dom-authenticatorresponse-clientdatajson
        string clientDataJSON;
    }

    /// @dev Bit 0 of the authenticator data flags: "User Present" bit.
    bytes1 internal constant AUTH_DATA_FLAGS_UP = 0x01;
    /// @dev Bit 2 of the authenticator data flags: "User Verified" bit.
    bytes1 internal constant AUTH_DATA_FLAGS_UV = 0x04;
    /// @dev Bit 3 of the authenticator data flags: "Backup Eligibility" bit.
    bytes1 internal constant AUTH_DATA_FLAGS_BE = 0x08;
    /// @dev Bit 4 of the authenticator data flags: "Backup State" bit.
    bytes1 internal constant AUTH_DATA_FLAGS_BS = 0x10;

    /**
     * @dev Performs standard verification of a WebAuthn Authentication Assertion.
     */
    function verify(
        bytes memory challenge,
        WebAuthnAuth memory auth,
        bytes32 qx,
        bytes32 qy
    ) internal view returns (bool) {
        return verify(challenge, auth, qx, qy, true);
    }

    /**
     * @dev Performs verification of a WebAuthn Authentication Assertion. This variants allow the caller to select
     * whether of not to require the UV flag (step 17).
     *
     * Verifies:
     *
     * 1. Type is "webauthn.get" (see {_validateExpectedTypeHash})
     * 2. Challenge matches the expected value (see {_validateChallenge})
     * 3. Cryptographic signature is valid for the given public key
     * 4. confirming physical user presence during authentication
     * 5. (if `requireUV` is true) confirming stronger user authentication (biometrics/PIN)
     * 6. Backup Eligibility (`BE`) and Backup State (BS) bits relationship is valid
     */
    function verify(
        bytes memory challenge,
        WebAuthnAuth memory auth,
        bytes32 qx,
        bytes32 qy,
        bool requireUV
    ) internal view returns (bool) {
        // Verify authenticator data has sufficient length (37 bytes minimum):
        // - 32 bytes for rpIdHash
        // - 1 byte for flags
        // - 4 bytes for signature counter
        return
            auth.authenticatorData.length > 36 &&
            _validateExpectedTypeHash(auth.clientDataJSON, auth.typeIndex) && // 11
            _validateChallenge(auth.clientDataJSON, auth.challengeIndex, challenge) && // 12
            _validateUserPresentBitSet(auth.authenticatorData[32]) && // 16
            (!requireUV || _validateUserVerifiedBitSet(auth.authenticatorData[32])) && // 17
            _validateBackupEligibilityAndState(auth.authenticatorData[32]) && // Consistency check
            // P256.verify handles signature malleability internally
            P256.verify(
                sha256(
                    abi.encodePacked(
                        auth.authenticatorData,
                        sha256(bytes(auth.clientDataJSON)) // 19
                    )
                ),
                auth.r,
                auth.s,
                qx,
                qy
            ); // 20
    }

    /**
     * @dev Validates that the https://www.w3.org/TR/webauthn-2/#type[Type] field in the client data JSON is set to
     * "webauthn.get".
     *
     * Step 11 in https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion[verifying an assertion].
     */
    function _validateExpectedTypeHash(
        string memory clientDataJSON,
        uint256 typeIndex
    ) private pure returns (bool success) {
        assembly ("memory-safe") {
            success := and(
                // clientDataJson.length >= typeIndex + 21
                gt(mload(clientDataJSON), add(typeIndex, 20)),
                eq(
                    // get 32 bytes starting at index typexIndex in clientDataJSON, and keep the leftmost 21 bytes
                    and(mload(add(add(clientDataJSON, 0x20), typeIndex)), shl(88, not(0))),
                    // solhint-disable-next-line quotes
                    '"type":"webauthn.get"'
                )
            )
        }
    }

    /**
     * @dev Validates that the challenge in the client data JSON matches the `expectedChallenge`.
     *
     * Step 12 in https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion[verifying an assertion].
     */
    function _validateChallenge(
        string memory clientDataJSON,
        uint256 challengeIndex,
        bytes memory challenge
    ) private pure returns (bool) {
        // solhint-disable-next-line quotes
        string memory expectedChallenge = string.concat('"challenge":"', Base64.encodeURL(challenge), '"');
        string memory actualChallenge = string(
            Bytes.slice(bytes(clientDataJSON), challengeIndex, challengeIndex + bytes(expectedChallenge).length)
        );

        return Strings.equal(actualChallenge, expectedChallenge);
    }

    /**
     * @dev Validates that the https://www.w3.org/TR/webauthn-2/#up[User Present (UP)] bit is set.
     *
     * Step 16 in https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion[verifying an assertion].
     *
     * NOTE: Required by WebAuthn spec but may be skipped for platform authenticators
     * (Touch ID, Windows Hello) in controlled environments. Enforce for public-facing apps.
     */
    function _validateUserPresentBitSet(bytes1 flags) private pure returns (bool) {
        return (flags & AUTH_DATA_FLAGS_UP) == AUTH_DATA_FLAGS_UP;
    }

    /**
     * @dev Validates that the https://www.w3.org/TR/webauthn-2/#uv[User Verified (UV)] bit is set.
     *
     * Step 17 in https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion[verifying an assertion].
     *
     * The UV bit indicates whether the user was verified using a stronger identification method
     * (biometrics, PIN, password). While optional, requiring UV=1 is recommended for:
     *
     * * High-value transactions and sensitive operations
     * * Account recovery and critical settings changes
     * * Privileged operations
     *
     * NOTE: For routine operations or when using hardware authenticators without verification capabilities,
     * `UV=0` may be acceptable. The choice of whether to require UV represents a security vs. usability
     * tradeoff - for blockchain applications handling valuable assets, requiring UV is generally safer.
     */
    function _validateUserVerifiedBitSet(bytes1 flags) private pure returns (bool) {
        return (flags & AUTH_DATA_FLAGS_UV) == AUTH_DATA_FLAGS_UV;
    }

    /**
     * @dev Validates the relationship between Backup Eligibility (`BE`) and Backup State (`BS`) bits
     * according to the WebAuthn specification.
     *
     * The function enforces that if a credential is backed up (`BS=1`), it must also be eligible
     * for backup (`BE=1`). This prevents unauthorized credential backup and ensures compliance
     * with the WebAuthn spec.
     *
     * Returns true in these valid states:
     *
     * * `BE=1`, `BS=0`: Credential is eligible but not backed up
     * * `BE=1`, `BS=1`: Credential is eligible and backed up
     * * `BE=0`, `BS=0`: Credential is not eligible and not backed up
     *
     * Returns false only when `BE=0` and `BS=1`, which is an invalid state indicating
     * a credential that's backed up but not eligible for backup.
     *
     * NOTE: While the WebAuthn spec defines this relationship between `BE` and `BS` bits,
     * validating it is not explicitly required as part of the core verification procedure.
     * Some implementations may choose to skip this check for broader authenticator
     * compatibility or when the application's threat model doesn't consider credential
     * syncing a major risk.
     */
    function _validateBackupEligibilityAndState(bytes1 flags) private pure returns (bool) {
        return (flags & AUTH_DATA_FLAGS_BE) == AUTH_DATA_FLAGS_BE || (flags & AUTH_DATA_FLAGS_BS) == 0;
    }

    /**
     * @dev Verifies that calldata bytes (`input`) represents a valid `WebAuthnAuth` object. If encoding is valid,
     * returns true and the calldata view at the object. Otherwise, returns false and an invalid calldata object.
     *
     * NOTE: The returned `auth` object should not be accessed if `success` is false. Trying to access the data may
     * cause revert/panic.
     */
    function tryDecodeAuth(bytes calldata input) internal pure returns (bool success, WebAuthnAuth calldata auth) {
        assembly ("memory-safe") {
            auth := input.offset
        }

        // Minimum length to hold 6 objects (32 bytes each)
        if (input.length < 0xC0) return (false, auth);

        // Get offset of non-value-type elements relative to the input buffer
        uint256 authenticatorDataOffset = uint256(bytes32(input[0x80:]));
        uint256 clientDataJSONOffset = uint256(bytes32(input[0xa0:]));

        // The elements length (at the offset) should be 32 bytes long. We check that this is within the
        // buffer bounds. Since we know input.length is at least 32, we can subtract with no overflow risk.
        if (input.length - 0x20 < authenticatorDataOffset || input.length - 0x20 < clientDataJSONOffset)
            return (false, auth);

        // Get the lengths. offset + 32 is bounded by input.length so it does not overflow.
        uint256 authenticatorDataLength = uint256(bytes32(input[authenticatorDataOffset:]));
        uint256 clientDataJSONLength = uint256(bytes32(input[clientDataJSONOffset:]));

        // Check that the input buffer is long enough to store the non-value-type elements
        // Since we know input.length is at least xxxOffset + 32, we can subtract with no overflow risk.
        if (
            input.length - authenticatorDataOffset - 0x20 < authenticatorDataLength ||
            input.length - clientDataJSONOffset - 0x20 < clientDataJSONLength
        ) return (false, auth);

        return (true, auth);
    }
}
