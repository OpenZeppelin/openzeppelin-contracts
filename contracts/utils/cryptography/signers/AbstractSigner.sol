// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/signers/AbstractSigner.sol)

pragma solidity ^0.8.20;

/**
 * @dev Abstract contract for signature validation.
 *
 * Developers must implement {_rawSignatureValidation} and use it as the lowest-level signature validation mechanism.
 *
 * @custom:stateless
 */
abstract contract AbstractSigner {
    /**
     * @dev Signature validation algorithm.
     *
     * WARNING: Implementing a signature validation algorithm is a security-sensitive operation as it involves
     * cryptographic verification. It is important to review and test thoroughly before deployment. Consider
     * using one of the signature verification libraries (xref:api:utils/cryptography#ECDSA[ECDSA],
     * xref:api:utils/cryptography#P256[P256] or xref:api:utils/cryptography#RSA[RSA]).
     */
    function _rawSignatureValidation(bytes32 hash, bytes calldata signature) internal view virtual returns (bool);
}
