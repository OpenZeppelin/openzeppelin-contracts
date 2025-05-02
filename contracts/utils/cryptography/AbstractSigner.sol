// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Abstract contract for signature validation.
 *
 * Developers must implement {_rawSignatureValidation} and use it as the lowest-level signature validation mechanism.
 */
abstract contract AbstractSigner {
    /**
     * @dev Signature validation algorithm.
     *
     * WARNING: Implementing a signature validation algorithm is a security-sensitive operation as it involves
     * cryptographic verification. It is important to review and test thoroughly before deployment. Consider
     * using one of the signature verification libraries (https://docs.openzeppelin.com/contracts/api/utils#ECDSA[ECDSA],
     * https://docs.openzeppelin.com/contracts/api/utils#P256[P256] or https://docs.openzeppelin.com/contracts/api/utils#RSA[RSA]).
     */
    function _rawSignatureValidation(bytes32 hash, bytes calldata signature) internal view virtual returns (bool);
}
