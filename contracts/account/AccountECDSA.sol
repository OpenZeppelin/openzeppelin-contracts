// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {AccountBase} from "./AccountBase.sol";
import {ERC1271TypedSigner} from "../utils/cryptography/ERC1271TypedSigner.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155HolderLean, IERC1155Receiver} from "../token/ERC1155/utils/ERC1155HolderLean.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {IERC165} from "../utils/introspection/IERC165.sol";

/**
 * @dev Account implementation using {ECDSA} signatures and {ERC1271TypedSigner} for replay protection.
 */
abstract contract AccountECDSA is ERC165, ERC1271TypedSigner, ERC721Holder, ERC1155HolderLean, AccountBase {
    address private immutable _signer;

    /**
     * @dev Initializes the account with the address of the native signer.
     */
    constructor(address signerAddr) {
        _signer = signerAddr;
    }

    /**
     * @dev Return the account's signer address.
     */
    function signer() public view virtual returns (address) {
        return _signer;
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
     * @dev Validates the signature using the account's signer.S
     */
    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}
