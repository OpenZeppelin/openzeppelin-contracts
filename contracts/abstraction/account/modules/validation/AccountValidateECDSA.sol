// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Account} from "../../Account.sol";
import {ECDSA} from "../../../../utils/cryptography/ECDSA.sol";
import {ERC4337Utils} from "./../../../utils/ERC4337Utils.sol";
import {MessageHashUtils} from "../../../../utils/cryptography/MessageHashUtils.sol";
import {PackedUserOperation} from "../../../../interfaces/IERC4337.sol";

abstract contract AccountValidateECDSA is Account {
    /**
     * @dev Hook used to verify the validity of recovered signers.
     *
     * Must be implemented by some access control management system to validate which EOA is authorised to sign user
     * operations for this account.
     */
    function _isSigner(address) internal view virtual returns (bool) {
        return false;
    }

    /// @inheritdoc Account
    function _validateUserOp(
        PackedUserOperation calldata /*userOp*/,
        bytes32 userOpHash,
        bytes calldata userOpSignature
    ) internal virtual override returns (address, uint256) {
        bytes32 msgHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);

        // This implementation support both "normal" and short signature formats:
        // - If signature length is 65, process as "normal" signature (R,S,V)
        // - If signature length is 64, process as https://eips.ethereum.org/EIPS/eip-2098[ERC-2098 short signature] (R,SV) ECDSA signature
        // This is safe because the UserOperations include a nonce (which is managed by the entrypoint) for replay protection.
        if (userOpSignature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            /// @solidity memory-safe-assembly
            assembly {
                r := calldataload(add(userOpSignature.offset, 0x00))
                s := calldataload(add(userOpSignature.offset, 0x20))
                v := byte(0, calldataload(add(userOpSignature.offset, 0x40)))
            }
            (address signer, ECDSA.RecoverError err, ) = ECDSA.tryRecover(msgHash, v, r, s);
            return
                _isSigner(signer) && err == ECDSA.RecoverError.NoError
                    ? (signer, ERC4337Utils.SIG_VALIDATION_SUCCESS)
                    : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        } else if (userOpSignature.length == 64) {
            bytes32 r;
            bytes32 vs;
            /// @solidity memory-safe-assembly
            assembly {
                r := calldataload(add(userOpSignature.offset, 0x00))
                vs := calldataload(add(userOpSignature.offset, 0x20))
            }
            (address signer, ECDSA.RecoverError err, ) = ECDSA.tryRecover(msgHash, r, vs);
            return
                _isSigner(signer) && err == ECDSA.RecoverError.NoError
                    ? (signer, ERC4337Utils.SIG_VALIDATION_SUCCESS)
                    : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        } else {
            return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        }
    }
}
