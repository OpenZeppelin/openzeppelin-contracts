// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/signers/SignerRSA.sol)

pragma solidity ^0.8.20;

import {AbstractSigner} from "./AbstractSigner.sol";
import {RSA} from "../RSA.sol";

/**
 * @dev Implementation of {AbstractSigner} using xref:api:utils/cryptography#RSA[RSA] signatures.
 *
 * For {Account} usage, a {_setSigner} function is provided to set the {signer} public key.
 * Doing so is easier for a factory, who is likely to use initializable clones of this contract.
 *
 * Example of usage:
 *
 * ```solidity
 * contract MyAccountRSA is Account, SignerRSA, Initializable {
 *     function initialize(bytes memory e, bytes memory n) public initializer {
 *       _setSigner(e, n);
 *     }
 * }
 * ```
 *
 * IMPORTANT: Failing to call {_setSigner} either during construction (if used standalone)
 * or during initialization (if used as a clone) may leave the signer either front-runnable or unusable.
 */
abstract contract SignerRSA is AbstractSigner {
    bytes private _e;
    bytes private _n;

    constructor(bytes memory e, bytes memory n) {
        _setSigner(e, n);
    }

    /**
     * @dev Sets the signer with a RSA public key. This function should be called during construction
     * or through an initializer.
     */
    function _setSigner(bytes memory e, bytes memory n) internal {
        _e = e;
        _n = n;
    }

    /// @dev Return the signer's RSA public key.
    function signer() public view virtual returns (bytes memory e, bytes memory n) {
        return (_e, _n);
    }

    /**
     * @dev See {AbstractSigner-_rawSignatureValidation}. Verifies a PKCSv1.5 signature by calling
     * xref:api:utils/cryptography.adoc#RSA-pkcs1Sha256-bytes-bytes-bytes-bytes-[RSA.pkcs1Sha256].
     *
     * IMPORTANT: Following the RSASSA-PKCS1-V1_5-VERIFY procedure outlined in RFC8017 (section 8.2.2), the
     * provided `hash` is used as the `M` (message) and rehashed using SHA256 according to EMSA-PKCS1-v1_5
     * encoding as per section 9.2 (step 1) of the RFC.
     */
    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1Sha256(abi.encodePacked(hash), signature, e, n);
    }
}
