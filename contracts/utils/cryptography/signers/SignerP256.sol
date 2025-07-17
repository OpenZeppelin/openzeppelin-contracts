// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/signers/SignerP256.sol)

pragma solidity ^0.8.20;

import {AbstractSigner} from "./AbstractSigner.sol";
import {P256} from "../P256.sol";

/**
 * @dev Implementation of {AbstractSigner} using xref:api:utils/cryptography#P256[P256] signatures.
 *
 * For {Account} usage, a {_setSigner} function is provided to set the {signer} public key.
 * Doing so is easier for a factory, who is likely to use initializable clones of this contract.
 *
 * Example of usage:
 *
 * ```solidity
 * contract MyAccountP256 is Account, SignerP256, Initializable {
 *     function initialize(bytes32 qx, bytes32 qy) public initializer {
 *       _setSigner(qx, qy);
 *     }
 * }
 * ```
 *
 * IMPORTANT: Failing to call {_setSigner} either during construction (if used standalone)
 * or during initialization (if used as a clone) may leave the signer either front-runnable or unusable.
 */
abstract contract SignerP256 is AbstractSigner {
    bytes32 private _qx;
    bytes32 private _qy;

    error SignerP256InvalidPublicKey(bytes32 qx, bytes32 qy);

    constructor(bytes32 qx, bytes32 qy) {
        _setSigner(qx, qy);
    }

    /**
     * @dev Sets the signer with a P256 public key. This function should be called during construction
     * or through an initializer.
     */
    function _setSigner(bytes32 qx, bytes32 qy) internal {
        if (!P256.isValidPublicKey(qx, qy)) revert SignerP256InvalidPublicKey(qx, qy);
        _qx = qx;
        _qy = qy;
    }

    /// @dev Return the signer's P256 public key.
    function signer() public view virtual returns (bytes32 qx, bytes32 qy) {
        return (_qx, _qy);
    }

    /// @inheritdoc AbstractSigner
    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        if (signature.length < 0x40) return false;
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);
        (bytes32 qx, bytes32 qy) = signer();
        return P256.verify(hash, r, s, qx, qy);
    }
}
