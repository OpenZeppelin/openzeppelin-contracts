// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../../../utils/cryptography/MessageHashUtils.sol";
import {P256} from "../../../utils/cryptography/P256.sol";
import {Account} from "../Account.sol";

abstract contract AccountP256 is Account {
    error P256InvalidSignatureLength(uint256 length);

    function _processSignature(
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
            bytes32 r;
            bytes32 s;
            uint8 v;
            /// @solidity memory-safe-assembly
            assembly {
                r := calldataload(add(signature.offset, 0x00))
                s := calldataload(add(signature.offset, 0x20))
                v := byte(0, calldataload(add(signature.offset, 0x40)))
            }
            return (P256.recoveryAddress(uint256(msgHash), v, uint256(r), uint256(s)), 0, 0);
        } else {
            revert P256InvalidSignatureLength(signature.length);
        }
    }
}
