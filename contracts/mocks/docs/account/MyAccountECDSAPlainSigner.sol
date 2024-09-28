// contracts/MyAccountECDSAPlainSigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccountBase, PackedUserOperation} from "../../../account/AccountBase.sol";
import {ERC1271TypedSigner} from "../../../utils/cryptography/ERC1271TypedSigner.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {ERC4337Utils} from "../../../account/utils/ERC4337Utils.sol";
import {MessageHashUtils} from "../../../utils/cryptography/MessageHashUtils.sol";

contract MyAccountECDSAPlainSigner is AccountBase {
    address private immutable _signer;

    constructor(address signer_) {
        _signer = signer_;
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (address, uint256) {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(
            abi.encodePacked(block.chainid, address(this), userOpHash)
        );
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(messageHash, userOp.signature);
        return
            _signer == recovered && err == ECDSA.RecoverError.NoError
                ? (_signer, ERC4337Utils.SIG_VALIDATION_SUCCESS)
                : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }
}
