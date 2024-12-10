// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/draft-IERC4337.sol";
import {ERC4337Utils} from "../account/utils/draft-ERC4337Utils.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
// import {ERC1155HolderLean, IERC1155Receiver} from "../token/ERC1155/utils/ERC1155HolderLean.sol";
import {ERC1155Holder, IERC1155Receiver} from "../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {IERC165} from "../utils/introspection/IERC165.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {AccountBase} from "./draft-AccountBase.sol";
import {ERC7739Signer, EIP712} from "../utils/cryptography/draft-ERC7739Signer.sol";
import {Initializable} from "../proxy/utils/Initializable.sol";

/**
 * @dev Account implementation using {ECDSA} signatures and {ERC7739Signer} for replay protection.
 *
 * An {_initializeSigner} function is provided to set the account's signer address. Doing so it's
 * easier for a factory, whose likely to use initializable clones of this contract.
 *
 * IMPORTANT: Avoiding to call {_initializeSigner} either during construction (if used standalone)
 * or during initialization (if used as a clone) may leave the account unusable.
 */
abstract contract AccountECDSA is ERC165, ERC721Holder, ERC1155Holder, ERC7739Signer, AccountBase {
    using MessageHashUtils for bytes32;

    /**
     * @dev The {signer} is already initialized.
     */
    error AccountECDSAUninitializedSigner(address signer);

    address private _signer;

    /**
     * @dev Initializes the account with the address of the native signer. This function is called only once.
     */
    function _initializeSigner(address signerAddr) internal {
        if (_signer != address(0)) revert AccountECDSAUninitializedSigner(signerAddr);
        _signer = signerAddr;
    }

    /**
     * @dev Return the account's signer address.
     */
    function signer() public view virtual returns (address) {
        return _signer;
    }

    /**
     * @dev Returns the ERC-191 signed `userOpHash` hashed with keccak256 using `personal_sign`.
     */
    function _userOpSignedHash(
        PackedUserOperation calldata /* userOp */,
        bytes32 userOpHash
    ) internal view virtual override returns (bytes32) {
        return userOpHash.toEthSignedMessageHash();
    }

    /**
     * @dev Internal version of {validateUserOp} that relies on {_validateSignature}.
     *
     * The `userOpSignedHash` is the digest from {_userOpSignedHash}.
     *
     * NOTE: To override the signature functionality, try overriding {_validateSignature} instead.
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpSignedHash
    ) internal view virtual override returns (uint256) {
        return
            _isValidSignature(userOpSignedHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /**
     * @dev Validates the signature using the account's signer.
     *
     * This function provides a nested EIP-712 hash. Developers must override only this
     * function to ensure no raw message signing is possible.
     */
    function _validateSignature(
        bytes32 nestedEIP712Hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(nestedEIP712Hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, ERC1155Holder) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}
