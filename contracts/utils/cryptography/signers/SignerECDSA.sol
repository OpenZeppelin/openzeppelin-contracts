// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/signers/SignerECDSA.sol)

pragma solidity ^0.8.20;

import {AbstractSigner} from "./AbstractSigner.sol";
import {ECDSA} from "../ECDSA.sol";

/**
 * @dev Implementation of {AbstractSigner} using xref:api:utils/cryptography#ECDSA[ECDSA] signatures.
 *
 * For {Account} usage, a {_setSigner} function is provided to set the {signer} address.
 * Doing so is easier for a factory, who is likely to use initializable clones of this contract.
 *
 * Example of usage:
 *
 * ```solidity
 * contract MyAccountECDSA is Account, SignerECDSA, Initializable {
 *     function initialize(address signerAddr) public initializer {
 *       _setSigner(signerAddr);
 *     }
 * }
 * ```
 *
 * IMPORTANT: Failing to call {_setSigner} either during construction (if used standalone)
 * or during initialization (if used as a clone) may leave the signer either front-runnable or unusable.
 */
abstract contract SignerECDSA is AbstractSigner {
    address private _signer;

    constructor(address signerAddr) {
        _setSigner(signerAddr);
    }

    /**
     * @dev Sets the signer with the address of the native signer. This function should be called during construction
     * or through an initializer.
     */
    function _setSigner(address signerAddr) internal {
        _signer = signerAddr;
    }

    /// @dev Return the signer's address.
    function signer() public view virtual returns (address) {
        return _signer;
    }

    /// @inheritdoc AbstractSigner
    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecoverCalldata(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}
