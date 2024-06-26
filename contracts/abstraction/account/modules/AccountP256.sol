// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../../../utils/cryptography/MessageHashUtils.sol";
import {P256} from "../../../utils/cryptography/P256.sol";
import {Account} from "../Account.sol";

abstract contract AccountP256 is Account {
    error P256InvalidSignatureLength(uint256 length);

    function _recoverSigner(bytes memory signature, bytes32 userOpHash) internal virtual override returns (address) {
        bytes32 msgHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);

        // This implementation support signature that are 65 bytes long in the (R,S,V) format
        if (signature.length == 65) {
            uint256 r;
            uint256 s;
            uint8 v;
            /// @solidity memory-safe-assembly
            assembly {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
            return P256.recoveryAddress(uint256(msgHash), v, r, s);
        } else if (signature.length == 128) {
            uint256 qx;
            uint256 qy;
            uint256 r;
            uint256 s;
            /// @solidity memory-safe-assembly
            assembly {
                qx := mload(add(signature, 0x20))
                qy := mload(add(signature, 0x40))
                r := mload(add(signature, 0x60))
                s := mload(add(signature, 0x80))
            }
            // can qx be reconstructed from qy to reduce size of signatures?

            // this can leverage EIP-7212 precompile if available
            return P256.verify(uint256(msgHash), r, s, qx, qy) ? P256.getAddress(qx, qy) : address(0);
        } else {
            return address(0);
        }
    }
}
