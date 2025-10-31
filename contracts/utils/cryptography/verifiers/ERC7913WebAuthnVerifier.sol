// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/cryptography/verifiers/ERC7913WebAuthnVerifier.sol)

pragma solidity ^0.8.24;

import {WebAuthn} from "../WebAuthn.sol";
import {IERC7913SignatureVerifier} from "../../../interfaces/IERC7913.sol";

/**
 * @dev ERC-7913 signature verifier that supports WebAuthn authentication assertions.
 *
 * This verifier enables the validation of WebAuthn signatures using P256 public keys.
 * The key is expected to be a 64-byte concatenation of the P256 public key coordinates (qx || qy).
 * The signature is expected to be an abi-encoded {WebAuthn-WebAuthnAuth} struct.
 *
 * Uses {WebAuthn-verifyMinimal} for signature verification, which performs the essential
 * WebAuthn checks: type validation, challenge matching, and cryptographic signature verification.
 *
 * NOTE: Wallets that may require default P256 validation may install a P256 verifier separately.
 *
 * @custom:stateless
 */
contract ERC7913WebAuthnVerifier is IERC7913SignatureVerifier {
    /// @inheritdoc IERC7913SignatureVerifier
    function verify(bytes calldata key, bytes32 hash, bytes calldata signature) public view virtual returns (bytes4) {
        (bool decodeSuccess, WebAuthn.WebAuthnAuth calldata auth) = WebAuthn.tryDecodeAuth(signature);

        return
            decodeSuccess &&
                key.length == 0x40 &&
                WebAuthn.verify(abi.encodePacked(hash), auth, bytes32(key[0x00:0x20]), bytes32(key[0x20:0x40]))
                ? IERC7913SignatureVerifier.verify.selector
                : bytes4(0xFFFFFFFF);
    }
}
