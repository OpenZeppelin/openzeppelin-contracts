// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/draft-IERC4337.sol";
import {AccountBase} from "./draft-AccountBase.sol";
import {ERC7739Signer} from "../utils/cryptography/draft-ERC7739Signer.sol";
import {RSA} from "../utils/cryptography/RSA.sol";
import {ERC4337Utils} from "./utils/draft-ERC4337Utils.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155HolderLean, IERC1155Receiver} from "../token/ERC1155/utils/ERC1155HolderLean.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {IERC165} from "../utils/introspection/IERC165.sol";

/**
 * @dev Account implementation using {RSA} signatures and {ERC7739Signer} for replay protection.
 *
 * NOTE: Storing `_e` and `_n` in regular storage violate ERC-7562 validation rules if the contract
 * is used as an ERC-1271 signer during the validation phase of a different account contract.
 * Consider deploying this contract through a factory that sets `_e` and `_n` as immutable arguments
 * (see {Clones-cloneDeterministicWithImmutableArgs}).
 */
abstract contract AccountRSA is ERC165, ERC7739Signer, ERC721Holder, ERC1155HolderLean, AccountBase {
    bytes private _e;
    bytes private _n;

    /**
     * @dev Initializes the account with the RSA public key.
     */
    constructor(bytes memory e, bytes memory n) {
        _e = e;
        _n = n;
    }

    /**
     * @dev Return the account's signer RSA public key.
     */
    function signer() public view virtual returns (bytes memory e, bytes memory n) {
        return (_e, _n);
    }

    /**
     * @dev Internal version of {validateUserOp} that relies on {_isValidSignature}.
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256) {
        return
            _isValidSignature(userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /**
     * @dev Validates the signature using the account's signer.
     */
    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1Sha256(hash, signature, e, n);
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}
