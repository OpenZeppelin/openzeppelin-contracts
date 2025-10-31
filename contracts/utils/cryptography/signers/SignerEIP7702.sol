// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/cryptography/signers/SignerEIP7702.sol)

pragma solidity ^0.8.20;

import {AbstractSigner} from "./AbstractSigner.sol";
import {ECDSA} from "../ECDSA.sol";

/**
 * @dev Implementation of {AbstractSigner} for implementation for an EOA. Useful for ERC-7702 accounts.
 *
 * @custom:stateless
 */
abstract contract SignerEIP7702 is AbstractSigner {
    /**
     * @dev Validates the signature using the EOA's address (i.e. `address(this)`).
     */
    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return address(this) == recovered && err == ECDSA.RecoverError.NoError;
    }
}
