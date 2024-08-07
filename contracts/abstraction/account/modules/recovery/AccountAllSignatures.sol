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
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view virtual override(AccountECDSA, AccountERC1271) returns (address) {
        SignatureType sigType = SignatureType(uint8(bytes1(signature)));

        if (sigType == SignatureType.ECDSA) {
            return AccountECDSA._recoverSigner(userOpHash, signature[0x01:]);
        } else if (sigType == SignatureType.ERC1271) {
            return AccountERC1271._recoverSigner(userOpHash, signature[0x01:]);
        } else {
            return address(0);
        }
    }
}
