// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {AccountECDSA} from "./AccountECDSA.sol";
import {AccountP256} from "./AccountP256.sol";

abstract contract AccountAllSignatures is AccountECDSA, AccountP256 {
    enum SignatureType {
        ECDSA, // secp256k1
        P256 // secp256r1
    }

    function _recoverSigner(
        bytes memory signature,
        bytes32 userOpHash
    ) internal virtual override(AccountECDSA, AccountP256) returns (address) {
        (SignatureType sigType, bytes memory sigData) = abi.decode(signature, (SignatureType, bytes));

        if (sigType == SignatureType.ECDSA) {
            return AccountECDSA._recoverSigner(sigData, userOpHash);
        } else if (sigType == SignatureType.P256) {
            return AccountP256._recoverSigner(sigData, userOpHash);
        } else {
            return address(0);
        }
    }
}
