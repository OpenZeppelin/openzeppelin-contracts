// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../../utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {Account} from "./Account.sol";

abstract contract AccountECDSA is Account {
    function _getSignerAndWindow(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (address, uint48, uint48) {
        bytes32 msgHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        // This implementation support both "normal" and short signature formats:
        // - If signature length is 65, process as "normal" signature (R,S,V)
        // - If signature length is 64, process as https://eips.ethereum.org/EIPS/eip-2098[ERC-2098 short signature] (R,SV) ECDSA signature
        // This is safe because the UserOperations include a nonce (which is managed by the entrypoint) for replay protection.
        bytes calldata signature = userOp.signature;
        if (signature.length == 65) {
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(msgHash, signature);
            return (err == ECDSA.RecoverError.NoError ? recovered : address(0), 0, 0);
        } else if (signature.length == 64) {
            bytes32 r;
            bytes32 vs;
            /// @solidity memory-safe-assembly
            assembly {
                r := calldataload(add(signature.offset, 0x20))
                vs := calldataload(add(signature.offset, 0x40))
            }
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(msgHash, r, vs);
            return (err == ECDSA.RecoverError.NoError ? recovered : address(0), 0, 0);
        } else {
            return (address(0), 0, 0);
        }
    }
}
