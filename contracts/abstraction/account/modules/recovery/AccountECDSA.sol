// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../../../../utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "../../../../utils/cryptography/ECDSA.sol";
import {Account} from "../../Account.sol";

abstract contract AccountECDSA is Account {
    function _recoverSigner(
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view virtual override returns (address signer) {
        bytes32 msgHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);

        // This implementation support both "normal" and short signature formats:
        // - If signature length is 65, process as "normal" signature (R,S,V)
        // - If signature length is 64, process as https://eips.ethereum.org/EIPS/eip-2098[ERC-2098 short signature] (R,SV) ECDSA signature
        // This is safe because the UserOperations include a nonce (which is managed by the entrypoint) for replay protection.
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            /// @solidity memory-safe-assembly
            assembly {
                r := calldataload(add(signature.offset, 0x00))
                s := calldataload(add(signature.offset, 0x20))
                v := byte(0, calldataload(add(signature.offset, 0x40)))
            }
            (signer, , ) = ECDSA.tryRecover(msgHash, v, r, s); // return address(0) on errors
        } else if (signature.length == 64) {
            bytes32 r;
            bytes32 vs;
            /// @solidity memory-safe-assembly
            assembly {
                r := calldataload(add(signature.offset, 0x00))
                vs := calldataload(add(signature.offset, 0x20))
            }
            (signer, , ) = ECDSA.tryRecover(msgHash, r, vs);
        } else {
            return address(0);
        }
    }
}
