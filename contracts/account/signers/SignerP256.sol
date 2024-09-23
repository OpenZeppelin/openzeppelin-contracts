// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {P256} from "../../utils/cryptography/P256.sol";
import {EIP712ReadableSigner} from "./EIP712ReadableSigner.sol";

abstract contract SignerP256 is EIP712ReadableSigner {
    bytes32 private immutable _qx;
    bytes32 private immutable _qy;

    function signer() public view virtual returns (bytes32 qx, bytes32 qy) {
        return (_qx, _qy);
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        if (signature.length < 0x40) return false;

        // parse signature
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);

        // fetch and decode immutable public key for the clone
        (bytes32 qx, bytes32 qy) = signer();
        return P256.verify(hash, r, s, qx, qy);
    }
}
