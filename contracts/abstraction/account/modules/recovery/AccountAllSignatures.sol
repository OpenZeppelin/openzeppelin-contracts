// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../../interfaces/IERC4337.sol";
import {AccountECDSA} from "./AccountECDSA.sol";
import {AccountERC1271} from "./AccountERC1271.sol";

abstract contract AccountAllSignatures is AccountECDSA, AccountERC1271 {
    enum SignatureType {
        ECDSA, // secp256k1
        ERC1271 // others through erc1271 identity (support P256, RSA, ...)
    }

    function _recoverSigner(
        bytes memory signature,
        bytes32 userOpHash
    ) internal virtual override(AccountECDSA, AccountERC1271) returns (address) {
        (SignatureType sigType, bytes memory sigData) = abi.decode(signature, (SignatureType, bytes));

        if (sigType == SignatureType.ECDSA) {
            return AccountECDSA._recoverSigner(sigData, userOpHash);
        } else if (sigType == SignatureType.ERC1271) {
            return AccountERC1271._recoverSigner(sigData, userOpHash);
        } else {
            return address(0);
        }
    }
}
