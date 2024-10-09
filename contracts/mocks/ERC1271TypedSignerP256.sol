// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {P256} from "../utils/cryptography/P256.sol";
import {ERC1271TypedSigner} from "../utils/cryptography/ERC1271TypedSigner.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

contract ERC1271TypedSignerP256 is ERC1271TypedSigner {
    bytes32 private immutable _qx;
    bytes32 private immutable _qy;

    constructor(bytes32 qx, bytes32 qy) EIP712("ERC1271TypedSignerP256", "1") {
        _qx = qx;
        _qy = qy;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);
        return P256.verify(hash, r, s, _qx, _qy);
    }
}
