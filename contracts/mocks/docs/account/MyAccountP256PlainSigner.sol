// contracts/MyAccountP256PlainSigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccountBase, PackedUserOperation} from "../../../account/AccountBase.sol";
import {ERC1271TypedSigner} from "../../../account/ERC1271TypedSigner.sol";
import {P256} from "../../../utils/cryptography/P256.sol";
import {ERC4337Utils} from "../../../account/utils/ERC4337Utils.sol";
import {MessageHashUtils} from "../../../utils/cryptography/MessageHashUtils.sol";

contract MyAccountP256PlainSigner is AccountBase {
    bytes32 private immutable qx;
    bytes32 private immutable qy;

    constructor(bytes32 qx_, bytes32 qy_) {
        qx = qx_;
        qy = qy_;
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (address, uint256) {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(
            abi.encodePacked(block.chainid, address(this), userOpHash)
        );
        // parse signature
        bytes32 r = bytes32(userOp.signature[0x00:0x20]);
        bytes32 s = bytes32(userOp.signature[0x20:0x40]);
        return
            P256.verify(messageHash, r, s, qx, qy)
                ? (address(this), ERC4337Utils.SIG_VALIDATION_SUCCESS)
                : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }
}
